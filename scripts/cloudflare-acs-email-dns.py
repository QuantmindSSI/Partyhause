#!/usr/bin/env python3
"""
Publish the Azure Communication Services email DNS records for a domain on
Cloudflare, idempotently.

WHY THIS EXISTS
    Two of the four records Azure requires have failure modes that are silent
    in the Cloudflare dashboard:

    1. DKIM is published as CNAMEs, and Cloudflare defaults new CNAMEs to
       PROXIED (orange cloud) in the UI. A proxied DKIM record resolves to
       Cloudflare's own addresses, the selector lookup fails, and the domain
       never verifies. Every record here is forced to proxied=False.

    2. A domain may carry exactly one SPF record. Publishing a second SPF TXT
       is a permerror under RFC 7208 and breaks every sender on the domain.
       This merges the Azure include into the existing record instead.

Stdlib only, no third-party HTTP client, so it runs anywhere Python 3 does.

USAGE
    export CLOUDFLARE_API_TOKEN=<token with DNS edit rights on the zone>
    python3 scripts/cloudflare-acs-email-dns.py --dry-run
    python3 scripts/cloudflare-acs-email-dns.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API_ROOT = "https://api.cloudflare.com/client/v4"
TIMEOUT_SECONDS = 30
DEFAULT_TTL = 3600

# Azure Container Apps custom-domain binding for the web app.
# Two records are required before `az containerapp hostname bind` will issue a
# managed certificate:
#   asuid.www  TXT    the container app's customDomainVerificationId
#   www        CNAME  the container app's default FQDN
# www.partyhause.com currently points at ca-web-partyhause-l2apcqjqxo6qu, a
# container app in an environment that no longer exists, so the domain has been
# serving nothing.
AZURE_WEB_FQDN = "ca-web-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io"
AZURE_DOMAIN_VERIFICATION_ID = "A1649ACA37F3077A3425C0DD96A3D8E44AFFBAF436A1C392628176A375203CB8"
# Static ingress IP of the Container Apps environment, used for the apex A
# record. Stable for the life of the environment; it changes if the environment
# is recreated, which is exactly what stranded the previous www CNAME.
AZURE_ENV_STATIC_IP = "20.22.165.141"

DKIM_RECORDS = [
    ("selector1-azurecomm-prod-net._domainkey",
     "selector1-azurecomm-prod-net._domainkey.azurecomm.net"),
    ("selector2-azurecomm-prod-net._domainkey",
     "selector2-azurecomm-prod-net._domainkey.azurecomm.net"),
]
AZURE_SPF_INCLUDE = "include:spf.protection.outlook.com"
SPF_QUALIFIERS = ("~all", "-all", "?all", "+all")


class CloudflareError(RuntimeError):
    """Raised when the Cloudflare API reports failure."""


def request(token: str, method: str, path: str, payload: dict | None = None) -> dict:
    """
    Issue one Cloudflare API call.

    :param path: Path below /client/v4, without a leading slash.
    :returns: The decoded ``result`` envelope.
    :raises CloudflareError: on transport failure or ``success: false``.
    """
    url = f"{API_ROOT}/{path}"
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            decoded = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise CloudflareError(f"{method} {path} -> HTTP {exc.code}: {detail[:400]}") from exc
    except urllib.error.URLError as exc:
        raise CloudflareError(f"{method} {path} -> transport failure: {exc.reason}") from exc
    if not decoded.get("success"):
        raise CloudflareError(f"{method} {path} -> {json.dumps(decoded.get('errors'))}")
    return decoded


def zone_id(token: str, zone_name: str) -> str:
    """Resolve a zone name to its id, or fail loudly."""
    query = urllib.parse.urlencode({"name": zone_name})
    result = request(token, "GET", f"zones?{query}").get("result") or []
    if not result:
        raise CloudflareError(f"Zone {zone_name} not found, or the token cannot see it")
    return result[0]["id"]


def find_records(token: str, zid: str, rtype: str, fqdn: str) -> list[dict]:
    query = urllib.parse.urlencode({"type": rtype, "name": fqdn})
    return request(token, "GET", f"zones/{zid}/dns_records?{query}").get("result") or []


def fqdn_for(zone_name: str, name: str) -> str:
    return zone_name if name in ("@", zone_name) else f"{name}.{zone_name}"


def upsert(token: str, zid: str, zone_name: str, rtype: str, name: str,
           content: str, dry_run: bool) -> str:
    """
    Create a record unless an identical one already exists.

    Always sets ``proxied=False``: a proxied DKIM CNAME can never verify, and
    none of these record types benefit from proxying.

    :returns: One of ``unchanged``, ``created``, ``would-create``.
    """
    fqdn = fqdn_for(zone_name, name)
    existing = find_records(token, zid, rtype, fqdn)
    for record in existing:
        if record.get("content", "").strip('"') == content.strip('"'):
            print(f"    [=] {rtype} {fqdn} already correct")
            return "unchanged"
    if dry_run:
        print(f"    [+] WOULD CREATE {rtype} {fqdn} -> {content}")
        return "would-create"
    request(token, "POST", f"zones/{zid}/dns_records", {
        "type": rtype, "name": fqdn, "content": content,
        "ttl": DEFAULT_TTL, "proxied": False,
    })
    print(f"    [+] created {rtype} {fqdn} -> {content}")
    return "created"


def merge_spf(current: str, include: str) -> str:
    """
    Insert an include mechanism ahead of the SPF qualifier.

    ``v=spf1 include:zohomail.eu ~all`` plus ``include:spf.protection.outlook.com``
    becomes ``v=spf1 include:zohomail.eu include:spf.protection.outlook.com ~all``.
    Order matters: mechanisms after ``all`` are never evaluated.
    """
    tokens = current.split()
    qualifiers = [t for t in tokens if t in SPF_QUALIFIERS]
    body = [t for t in tokens if t not in SPF_QUALIFIERS]
    return " ".join(body + [include] + (qualifiers or ["~all"]))


def apply_spf(token: str, zid: str, zone_name: str, dry_run: bool) -> str:
    """Merge the Azure include into the zone's single SPF record."""
    print("==> SPF (merge, never duplicate)")
    spf = None
    for record in find_records(token, zid, "TXT", zone_name):
        if record.get("content", "").strip('"').startswith("v=spf1"):
            spf = record
            break
    if spf is None:
        return upsert(token, zid, zone_name, "TXT", zone_name,
                      f"v=spf1 {AZURE_SPF_INCLUDE} ~all", dry_run)
    current = spf["content"].strip('"')
    if AZURE_SPF_INCLUDE in current:
        print(f"    [=] SPF already includes {AZURE_SPF_INCLUDE}")
        return "unchanged"
    merged = merge_spf(current, AZURE_SPF_INCLUDE)
    print(f"    current: {current}")
    print(f"    merged : {merged}")
    lookups = merged.count("include:")
    print(f"    DNS lookups: {lookups} of 10 permitted (RFC 7208)")
    if dry_run:
        print("    [~] WOULD UPDATE SPF")
        return "would-update"
    request(token, "PUT", f"zones/{zid}/dns_records/{spf['id']}", {
        "type": "TXT", "name": zone_name, "content": merged,
        "ttl": DEFAULT_TTL, "proxied": False,
    })
    print("    [~] SPF updated")
    return "updated"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zone", default="partyhause.com")
    parser.add_argument("--verification-token", required=True,
                        help="Value of the Azure ms-domain-verification TXT record")
    parser.add_argument("--dmarc-policy", default="none", choices=["none", "quarantine", "reject"])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--azure-web", action="store_true",
                        help="Also publish the Azure Container Apps custom-domain records for www")
    args = parser.parse_args()

    token = (os.environ.get("CLOUDFLARE_API_TOKEN") or "").strip()
    if not token:
        print("ERROR: CLOUDFLARE_API_TOKEN is not set.", file=sys.stderr)
        return 1

    zone = args.zone
    try:
        print(f"==> Resolving zone {zone}")
        zid = zone_id(token, zone)
        print(f"    zone id: {zid}")

        print("==> DKIM CNAMEs (forced DNS-only; a proxied DKIM record never verifies)")
        for name, target in DKIM_RECORDS:
            upsert(token, zid, zone, "CNAME", name, target, args.dry_run)

        print("==> Domain ownership TXT")
        upsert(token, zid, zone, "TXT", zone,
               f"ms-domain-verification={args.verification_token}", args.dry_run)

        apply_spf(token, zid, zone, args.dry_run)

        if args.azure_web:
            print("==> Azure Container Apps custom domains")

            # www: CNAME to the app FQDN.
            # Replace, not add: the existing CNAME points at a deleted app in a
            # deleted environment, which is why www currently answers nothing.
            for rec in find_records(token, zid, "CNAME", f"www.{zone}"):
                if rec.get("content") != AZURE_WEB_FQDN:
                    print(f"    [-] stale CNAME www -> {rec.get('content')}")
                    if not args.dry_run:
                        request(token, "DELETE", f"zones/{zid}/dns_records/{rec['id']}")
                        print("    [-] removed")
            upsert(token, zid, zone, "TXT", "asuid.www",
                   AZURE_DOMAIN_VERIFICATION_ID, args.dry_run)
            upsert(token, zid, zone, "CNAME", "www", AZURE_WEB_FQDN, args.dry_run)

            # Apex: an A record to the environment's static IP. A CNAME cannot
            # live at the apex alongside SOA/NS. Cloudflare would offer CNAME
            # flattening, but that requires the record to be proxied, and a
            # proxied record breaks Azure's managed-certificate validation,
            # so the A record is the only option that leaves TLS issuable.
            #
            # The apex verification TXT is `asuid`, with no `www` label.
            #
            # The apex previously held a CNAME to the same deleted app. A CNAME
            # and an A record cannot coexist on one name, so Cloudflare rejects
            # the A record with error 81054 until the CNAME is gone. It is
            # removed here rather than by hand so a re-run cannot half-apply.
            # MX, TXT and NS records on the apex are a different type and are
            # left untouched: deleting the Zoho MX records would silently stop
            # inbound mail.
            for rec in find_records(token, zid, "CNAME", zone):
                print(f"    [-] apex CNAME {zone} -> {rec.get('content')}")
                print("        (blocks the A record; a CNAME cannot sit at the zone root)")
                if not args.dry_run:
                    request(token, "DELETE", f"zones/{zid}/dns_records/{rec['id']}")
                    print("    [-] removed")

            for rec in find_records(token, zid, "A", zone):
                if rec.get("content") != AZURE_ENV_STATIC_IP:
                    print(f"    [-] stale A {zone} -> {rec.get('content')}")
                    if not args.dry_run:
                        request(token, "DELETE", f"zones/{zid}/dns_records/{rec['id']}")
                        print("    [-] removed")
            upsert(token, zid, zone, "TXT", "asuid",
                   AZURE_DOMAIN_VERIFICATION_ID, args.dry_run)
            upsert(token, zid, zone, "A", "@", AZURE_ENV_STATIC_IP, args.dry_run)

        print(f"==> DMARC (p={args.dmarc_policy})")
        upsert(token, zid, zone, "TXT", "_dmarc",
               f"v=DMARC1; p={args.dmarc_policy}; rua=mailto:dmarc@{zone}; fo=1",
               args.dry_run)
    except CloudflareError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print()
    print("Done." if not args.dry_run else "Dry run complete, nothing changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
