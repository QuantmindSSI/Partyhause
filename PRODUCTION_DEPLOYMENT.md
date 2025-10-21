# Production Deployment Guide - Email Server

This guide covers deploying the PartyHause email server to Vercel for production use.

## Prerequisites

✅ Vercel account created
✅ Vercel CLI installed: `npm i -g vercel`
✅ MailerSend account with verified domain
✅ Supabase project configured

## Production Architecture

```
Mobile App / Web App
        ↓
https://partyhause.vercel.app/api/send-email
        ↓
Vercel Serverless Function (api/email.ts)
        ↓
MailerSend API
        ↓
📧 Email Delivered
```

## Step 1: Prepare for Deployment

### 1.1 Verify API Files

✅ `api/email.ts` - Main email endpoint (Vercel serverless function)
✅ `api/send-email.ts` - Alternative endpoint (uses same MailerSend code)
✅ `vercel.json` - Routing configuration

### 1.2 Check vercel.json Configuration

```json
{
  "rewrites": [
    {
      "source": "/api/send-email",
      "destination": "/api/email"
    }
  ]
}
```

This routes `/api/send-email` → `/api/email` for consistency.

## Step 2: Configure Environment Variables on Vercel

### 2.1 Add to Vercel Dashboard

Go to: https://vercel.com/your-username/partyhause/settings/environment-variables

Add these variables (for **Production** environment):

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `MAILERSEND_API_TOKEN` | `mlsn.31bc6ff340fdf4f1b9d50463887c8beb43708c3cd2770ea1bc084a21a81e5209` | MailerSend API key |
| `MAILERSEND_FROM_EMAIL` | `dara@partyhause.com` | Verified sender email |
| `VITE_MAILERSEND_API_TOKEN` | `mlsn.31bc6ff340fdf4f1b9d50463887c8beb43708c3cd2770ea1bc084a21a81e5209` | Fallback for API |
| `VITE_MAILERSEND_FROM_EMAIL` | `dara@partyhause.com` | Fallback for API |
| `SUPABASE_URL` | `https://awokklruxeofxsqxcsnt.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | For email log updates |

### 2.2 Or Use Vercel CLI

```bash
# Navigate to project root
cd C:\Users\MY PC\OneDrive\Documents\PartyHause-main

# Set environment variables
vercel env add MAILERSEND_API_TOKEN production
# Paste: mlsn.31bc6ff340fdf4f1b9d50463887c8beb43708c3cd2770ea1bc084a21a81e5209

vercel env add MAILERSEND_FROM_EMAIL production
# Paste: dara@partyhause.com

vercel env add SUPABASE_URL production
# Paste: https://awokklruxeofxsqxcsnt.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: your-service-role-key
```

## Step 3: Deploy to Vercel

### Option A: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub

1. Push code to GitHub repository
2. Connect repository to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure environment variables
   - Click "Deploy"

## Step 4: Update Mobile App URLs

After deployment, update mobile email URLs:

### File: `apps/mobile/lib/email.ts`

```typescript
const EMAIL_API_URL = __DEV__ 
  ? Platform.select({
      ios: 'http://192.168.56.1:3001/api/send-email',
      android: 'http://10.0.2.2:3001/api/send-email',
      default: 'http://192.168.56.1:3001/api/send-email',
    })
  : 'https://partyhause.vercel.app/api/send-email'; // ✅ Update this
```

### File: `src/lib/email-tracking.ts` (Web)

```typescript
const apiUrl = process.env.NODE_ENV === 'production'
  ? '/api/email'  // ✅ Relative URL for same domain
  : 'http://localhost:3001/api/send-email';
```

## Step 5: Test Production Email

### 5.1 Test via curl

```bash
curl -X POST https://partyhause.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "thecommodore30@gmail.com",
    "subject": "Production Test",
    "html": "<h1>Test from Production</h1>"
  }'
```

### 5.2 Test via Web App

1. Visit deployed app: https://partyhause.vercel.app
2. Create event and add guest
3. Send invitation email
4. Verify email received

### 5.3 Test via Mobile App

1. Update mobile app URL to production
2. Build production mobile app
3. Add guest and send invitation
4. Verify email received

## Step 6: Monitor & Debug

### Check Vercel Logs

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url]
```

### Check MailerSend Dashboard

https://app.mailersend.com/activity
- Monitor email delivery
- Check bounce rates
- View open/click statistics

### Check Supabase Logs

https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/logs/explorer
- Check email_logs table
- Verify status updates
- Monitor for errors

## Troubleshooting

### Issue: Email API returns 500

**Cause**: Missing environment variables

**Fix**:
1. Check Vercel environment variables are set
2. Redeploy: `vercel --prod`
3. Check logs: `vercel logs`

### Issue: MailerSend authentication failed

**Cause**: Invalid API token or wrong FROM email

**Fix**:
1. Verify API token in MailerSend dashboard
2. Ensure FROM email is verified in MailerSend
3. Update environment variables on Vercel
4. Redeploy

### Issue: CORS errors

**Cause**: Missing CORS headers

**Fix**: Already handled in `api/email.ts`:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
```

### Issue: Mobile app can't reach API

**Cause**: Wrong production URL

**Fix**: Update `apps/mobile/lib/email.ts` with correct Vercel URL

## Security Checklist

✅ API tokens stored as environment variables (not in code)
✅ CORS configured properly
✅ Input validation in API endpoint
✅ Error messages don't expose sensitive info
✅ Service role key only used server-side
✅ FROM email is verified domain

## Performance Optimization

### Cold Start Mitigation

Vercel serverless functions have cold starts. To minimize impact:
- Use lightweight dependencies
- ✅ Already using efficient MailerSend SDK
- ✅ No heavy database queries in email endpoint

### Rate Limiting

Consider adding rate limiting for production:
- Use Vercel Edge Config
- Or add rate limiting middleware
- Monitor abuse in MailerSend dashboard

## Monitoring & Alerts

### Set up Vercel Monitoring

1. Enable Vercel Analytics
2. Set up error notifications
3. Monitor function execution time

### Set up MailerSend Webhooks

Already configured: `api/email-webhook.ts`

Configure in MailerSend:
- Webhook URL: `https://partyhause.vercel.app/api/email-webhook`
- Events: sent, delivered, opened, clicked, bounced, complained

## Cost Estimation

### Vercel (Free Tier)
- 100 GB bandwidth/month
- Unlimited serverless function invocations
- ✅ Should be sufficient for MVP

### MailerSend
- Free: 3,000 emails/month
- Paid: $25/month for 50,000 emails
- ✅ Free tier sufficient for testing/early users

## Deployment Checklist

- [ ] Environment variables set on Vercel
- [ ] Vercel project linked
- [ ] Code deployed to production
- [ ] Production email endpoint tested
- [ ] Mobile app URLs updated
- [ ] Web app URLs configured
- [ ] MailerSend domain verified
- [ ] Webhooks configured
- [ ] Monitoring enabled
- [ ] Team notified of production URL

## Quick Reference

**Production API Endpoint**:
- `https://partyhause.vercel.app/api/send-email`
- `https://partyhause.vercel.app/api/email`

**Local Development**:
- `http://localhost:3001/api/send-email`
- Start with: `npm run server`

**MailerSend Dashboard**:
- https://app.mailersend.com

**Vercel Dashboard**:
- https://vercel.com/dashboard

---

**Last Updated**: October 21, 2025
**Status**: Ready for deployment
