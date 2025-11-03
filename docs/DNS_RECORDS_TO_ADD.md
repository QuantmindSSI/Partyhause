# 🌐 DNS Records to Add - www.partyhause.com

**Current Problem**: www.partyhause.com is pointing to Vercel (mobile app) instead of Netlify (web PWA)

**Solution**: Update DNS records at your domain registrar

---

## 📋 DNS Records to Add

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these records:

### Record 1: Root Domain (A Record)
```
Type: A
Name: @ (or leave blank for root)
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

### Record 2: WWW Subdomain (CNAME Record)
```
Type: CNAME
Name: www
Value: partyhause.netlify.app
TTL: 3600 (or Auto)
```

---

## 🗑️ DNS Records to DELETE

**Remove these existing A records** (they point to Vercel):
```
❌ DELETE: 35.157.26.135
❌ DELETE: 63.176.8.218
```

---

## 🔍 Current DNS Status (Before Fix)

```bash
$ dig partyhause.com +short
35.157.26.135  ← Vercel (WRONG - serving mobile app)
63.176.8.218   ← Vercel (WRONG - serving mobile app)

$ dig www.partyhause.com +short
NXDOMAIN       ← Doesn't exist yet
```

---

## ✅ Expected DNS Status (After Fix)

```bash
$ dig partyhause.com +short
75.2.60.5      ← Netlify Load Balancer (CORRECT)

$ dig www.partyhause.com +short
partyhause.netlify.app.
75.2.60.5      ← Netlify (CORRECT - serves web PWA)
```

---

## 📝 Step-by-Step Instructions

### Step 1: Log into Domain Registrar
Go to where you bought `partyhause.com`:
- GoDaddy: https://dcc.godaddy.com/manage/dns
- Namecheap: Dashboard → Domain List → Manage
- Cloudflare: Dashboard → DNS
- Google Domains: https://domains.google.com

### Step 2: Find DNS Management
Look for:
- "DNS Settings"
- "Manage DNS"
- "DNS Records"
- "Advanced DNS"

### Step 3: Delete Vercel Records
Find and delete these A records:
- 35.157.26.135
- 63.176.8.218

### Step 4: Add Netlify Records

**Add Root Domain (A Record):**
- Type: `A`
- Host/Name: `@` or leave blank
- Value: `75.2.60.5`
- TTL: `3600` or `Auto`
- Click "Add" or "Save"

**Add WWW Subdomain (CNAME Record):**
- Type: `CNAME`
- Host/Name: `www`
- Value: `partyhause.netlify.app`
- TTL: `3600` or `Auto`
- Click "Add" or "Save"

### Step 5: Save Changes
Click "Save Changes" or "Apply" button

### Step 6: Wait for Propagation
DNS changes take **15-60 minutes** to propagate globally

---

## 🧪 Test DNS Propagation

### Option 1: Command Line
```bash
# Test root domain (should return 75.2.60.5)
dig partyhause.com +short

# Test www subdomain (should return partyhause.netlify.app)
dig www.partyhause.com +short

# Test if www loads (should show web PWA, not mobile)
curl -I https://www.partyhause.com
```

### Option 2: Online Tools
- https://dnschecker.org
- Enter: `www.partyhause.com`
- Type: `CNAME`
- Should show: `partyhause.netlify.app` globally

### Option 3: Browser
After DNS propagates:
- Go to: https://www.partyhause.com
- Should see: **Web PWA** (not Expo mobile app)
- No more errors about: `_expo/static/js/web/entry-*.js`

---

## 🚨 Common Issues

### Issue 1: Still See Vercel/Expo Files
**Cause**: DNS hasn't propagated yet or browser cache
**Solution**: 
```bash
# Clear browser cache
# Or use incognito/private window
# Or wait 30-60 minutes for DNS to propagate
```

### Issue 2: DNS Not Updating
**Cause**: Old TTL (Time To Live) from previous records
**Solution**: Wait for old TTL to expire (usually 1-24 hours)

### Issue 3: CNAME Flattening
**Cause**: Some registrars don't support CNAME at root (@)
**Solution**: Use A record for root (75.2.60.5) - already in instructions above

---

## 🎯 Quick Reference

| Record Type | Host | Value | Purpose |
|-------------|------|-------|---------|
| A | @ | 75.2.60.5 | Root domain → Netlify |
| CNAME | www | partyhause.netlify.app | WWW → Netlify |

---

## ✅ Verification Checklist

After adding DNS records and waiting 15-60 minutes:

- [ ] `dig partyhause.com +short` returns `75.2.60.5`
- [ ] `dig www.partyhause.com +short` returns `partyhause.netlify.app`
- [ ] https://www.partyhause.com loads web PWA (not mobile)
- [ ] No console errors about `_expo/static/js/web/` files
- [ ] Service worker loads from Netlify
- [ ] PWA install prompt appears on mobile/desktop

---

## 🆘 Need Help?

If you're stuck, tell me:
1. What domain registrar you're using (GoDaddy, Namecheap, etc.)
2. What error you're seeing
3. Screenshot of your current DNS records

I can provide specific instructions for your registrar.

---

**Next**: After DNS propagates, you'll still need to add environment variables in Netlify dashboard (see `DEPLOYMENT_CHECKLIST.md`)
