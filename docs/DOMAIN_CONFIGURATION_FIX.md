# 🔧 Domain Configuration Fix Guide
**Date**: November 3, 2025  
**Issue**: www.partyhause.com loading wrong app (Expo instead of Web PWA)

---

## 🎯 Problem Summary

**Current Situation**:
- **www.partyhause.com** → Trying to load Expo mobile app files
- **partyhaus.vercel.app** → Expo mobile app (working)
- **partyhause.netlify.app** → Web PWA (working)

**Error**:
```
Failed to fetch: www.partyhause.com/_expo/static/js/web/entry-*.js
```

**Root Cause**: Domain pointing to wrong deployment

---

## ✅ RECOMMENDED SOLUTION

### Deploy Web PWA as Primary at www.partyhause.com

**Step 1: Configure Custom Domain in Netlify** (5 min)

1. Go to: https://app.netlify.com/sites/partyhause/settings/domain

2. Click "Add custom domain"

3. Enter: `partyhause.com` (without www)

4. Click "Verify"

5. Netlify will show DNS configuration needed

**Step 2: Configure DNS** (10 min)

Go to your domain registrar (where you bought partyhause.com) and add:

```bash
# For apex domain (partyhause.com)
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

# For www subdomain (www.partyhause.com)
Type: CNAME
Name: www
Value: partyhause.netlify.app
TTL: 3600
```

**Step 3: Wait for DNS Propagation** (5-30 min)

```bash
# Test DNS resolution
dig partyhause.com
dig www.partyhause.com

# Should show Netlify's IP
```

**Step 4: Enable HTTPS** (automatic)

Netlify will auto-provision SSL certificate once DNS resolves.

---

## 🚀 QUICK FIX (Immediate)

**While DNS propagates, update your app to use correct URLs:**

### For Web App (.env):

```bash
# Change these in your root .env file
VITE_APP_URL=https://partyhause.netlify.app
VITE_API_URL=https://partyhause.netlify.app

# After DNS is configured:
VITE_APP_URL=https://www.partyhause.com
VITE_API_URL=https://www.partyhause.com
```

### For Mobile App (mobile/.env):

```bash
# Keep using Vercel for mobile (different app)
EXPO_PUBLIC_API_URL=https://partyhaus.vercel.app
```

**OR** use Netlify for both:

```bash
# Use Netlify for mobile APIs too
EXPO_PUBLIC_API_URL=https://partyhause.netlify.app
```

---

## 🔄 Alternative: Keep Separate Deployments

If you want **both** apps accessible:

### Option A: Different Subdomains

```
web.partyhause.com  → Netlify (Web PWA)
app.partyhause.com  → Vercel (Expo mobile web)
api.partyhause.com  → Netlify Functions (APIs)
```

### Option B: Different Paths

```
www.partyhause.com      → Netlify (Web PWA)
www.partyhause.com/m    → Vercel (Expo mobile)
```

---

## 📋 Current Domain Status

| Domain | Current Status | Should Point To |
|--------|---------------|----------------|
| partyhause.com | ❌ Not resolving | Netlify (75.2.60.5) |
| www.partyhause.com | ⚠️ Vercel (wrong app) | Netlify (CNAME) |
| partyhause.netlify.app | ✅ Working | Web PWA |
| partyhaus.vercel.app | ✅ Working | Expo mobile |

---

## 🛠️ Step-by-Step Fix

### 1. Remove Custom Domain from Vercel (3 min)

```bash
# Via Vercel Dashboard
1. Go to: https://vercel.com/thundastormgod/partyhause/settings/domains
2. Find "www.partyhause.com"
3. Click "Remove"
4. Confirm
```

### 2. Add Custom Domain to Netlify (5 min)

```bash
# Via Netlify Dashboard
1. Go to: https://app.netlify.com/sites/partyhause/settings/domain
2. Click "Add custom domain"
3. Enter: partyhause.com
4. Click "Verify" → "Yes, add domain"
5. Repeat for: www.partyhause.com
```

### 3. Update DNS Records (10 min)

**Login to your domain registrar** (GoDaddy, Namecheap, Google Domains, etc.)

**Delete old records**:
- Any A records for @ or www pointing to Vercel
- Any CNAME records for www pointing to Vercel

**Add new records**:

```bash
# Apex domain
Type: A
Host: @
Points to: 75.2.60.5
TTL: 1 hour

# WWW subdomain  
Type: CNAME
Host: www
Points to: partyhause.netlify.app
TTL: 1 hour

# Optional: API subdomain
Type: CNAME
Host: api
Points to: partyhause.netlify.app
TTL: 1 hour
```

### 4. Test DNS (5-30 min for propagation)

```bash
# Test apex domain
dig partyhause.com
# Should return: 75.2.60.5

# Test www subdomain
dig www.partyhause.com
# Should return: CNAME → partyhause.netlify.app

# Test in browser
curl -I https://www.partyhause.com
# Should return: 200 OK with Netlify headers
```

### 5. Update Environment Variables (2 min)

**In your root .env**:

```bash
# Production URLs
VITE_APP_URL=https://www.partyhause.com
VITE_API_URL=https://www.partyhause.com
```

**Commit and push**:

```bash
git add .env
git commit -m "Update domain to www.partyhause.com"
git push
```

Netlify will auto-deploy.

---

## ✅ Verification Checklist

After completing steps:

- [ ] www.partyhause.com loads without errors
- [ ] No Expo-related errors in console
- [ ] Web PWA features work (login, events, etc.)
- [ ] SSL certificate shows as valid (🔒)
- [ ] Can install as PWA
- [ ] Mobile app still works at partyhaus.vercel.app

---

## 🆘 Troubleshooting

### Error: "Certificate verification failed"

**Solution**: Wait for Netlify to provision SSL (15-30 min after DNS)

### Error: "Still showing Expo files"

**Solution**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R)
3. Check DNS propagation: https://dnschecker.org

### Error: "API calls fail"

**Solution**: Update API URL in environment variables to match domain

---

## 📊 Recommended Final Setup

```
┌─────────────────────────────────────────────┐
│     PRODUCTION DOMAINS                       │
├─────────────────────────────────────────────┤
│                                              │
│  🌐 www.partyhause.com                       │
│     └─> Netlify (Web PWA)                   │
│         ├─ React + TypeScript               │
│         ├─ PWA installable                  │
│         └─ Serverless Functions             │
│                                              │
│  📱 partyhaus.vercel.app                     │
│     └─> Vercel (Expo Mobile Web)            │
│         ├─ React Native Web                 │
│         ├─ Mobile-optimized                 │
│         └─ Alternative access               │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. ✅ Remove www.partyhause.com from Vercel
2. ✅ Add www.partyhause.com to Netlify
3. ✅ Update DNS records
4. ✅ Wait for propagation (15-30 min)
5. ✅ Test web app at www.partyhause.com
6. ✅ Update environment variables in Netlify dashboard
7. ✅ Test PWA installation

**ETA to fix**: 30 minutes (including DNS propagation)

---

## 📚 Related Docs

- [PWA Deployment Guide](./PWA_PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Netlify Domain Status](./NETLIFY_DOMAIN_STATUS.md)
- [Domain Fix Guide](./DOMAIN_FIX_GUIDE.md)

---

**Status**: 🟠 ACTION REQUIRED - Update DNS configuration
