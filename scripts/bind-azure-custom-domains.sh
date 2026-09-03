#!/usr/bin/env bash
#
# Bind partyhause.com and www.partyhause.com to the web Container App and
# issue Azure managed certificates for both.
#
# Run this AFTER the DNS records exist:
#
#   CLOUDFLARE_API_TOKEN=... python3 scripts/cloudflare-acs-email-dns.py \
#       --azure-web --verification-token 836725f2-4e78-4020-aff5-461d12d6d6ad
#
# The script refuses to call Azure until DNS actually resolves to the right
# targets. Binding against wrong or unpropagated records produces a hostname in
# a permanent failed state that then has to be deleted before retrying, so the
# preflight is cheaper than the recovery.
#
# Idempotent: hostnames already bound are detected and skipped.

set -euo pipefail

SUBSCRIPTION="59346494-43d4-4ef7-b364-6a688d9eb445"
RESOURCE_GROUP="rg-partyhause-prod"
APP="ca-web-partyhause-gipkzrenusqpy"
ENVIRONMENT="cae-partyhause-gipkzrenusqpy"
APEX="partyhause.com"
WWW="www.partyhause.com"

APP_FQDN="ca-web-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io"
ENV_STATIC_IP="20.22.165.141"
ASUID="A1649ACA37F3077A3425C0DD96A3D8E44AFFBAF436A1C392628176A375203CB8"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

command -v az  >/dev/null 2>&1 || fail "az CLI not found on PATH."
command -v dig >/dev/null 2>&1 || fail "dig not found on PATH."

# ---------------------------------------------------------------------------
# Subscription. The account defaults to a different subscription, and querying
# the wrong one returns empty results that read exactly like "not configured",
# so this is set explicitly rather than assumed.
# ---------------------------------------------------------------------------
echo "==> Selecting subscription"
az account set --subscription "$SUBSCRIPTION" \
  || fail "Could not select subscription $SUBSCRIPTION. Run 'az login' first."
echo "    $(az account show --query name -o tsv)"

# ---------------------------------------------------------------------------
# DNS preflight. Queried against Cloudflare's authoritative nameserver rather
# than the local resolver so a stale cache cannot produce a false pass.
# ---------------------------------------------------------------------------
NS="adel.ns.cloudflare.com"

check_dns() {
  local label="$1" rtype="$2" name="$3" expected="$4" actual
  actual="$(dig +short "@${NS}" "$rtype" "$name" 2>/dev/null | tr -d '"' | sed 's/\.$//' | head -1)"
  if [ -z "$actual" ]; then
    echo "    [x] $label: no $rtype record for $name"
    return 1
  fi
  if [ "$actual" != "$expected" ]; then
    echo "    [x] $label: $name -> $actual (expected $expected)"
    return 1
  fi
  echo "    [=] $label: $name -> $actual"
  return 0
}

echo "==> DNS preflight (authoritative: $NS)"
DNS_OK=0
check_dns "www CNAME"  CNAME "$WWW"           "$APP_FQDN"      || DNS_OK=1
check_dns "www asuid"  TXT   "asuid.$WWW"     "$ASUID"         || DNS_OK=1
check_dns "apex A"     A     "$APEX"          "$ENV_STATIC_IP" || DNS_OK=1
check_dns "apex asuid" TXT   "asuid.$APEX"    "$ASUID"         || DNS_OK=1

if [ "$DNS_OK" -ne 0 ]; then
  echo
  fail "DNS is not in the expected state. Publish the records first, then re-run."
fi

# ---------------------------------------------------------------------------
# Cloudflare proxy check. A proxied (orange cloud) record answers from
# Cloudflare's edge IPs, and Azure's managed certificate issuance then fails
# because it cannot reach the origin for validation. The apex A record is the
# one that shows this: if the address is not the environment static IP, the
# record is being proxied regardless of what the API reports.
# ---------------------------------------------------------------------------
PUBLIC_APEX="$(dig +short A "$APEX" 2>/dev/null | head -1)"
if [ -n "$PUBLIC_APEX" ] && [ "$PUBLIC_APEX" != "$ENV_STATIC_IP" ]; then
  fail "Apex resolves publicly to $PUBLIC_APEX, not $ENV_STATIC_IP. The record is
       proxied by Cloudflare. Set it to DNS only (grey cloud); a proxied record
       cannot complete Azure managed-certificate validation."
fi

# ---------------------------------------------------------------------------
# Bind. `hostname add` registers the domain; `hostname bind` without a
# --certificate argument makes Azure create and attach a managed certificate.
#
# Validation method differs by record type:
#
#   www  - CNAME validation. The CNAME already points at the app, which is
#          proof enough, and issuance completes without further records.
#
#   apex - HTTP validation, NOT TXT. This is the non-obvious one. TXT
#          validation does not use the asuid record: Azure mints a fresh ACME
#          challenge token, prints it, and then waits for it to appear at
#          _acme-challenge.partyhause.com. The CLI blocks while waiting and
#          fails with CertificateProvisioningError before there is any chance
#          to publish it, so TXT is unusable in a single non-interactive pass.
#          HTTP validation needs no DNS record at all, because the apex A
#          record already resolves to the environment ingress, and it succeeds
#          on the first attempt.
# ---------------------------------------------------------------------------
bind_hostname() {
  local hostname="$1" method="$2"

  if az containerapp hostname list -n "$APP" -g "$RESOURCE_GROUP" \
       --query "[?name=='${hostname}'].name" -o tsv 2>/dev/null | grep -q "$hostname"; then
    echo "    [=] $hostname already registered"
  else
    echo "    [+] adding $hostname"
    az containerapp hostname add -n "$APP" -g "$RESOURCE_GROUP" \
      --hostname "$hostname" --output none \
      || fail "Failed to add $hostname."
  fi

  echo "    [+] binding $hostname (managed certificate, validation=$method)"
  az containerapp hostname bind -n "$APP" -g "$RESOURCE_GROUP" \
    --hostname "$hostname" --environment "$ENVIRONMENT" \
    --validation-method "$method" --output none \
    || fail "Failed to bind $hostname. Certificate issuance can take a few
       minutes; if this is a timeout rather than a rejection, re-run."
}

echo "==> Binding hostnames"
bind_hostname "$WWW"  CNAME
bind_hostname "$APEX" HTTP

# ---------------------------------------------------------------------------
# Verify. A managed certificate can take several minutes to issue, so a
# non-200 here is not necessarily a failure; it is reported rather than
# treated as one.
# ---------------------------------------------------------------------------
echo "==> Bound domains"
az containerapp hostname list -n "$APP" -g "$RESOURCE_GROUP" \
  --query "[].{host:name, binding:bindingType}" -o table 2>/dev/null || true

echo "==> HTTPS check"
for host in "$WWW" "$APEX"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 30 "https://${host}" 2>/dev/null || echo 000)"
  echo "    https://${host} -> ${code}"
done

echo
echo "Done. A 000 or 5xx immediately after binding usually means the managed"
echo "certificate is still issuing. Re-check in a few minutes before treating"
echo "it as a failure."
