# Domain Configuration Fix

## Issue
The main domain `partyhause.com` does not resolve, but `www.partyhause.com` works correctly.

## Current Status
- ✅ **www.partyhause.com** - Working (200 OK)
- ❌ **partyhause.com** - DNS resolution failure
- ✅ **partyhaus.vercel.app** - Working (200 OK)

## Root Cause
The apex domain (`partyhause.com`) is not configured with proper DNS records pointing to Vercel's servers.

## Fix Required

### Option 1: DNS Configuration (Recommended)
1. Log into your domain registrar (where you purchased partyhause.com)
2. Navigate to DNS settings
3. Add an **A Record** for the apex domain:
   ```
   Type: A
   Name: @ (or leave blank for apex)
   Value: 76.76.21.21 (Vercel's IP)
   ```
   OR add a **CNAME Record** (if supported for apex):
   ```
   Type: CNAME
   Name: @ (or leave blank)
   Value: cname.vercel-dns.com
   ```

4. Wait for DNS propagation (can take 1-48 hours)

### Option 2: Redirect apex to www (Quick Fix)
1. In domain registrar, set up URL forwarding/redirect
2. Redirect `partyhause.com` → `www.partyhause.com`
3. This ensures all traffic goes to the working www subdomain

### Option 3: Update Vercel Project Domain
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Verify both domains are added:
   - `partyhause.com` (apex)
   - `www.partyhause.com` (subdomain)
3. Vercel will provide DNS configuration instructions
4. Follow Vercel's nameserver setup or A/CNAME record instructions

## Verification Steps

After configuration, verify with:

```bash
# Check DNS resolution
dig partyhause.com

# Check HTTP response
curl -I https://partyhause.com

# Check Vercel deployment
npx vercel inspect partyhause.com
```

## Expected Result
Both URLs should return 200 OK:
- ✅ https://partyhause.com
- ✅ https://www.partyhause.com
- ✅ https://partyhaus.vercel.app

## Related Files
- `/vercel.json` - Vercel configuration (already correct)
- DNS records need to be configured at domain registrar

## Notes
- The application itself is correctly deployed on Vercel
- Only DNS configuration for the apex domain is missing
- This is a domain registrar/DNS issue, not an application issue
