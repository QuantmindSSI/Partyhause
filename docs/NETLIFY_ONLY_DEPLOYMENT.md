# 🚀 Netlify-Only Deployment Configuration
**Date**: November 3, 2025  
**Status**: ✅ All Vercel deployments deprecated  
**Primary Platform**: Netlify

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY ONLY                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌐 Production Domain                                        │
│     https://www.partyhause.com                               │
│     ├─ Web PWA (React + Vite)                               │
│     ├─ Serverless Functions (18 APIs)                       │
│     ├─ Email Service (MailerSend)                           │
│     └─ Static Assets + Service Worker                       │
│                                                              │
│  🔍 Preview Domain                                           │
│     https://partyhause.netlify.app                           │
│     ├─ Same as production                                   │
│     ├─ Auto-deploy on git push                              │
│     └─ Testing & development                                │
│                                                              │
│  ❌ Vercel (Deprecated)                                      │
│     partyhaus.vercel.app → No longer used                   │
│     All APIs moved to Netlify                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Environment Variables Updated

### Root `.env` (Web App)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Service (MailerSend)
VITE_MAILERSEND_API_TOKEN=mlsn.226db972810e708954e5f65f2a04bf490c07c3508c6521d14fd18dd69fc16ffc
VITE_MAILERSEND_FROM_EMAIL=dara@partyhause.com
VITE_MAILERSEND_FROM_NAME=PartyHause Team

# Application Configuration
VITE_APP_NAME=PartyHause
VITE_APP_URL=https://www.partyhause.com         # ✅ Production domain

# API URL (Netlify deployment)
# Preview: https://partyhause.netlify.app
# Production: https://www.partyhause.com
EXPO_PUBLIC_API_URL=https://www.partyhause.com   # ✅ Netlify only
VITE_API_URL=https://www.partyhause.com          # ✅ Netlify only
```

### `mobile/.env` (Mobile App)

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API URL - Netlify deployment
# Preview/Testing: https://partyhause.netlify.app
# Production: https://www.partyhause.com
EXPO_PUBLIC_API_URL=https://www.partyhause.com   # ✅ Netlify only
```

---

## 🔧 Netlify Configuration

### Required Environment Variables in Netlify Dashboard

**Go to**: https://app.netlify.com/sites/partyhause/configuration/env

Add these 3 variables (⚠️ NOT in .env, must be in Netlify dashboard):

```bash
# Server-side only (for Netlify Functions)
MAILERSEND_API_KEY=mlsn.226db972810e708954e5f65f2a04bf490c07c3508c6521d14fd18dd69fc16ffc
MAILERSEND_FROM_EMAIL=dara@partyhause.com
MAILERSEND_FROM_NAME=PartyHause Team

# Supabase server-side (for Functions)
SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Your service role key]
```

### Build Settings

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 🌐 Domain Configuration

### Step 1: Remove Vercel Domain (5 min)

1. Go to: https://vercel.com/thundastormgod
2. Find any projects with `www.partyhause.com`
3. Remove the domain from all projects
4. Delete old Vercel deployments (optional)

### Step 2: Configure Netlify Domain (10 min)

1. **Go to**: https://app.netlify.com/sites/partyhause/settings/domain

2. **Add custom domain**:
   - Click "Add custom domain"
   - Enter: `partyhause.com`
   - Click "Verify" → "Yes, add domain"

3. **Add www subdomain**:
   - Click "Add custom domain"
   - Enter: `www.partyhause.com`
   - Click "Verify" → "Yes, add domain"

4. **Set primary domain**:
   - Click options (⋯) next to `www.partyhause.com`
   - Click "Set as primary domain"

### Step 3: Configure DNS Records (15 min)

**Login to your domain registrar** (GoDaddy, Namecheap, Google Domains, etc.)

**Delete old Vercel records**:
- Remove any A records pointing to Vercel
- Remove any CNAME records pointing to Vercel

**Add Netlify records**:

```bash
# Apex domain (partyhause.com)
Type: A
Host: @
Value: 75.2.60.5
TTL: 3600

# WWW subdomain (www.partyhause.com)
Type: CNAME
Host: www
Value: partyhause.netlify.app
TTL: 3600

# Optional: Redirect apex to www
# If you want partyhause.com → www.partyhause.com
# Add this in Netlify dashboard instead of DNS
```

### Step 4: Wait for DNS Propagation (15-60 min)

```bash
# Test DNS resolution
dig partyhause.com
# Should return: 75.2.60.5

dig www.partyhause.com
# Should return: CNAME → partyhause.netlify.app

# Test in browser
curl -I https://www.partyhause.com
# Should return: 200 OK with Netlify headers
```

---

## 📋 Updated URLs

### Production URLs

| Type | Old (Vercel) | New (Netlify) |
|------|-------------|---------------|
| Main Domain | ❌ www.partyhause.com (Vercel) | ✅ www.partyhause.com (Netlify) |
| Apex Domain | ❌ partyhause.com (not working) | ✅ partyhause.com → www redirect |
| Preview | ❌ partyhaus.vercel.app | ✅ partyhause.netlify.app |
| API Endpoint | ❌ partyhaus.vercel.app/api/* | ✅ www.partyhause.com/api/* |
| Email API | ❌ partyhaus.vercel.app/api/send-email | ✅ www.partyhause.com/api/send-email |

### All References Updated

✅ Root `.env` → `https://www.partyhause.com`  
✅ `mobile/.env` → `https://www.partyhause.com`  
✅ `apps/mobile/lib/email.ts` → `https://www.partyhause.com`  
✅ API clients → Use `VITE_API_URL` env var  

---

## 🔄 Migration Steps Completed

### 1. ✅ Environment Variables Updated

- [x] Root `.env` → Netlify URLs
- [x] `mobile/.env` → Netlify URLs  
- [x] `apps/mobile/lib/email.ts` → Netlify URLs

### 2. ⏳ Netlify Dashboard Configuration (YOU DO THIS)

- [ ] Add `MAILERSEND_API_KEY` to Netlify
- [ ] Add `MAILERSEND_FROM_EMAIL` to Netlify
- [ ] Add `MAILERSEND_FROM_NAME` to Netlify

### 3. ⏳ Domain Configuration (YOU DO THIS)

- [ ] Remove `www.partyhause.com` from Vercel
- [ ] Add `partyhause.com` to Netlify
- [ ] Add `www.partyhause.com` to Netlify
- [ ] Set `www.partyhause.com` as primary
- [ ] Update DNS records at registrar

### 4. ⏳ Testing

- [ ] Test web app at `https://www.partyhause.com`
- [ ] Test mobile app with Netlify APIs
- [ ] Test email sending
- [ ] Test PWA installation
- [ ] Verify all features working

---

## 🧪 Testing Checklist

### After DNS Propagation

```bash
# 1. Test web app loads
curl -I https://www.partyhause.com
# Expected: 200 OK, x-nf-request-id header (Netlify)

# 2. Test API endpoint
curl https://www.partyhause.com/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# 3. Test email confirmation
node test-email-confirmation.js
# Expected: 7/7 tests passed

# 4. Test in browser
# Open: https://www.partyhause.com
# - Should load web PWA
# - Should NOT show Expo errors
# - Should be installable
```

### Features to Test

- [ ] Sign up / Sign in
- [ ] Create event
- [ ] Send invitation email
- [ ] Guest RSVP
- [ ] QR code check-in
- [ ] PartyCrew social features
- [ ] PWA installation
- [ ] Offline mode

---

## 🚨 Common Issues & Solutions

### Issue 1: "Still loading Expo files"

**Cause**: Browser cache or DNS not propagated

**Solution**:
```bash
# Clear browser cache
Ctrl+Shift+Delete

# Hard reload
Ctrl+Shift+R

# Check DNS
dig www.partyhause.com
```

### Issue 2: "API calls fail with 404"

**Cause**: Netlify Functions not deployed or env vars missing

**Solution**:
```bash
# Check Netlify Functions
https://app.netlify.com/sites/partyhause/functions

# Should see 18 functions deployed

# Check environment variables
https://app.netlify.com/sites/partyhause/configuration/env

# Should have MAILERSEND_* variables
```

### Issue 3: "Email sending fails"

**Cause**: Missing environment variables in Netlify

**Solution**:
```bash
# Add to Netlify Dashboard (NOT .env):
MAILERSEND_API_KEY
MAILERSEND_FROM_EMAIL  
MAILERSEND_FROM_NAME

# Then trigger new deploy
```

---

## 📊 Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Web PWA | ✅ Deployed | https://partyhause.netlify.app |
| Netlify Functions | ✅ Deployed (18) | https://partyhause.netlify.app/api/* |
| Custom Domain | ⏳ Pending DNS | https://www.partyhause.com |
| SSL Certificate | ⏳ Auto after DNS | https://www.partyhause.com |
| Email Service | ⏳ Needs env vars | /api/send-email |
| Service Worker | ✅ Active | Offline caching enabled |

---

## 🎯 Next Steps (Priority Order)

### Immediate (5 min)

1. **Add environment variables in Netlify**:
   - Go to: https://app.netlify.com/sites/partyhause/configuration/env
   - Add: `MAILERSEND_API_KEY`
   - Add: `MAILERSEND_FROM_EMAIL`
   - Add: `MAILERSEND_FROM_NAME`
   - Click "Save"

2. **Trigger new deploy**:
   - Go to: https://app.netlify.com/sites/partyhause/deploys
   - Click "Trigger deploy" → "Deploy site"

### Within 1 Hour

3. **Configure custom domain in Netlify**:
   - Add `partyhause.com`
   - Add `www.partyhause.com`
   - Set `www.partyhause.com` as primary

4. **Update DNS at registrar**:
   - Add A record: @ → 75.2.60.5
   - Add CNAME: www → partyhause.netlify.app

### Within 24 Hours

5. **Test everything**:
   - Web app loads at www.partyhause.com
   - All features work
   - Email sending works
   - PWA installs correctly

6. **Share with users**:
   - Primary URL: https://www.partyhause.com
   - Preview URL: https://partyhause.netlify.app

---

## 📚 Documentation

- [Web Mobile Parity Assessment](./WEB_MOBILE_PARITY_ASSESSMENT.md)
- [PWA Production Deployment Guide](./PWA_PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Domain Configuration Fix](./DOMAIN_CONFIGURATION_FIX.md)
- [Quick Start Guide](../PWA_DEPLOY_QUICKSTART.md)

---

## ✅ Verification

**Vercel Deprecation Checklist**:

- [x] All `.env` files updated to Netlify URLs
- [x] Mobile app email service updated
- [x] API clients use Netlify endpoints
- [ ] Vercel domains removed
- [ ] Netlify domain configured
- [ ] DNS updated
- [ ] SSL provisioned
- [ ] All tests passing

**Status**: 🟡 Ready for domain configuration (60% complete)

---

**🎉 Once DNS is configured, your entire app will run on Netlify at www.partyhause.com!**
