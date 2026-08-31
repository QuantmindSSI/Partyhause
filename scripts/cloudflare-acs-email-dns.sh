#!/usr/bin/env bash
# Publish the Azure Communication Services email DNS records for partyhause.com
# on Cloudflare, idempotently.
#
# WHY A SCRIPT
#   Two of these records have failure modes that are invisible in the dashboard:
#
#   1. The DKIM entries are CNAMEs. Cloudflare defaults new CNAMEs to PROXIED
#      (orange cloud) in the UI. A proxied DKIM record resolves to Cloudflare's
#      own addresses, the selector lookup fails, and ACS never verifies. This
#      script forces proxied=false.
#
#   2. A domain may carry exactly one SPF record. partyhause.com already
#      publishes "v=spf1 include:zohomail.eu ~all" for Zoho. Adding a second
#      SPF TXT is a permerror under RFC 7208 and breaks BOTH senders. This
#      script MERGES the Azure include into the existing record instead.
#
# USAGE
#   export CLOUDFLARE_API_TOKEN=<token with Zone:DNS:Edit on partyhause.com>
#   ./scripts/cloudflare-acs-email-dns.sh            # apply
#   DRY_RUN=1 ./scripts/cloudflare-acs-email-dns.sh  # show what would change
#
# The token needs exactly one permission: Zone -> DNS -> Edit, scoped to
# partyhause.com. Nothing else.

set -euo pipefail

ZONE_NAME="${ZONE_NAME:-partyhause.com}"
DOMAIN_VERIFICATION_VALUE="${DOMAIN_VERIFICATION_VALUE:-ms-domain-verification=836725f2-4e78-4020-aff5-461d12d6d6ad}"
AZURE_SPF_INCLUDE="include:spf.protection.outlook.com"
DKIM1_NAME="selector1-azurecomm-prod-net._domainkey"
DKIM1_TARGET="selector1-azurecomm-prod-net._domainkey.azurecomm.net"
DKIM2_NAME="selector2-azurecomm-prod-net._domainkey"
DKIM2_TARGET="selector2-azurecomm-prod-net._domainkey.azurecomm.net"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN is not set." >&2
  echo "Create one at https://dash.cloudflare.com/profile/api-tokens" >&2
  echo "Permissions: Zone -> DNS -> Edit, scoped to ${ZONE_NAME}" >&2
  exit 1
fi

API="https://api.cloudflare.com/client/v4"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

cf() { curl -sS --max-time 30 "${AUTH[@]}" "$@"; }

die() { echo "ERROR: $*" >&2; exit 1; }

ok() {
  python3 -c "
import sys,json
d=json.load(sys.stdin)
if not d.get('success'):
    print('cloudflare error:', json.dumps(d.get('errors')), file=sys.stderr); sys.exit(1)
" || die "Cloudflare API call failed"
}

echo "==> Resolving zone ${ZONE_NAME}"
ZONE_JSON="$(cf "${API}/zones?name=${ZONE_NAME}")"
ZONE_ID="$(printf '%s' "$ZONE_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if not d.get('success'): print('', end=''); sys.exit(0)
r=d.get('result') or []
print(r[0]['id'] if r else '', end='')
")"
[[ -n "$ZONE_ID" ]] || die "Zone ${ZONE_NAME} not found, or the token lacks access to it."
echo "    zone id: ${ZONE_ID}"

# ---------- helper: create or update a record ----------
upsert() {
  local type="$1" name="$2" content="$3" proxied="$4"
  local fqdn="$name"
  [[ "$name" == "@" ]] && fqdn="$ZONE_NAME"
  [[ "$name" != "$ZONE_NAME" && "$name" != "@" ]] && fqdn="${name}.${ZONE_NAME}"

  local existing
  existing="$(cf "${API}/zones/${ZONE_ID}/dns_records?type=${type}&name=${fqdn}")"
  local rec_id
  rec_id="$(printf '%s' "$existing" | python3 -c "
import sys,json
d=json.load(sys.stdin); r=d.get('result') or []
target=${content@Q}
for x in r:
    if x.get('content','').strip('\"')==target.strip('\"'):
        print(x['id'], end=''); break
" 2>/dev/null || true)"

  local payload
  payload="$(python3 -c "
import json,sys
print(json.dumps({'type':'${type}','name':'${fqdn}','content':sys.argv[1],'ttl':3600,'proxied':${proxied}}))
" "$content")"

  if [[ -n "$rec_id" ]]; then
    echo "    [=] ${type} ${fqdn} already correct"
    return 0
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "    [+] WOULD CREATE ${type} ${fqdn} -> ${content} (proxied=${proxied})"
    return 0
  fi

  printf '%s' "$payload" | cf -X POST "${API}/zones/${ZONE_ID}/dns_records" --data @- | ok
  echo "    [+] created ${type} ${fqdn} -> ${content} (proxied=${proxied})"
}

echo "==> DKIM CNAMEs (forced DNS-only; a proxied DKIM record never verifies)"
upsert CNAME "$DKIM1_NAME" "$DKIM1_TARGET" false
upsert CNAME "$DKIM2_NAME" "$DKIM2_TARGET" false

echo "==> Domain ownership TXT"
upsert TXT "$ZONE_NAME" "$DOMAIN_VERIFICATION_VALUE" false

echo "==> SPF (merge, never duplicate)"
SPF_JSON="$(cf "${API}/zones/${ZONE_ID}/dns_records?type=TXT&name=${ZONE_NAME}")"
read -r SPF_ID SPF_CUR <<<"$(printf '%s' "$SPF_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for x in (d.get('result') or []):
    c=x.get('content','').strip('\"')
    if c.startswith('v=spf1'):
        print(x['id'], c); break
")" || true

if [[ -z "${SPF_ID:-}" ]]; then
  upsert TXT "$ZONE_NAME" "v=spf1 ${AZURE_SPF_INCLUDE} ~all" false
elif [[ "$SPF_CUR" == *"$AZURE_SPF_INCLUDE"* ]]; then
  echo "    [=] SPF already includes ${AZURE_SPF_INCLUDE}"
else
  MERGED="$(python3 -c "
import sys
cur=sys.argv[1].split()
inc=sys.argv[2]
qual=[t for t in cur if t in ('~all','-all','?all','+all')]
body=[t for t in cur if t not in qual]
print(' '.join(body+[inc]+ (qual or ['~all'])))
" "$SPF_CUR" "$AZURE_SPF_INCLUDE")"
  echo "    current: ${SPF_CUR}"
  echo "    merged : ${MERGED}"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "    [~] WOULD UPDATE SPF"
  else
    python3 -c "
import json,sys
print(json.dumps({'type':'TXT','name':sys.argv[1],'content':sys.argv[2],'ttl':3600,'proxied':False}))
" "$ZONE_NAME" "$MERGED" | cf -X PUT "${API}/zones/${ZONE_ID}/dns_records/${SPF_ID}" --data @- | ok
    echo "    [~] SPF updated"
  fi
fi

echo "==> DMARC (monitor-only to start; tighten after observing reports)"
upsert TXT "_dmarc" "v=DMARC1; p=none; rua=mailto:dmarc@${ZONE_NAME}; fo=1" false

echo
echo "Done. Propagation is usually under a minute on Cloudflare."
echo "Next: trigger ACS verification, then set linkCustomEmailDomain=true and redeploy."
