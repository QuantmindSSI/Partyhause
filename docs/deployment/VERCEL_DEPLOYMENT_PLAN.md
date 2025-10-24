# Vercel Deployment Plan - PartyHause

## Overview
This guide walks through deploying PartyHause's backend API and web frontend to Vercel, making it fully accessible online for both web and mobile users.

---

## Pre-Deployment Checklist

### ✅ Prerequisites
- [x] Vercel account created
- [x] Vercel CLI installed (`npm i -g vercel`)
- [x] Supabase project running (database already deployed)
- [x] MailerSend account with verified sender domain
- [ ] Domain name (optional, but recommended)
- [ ] Git repository pushed to GitHub/GitLab

### ✅ Environment Variables Ready
Make sure you have these values:
- `SUPABASE_URL` - From Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard (Settings > API)
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL
- `VITE_SUPABASE_ANON_KEY` - From Supabase dashboard
- `MAILERSEND_API_TOKEN` - From MailerSend dashboard
- `MAILERSEND_FROM_EMAIL` - Your verified sender email

---

## Deployment Steps

### Step 1: Link Project to Vercel

From your project root:

```powershell
# Login to Vercel (if not already)
vercel login

# Link project to Vercel
vercel link
```

**Follow the prompts:**
- Setup and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N** (first time)
- Project name? **partyhause** (or your preferred name)
- Directory? **./** (root)

This creates `.vercel` directory with project config.

---

### Step 2: Configure Environment Variables

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `SUPABASE_URL` | https://xxx.supabase.co | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... (long key) | Production, Preview, Development |
| `VITE_SUPABASE_URL` | https://xxx.supabase.co | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGc... (anon key) | Production, Preview, Development |
| `MAILERSEND_API_TOKEN` | mlsn.xxx | Production, Preview, Development |
| `MAILERSEND_FROM_EMAIL` | noreply@yourdomain.com | Production, Preview, Development |

**Option B: Via Vercel CLI**

```powershell
# Add production environment variables
vercel env add SUPABASE_URL production
# Paste value when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add MAILERSEND_API_TOKEN production
vercel env add MAILERSEND_FROM_EMAIL production

# Repeat for preview and development if needed
```

---

### Step 3: Update vercel.json Configuration

Your current `vercel.json` is already configured! It includes:
- API function routes
- Rewrites for clean URLs
- Build output directory

**Verify the configuration:**

```json
{
  "functions": {
    "api/events.ts": { "memory": 512, "maxDuration": 10 },
    "api/guests.ts": { "memory": 512, "maxDuration": 10 },
    "api/timeline.ts": { "memory": 256, "maxDuration": 10 },
    "api/email.ts": { "memory": 1024, "maxDuration": 10 }
  },
  "rewrites": [
    { "source": "/api/events/:path*", "destination": "/api/events" },
    { "source": "/api/events/:id/guests", "destination": "/api/guests" },
    { "source": "/api/events/:id/timeline", "destination": "/api/timeline" }
  ]
}
```

✅ Already configured in previous step!

---

### Step 4: Build Configuration

Vercel auto-detects Vite projects. Verify your `package.json` has:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

✅ Already configured!

---

### Step 5: Deploy to Production

```powershell
# Deploy to production
vercel --prod
```

**What happens:**
1. ✅ Code is uploaded to Vercel
2. ✅ Dependencies installed (`npm install`)
3. ✅ Vite build runs (`npm run build`)
4. ✅ API functions compiled to serverless
5. ✅ Environment variables injected
6. ✅ CDN distribution configured
7. ✅ HTTPS certificate provisioned
8. ✅ Deployment URL assigned

**Expected Output:**
```
✅  Preview: https://partyhause-abc123.vercel.app
✅  Production: https://partyhause.vercel.app
```

---

### Step 6: Verify Deployment

**Test Web Frontend:**
```powershell
# Visit your deployment URL
start https://partyhause.vercel.app
```

**Test API Endpoints:**
```powershell
# Health check
curl https://partyhause.vercel.app/api/health

# Events endpoint (requires auth token)
curl -H "Authorization: Bearer <YOUR_TOKEN>" https://partyhause.vercel.app/api/events
```

---

### Step 7: Update Mobile App Configuration

Once deployed, update your mobile app to use the production API.

**Create/Update `apps/mobile/.env`:**

```env
# Production API URL (replace with your actual Vercel URL)
EXPO_PUBLIC_API_URL=https://partyhause.vercel.app

# Supabase configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Rebuild Expo app:**
```powershell
cd apps/mobile
npx expo start --clear
```

Now your mobile app will connect to the production API! 🎉

---

### Step 8: Configure Custom Domain (Optional)

**Add your custom domain:**

1. Go to Vercel Dashboard > Project > Settings > **Domains**
2. Add domain: `partyhause.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

**Update DNS Records:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

## Post-Deployment Configuration

### 1. Update Supabase Allowed Origins

Supabase Dashboard > Settings > API > **Allowed Origins**

Add:
- `https://partyhause.vercel.app`
- `https://your-custom-domain.com`
- `exp://localhost:8081` (for Expo dev)

### 2. Update MailerSend Webhooks

MailerSend Dashboard > Settings > **Webhooks**

Set webhook URL:
```
https://partyhause.vercel.app/api/email-webhook
```

Enable events:
- Email delivered
- Email bounced
- Email opened
- Email clicked

### 3. Configure CORS (if needed)

API functions already have CORS headers:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

For stricter security, limit to your domains:
```typescript
const allowedOrigins = [
  'https://partyhause.vercel.app',
  'https://your-custom-domain.com'
];
```

---

## Continuous Deployment (CI/CD)

### GitHub Integration (Recommended)

1. Push code to GitHub:
   ```powershell
   git remote add origin https://github.com/yourusername/partyhause.git
   git push -u origin main
   ```

2. Connect to Vercel:
   - Vercel Dashboard > **Add New Project**
   - Import Git Repository
   - Select your repo
   - Configure (auto-detected)
   - Deploy

**Automatic Deployments:**
- ✅ Push to `main` → Production deployment
- ✅ Push to `dev` → Preview deployment
- ✅ Pull Request → Preview deployment with unique URL

### Manual Deployments

For preview deployments:
```powershell
vercel
```

For production deployments:
```powershell
vercel --prod
```

---

## Environment-Specific Configurations

### Development
```env
# Local development
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Run: `vercel dev`

### Preview (Staging)
```env
# Preview deployments
EXPO_PUBLIC_API_URL=https://partyhause-git-dev-yourname.vercel.app
```

Auto-deployed on PR creation

### Production
```env
# Production
EXPO_PUBLIC_API_URL=https://partyhause.vercel.app
```

Deployed via: `vercel --prod` or push to `main`

---

## Monitoring & Analytics

### 1. Vercel Analytics

Enable in Dashboard > Project > **Analytics**
- Page views
- Unique visitors
- Top pages
- Performance metrics

### 2. Function Logs

View logs in Dashboard > Project > **Deployments** > [Latest] > **Functions**

**Real-time logs:**
```powershell
vercel logs
```

### 3. Performance Monitoring

Dashboard > Project > **Speed Insights**
- Core Web Vitals
- Response times
- Error rates

---

## Troubleshooting

### Issue: API Functions Return 500

**Check:**
1. Environment variables set correctly
2. Supabase credentials valid
3. Function logs: `vercel logs --follow`

### Issue: CORS Errors

**Fix:**
Add origin to CORS headers in API functions:
```typescript
res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
```

### Issue: Build Fails

**Check:**
1. `npm run build` works locally
2. All dependencies in `package.json`
3. TypeScript errors: `npx tsc --noEmit`

### Issue: Mobile App Can't Connect

**Check:**
1. `.env` file in `apps/mobile/`
2. Correct API URL (no trailing slash)
3. Network reachability
4. CORS configured on API

---

## Rollback Strategy

### Rollback to Previous Deployment

1. Vercel Dashboard > **Deployments**
2. Find stable deployment
3. Click **•••** menu > **Promote to Production**

Or via CLI:
```powershell
vercel rollback
```

### Emergency Hotfix

```powershell
# Create hotfix branch
git checkout -b hotfix/critical-bug

# Make fix
git add .
git commit -m "fix: critical bug"

# Deploy immediately
vercel --prod

# Merge back to main
git checkout main
git merge hotfix/critical-bug
git push
```

---

## Cost Estimation

**Vercel Free Tier:**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited API requests
- ✅ 100 GB-hours function execution
- ✅ Custom domains
- ✅ HTTPS included

**Supabase Free Tier:**
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth
- ✅ 50,000 monthly active users

**MailerSend Free Tier:**
- ✅ 3,000 emails/month

**Estimated Monthly Cost:**
- Small app (100 events/month): **$0**
- Medium app (1,000 events/month): **$0-20**
- Large app (10,000 events/month): **$50-100**

---

## Security Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Supabase RLS policies enabled
- [ ] Service role key NOT exposed to client
- [ ] CORS properly configured
- [ ] Rate limiting enabled (Vercel Pro)
- [ ] Webhook signatures verified
- [ ] HTTPS enforced
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (sanitizing inputs)
- [ ] Authentication required on all endpoints

---

## Success Criteria

✅ **Deployment Complete When:**
1. Web app accessible at production URL
2. API endpoints responding correctly
3. Mobile app connects to production API
4. Email invitations sending successfully
5. Database queries working
6. Authentication flow working
7. No console errors
8. Performance metrics green

---

## Quick Deploy Commands

```powershell
# First-time deployment
vercel login
vercel link
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add MAILERSEND_API_TOKEN production
vercel --prod

# Subsequent deployments
git add .
git commit -m "feat: new features"
git push  # Auto-deploys if GitHub connected

# Or manual
vercel --prod
```

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/help
- **Supabase Docs:** https://supabase.com/docs
- **MailerSend Docs:** https://developers.mailersend.com

---

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Set up monitoring alerts
3. ✅ Configure error tracking (Sentry)
4. ✅ Add Google Analytics
5. ✅ Test mobile app end-to-end
6. ✅ Submit mobile app to App Store/Play Store
7. ✅ Set up backup strategy
8. ✅ Document API for team
9. ✅ Create user onboarding flow
10. ✅ Plan marketing launch! 🚀
