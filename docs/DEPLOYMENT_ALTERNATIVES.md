# API Deployment Options Beyond Vercel

## Current Situation

**Vercel Hobby Plan Limit:** 12 serverless functions  
**Your Total Endpoints:** 15 endpoints  
**Currently Deployed:** 11 most critical endpoints  

---

## 📊 **Endpoint Priority Analysis**

### **✅ Deployed (11/12 - Vercel Hobby)**

1. ✅ `api/email.ts` - Send invitation emails (CRITICAL)
2. ✅ `api/health.ts` - Health check
3. ✅ `api/events.ts` - Event CRUD operations (CRITICAL)
4. ✅ `api/guests.ts` - Guest management (CRITICAL)
5. ✅ `api/timeline.ts` - Event timeline/schedule
6. ✅ `api/partycrew/toggle.ts` - Join/leave PartyCrew (NEW!)
7. ✅ `api/partycrew/members.ts` - Get PartyCrew members (NEW!)
8. ✅ `api/partycrew/crewing-with.ts` - Get following list (NEW!)
9. ✅ `api/users/[id].ts` - User profile by ID (NEW! - Fixes 404)
10. ✅ `api/users/suggested.ts` - Suggested users to follow (NEW!)
11. ✅ `api/feed/crew.ts` - PartyCrew content feed (NEW!)

### **❌ Not Deployed (4 endpoints - Need alternative)**

1. ❌ `api/email-webhook.ts` - Email delivery webhooks
2. ❌ `api/event-templates.ts` - Get event templates
3. ❌ `api/create-event-from-template.ts` - Create from template
4. ❌ `api/partycrew/requests.ts` - Connection requests (private accounts)

---

## 🚀 **Deployment Alternatives**

### **Option 1: Upgrade Vercel to Pro ($20/month)** ⭐ RECOMMENDED

**Pros:**
- ✅ Unlimited serverless functions
- ✅ No code changes needed
- ✅ Better performance (more memory)
- ✅ Team collaboration features
- ✅ Analytics and monitoring
- ✅ Custom domains

**Cons:**
- 💰 $20/month cost

**How to Upgrade:**
1. Go to: https://vercel.com/thundastormgods-projects/settings/billing
2. Click "Upgrade to Pro"
3. Re-deploy (all 15 endpoints will work)

---

### **Option 2: Split APIs Across Multiple Vercel Projects (FREE)**

Deploy non-critical endpoints to a second Vercel Hobby account.

**Setup:**
1. Create new Vercel project: `partyhause-api-extras`
2. Move 4 endpoints to separate repo/folder
3. Deploy to: `partyhause-api-extras.vercel.app`
4. Update mobile app to call both domains

**Example:**
```typescript
// Main API (existing)
const MAIN_API = 'https://partyhause.vercel.app';

// Extra API (new project)
const EXTRA_API = 'https://partyhause-api-extras.vercel.app';

// In your app
const templateUrl = `${EXTRA_API}/api/event-templates`;
const mainEventsUrl = `${MAIN_API}/api/events`;
```

**Pros:**
- ✅ Free
- ✅ No monthly cost

**Cons:**
- ⚠️ Manage 2 projects
- ⚠️ 2 different domains
- ⚠️ More complex setup

---

### **Option 3: Deploy to Netlify (FREE - 125k requests/month)**

Netlify Functions = Vercel-like serverless but with different limits.

**Hobby Plan Limits:**
- ✅ Unlimited functions
- ✅ 125k function invocations/month
- ✅ 100 hours runtime/month

**Setup:**
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Create netlify.toml
cat > netlify.toml << EOF
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
EOF

# 3. Deploy
netlify deploy --prod
```

**Pros:**
- ✅ Free unlimited functions
- ✅ Good performance
- ✅ Similar to Vercel

**Cons:**
- ⚠️ Different platform
- ⚠️ Need to migrate
- ⚠️ Request limit (125k/month)

---

### **Option 4: Railway.app ($5/month for usage)**

Full Node.js server (not serverless).

**Setup:**
```bash
# 1. Create Express server
npm install express cors

# 2. Create server.js
// See code example below

# 3. Deploy to Railway
railway init
railway up
```

**Server Code:**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import your API routes
app.use('/api/email-webhook', require('./api/email-webhook'));
app.use('/api/event-templates', require('./api/event-templates'));
app.use('/api/create-event-from-template', require('./api/create-event-from-template'));
app.use('/api/partycrew/requests', require('./api/partycrew/requests'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
```

**Pros:**
- ✅ Unlimited endpoints
- ✅ Always-on server
- ✅ WebSocket support
- ✅ $5 credit/month free

**Cons:**
- ⚠️ Need to convert to Express
- ⚠️ Manage server
- ⚠️ Pay for usage

---

### **Option 5: Cloudflare Workers (FREE - 100k requests/day)**

Similar to Vercel but different API.

**Limits:**
- ✅ Unlimited endpoints
- ✅ 100k requests/day
- ✅ Global edge network

**Setup:**
```bash
npm install -g wrangler
wrangler init
wrangler deploy
```

**Pros:**
- ✅ Free tier generous
- ✅ Fast (edge network)
- ✅ Unlimited functions

**Cons:**
- ⚠️ Different API format
- ⚠️ Need to rewrite endpoints
- ⚠️ V8 isolates (no Node.js)

---

### **Option 6: Supabase Edge Functions (FREE)**

Since you're already using Supabase!

**Setup:**
```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Initialize
supabase functions new email-webhook

# 3. Deploy
supabase functions deploy email-webhook
```

**Pros:**
- ✅ Already using Supabase
- ✅ Unlimited functions
- ✅ 500k invocations/month free
- ✅ Direct database access

**Cons:**
- ⚠️ Deno instead of Node.js
- ⚠️ Need to rewrite functions

---

### **Option 7: AWS Lambda (FREE tier - 1M requests/month)**

Industry standard serverless.

**Free Tier:**
- ✅ 1 million requests/month
- ✅ 400,000 GB-seconds compute
- ✅ Unlimited functions

**Setup:**
```bash
npm install -g serverless
serverless create --template aws-nodejs
serverless deploy
```

**Pros:**
- ✅ Most generous free tier
- ✅ Industry standard
- ✅ Scales infinitely

**Cons:**
- ⚠️ More complex setup
- ⚠️ AWS learning curve
- ⚠️ Need API Gateway

---

## 🎯 **Recommended Approach**

### **For Now (Testing Phase):**

**Keep current 11 endpoints on Vercel** ✅

The missing endpoints won't block your testing:
- Templates: Can create events manually
- Webhooks: Email tracking not critical for testing
- Requests: Only needed for private accounts

### **For Production (Choose One):**

1. **Best:** Upgrade Vercel Pro ($20/month) - Zero hassle
2. **Budget:** Supabase Edge Functions - You're already there
3. **Flexible:** Railway.app - Traditional server approach

---

## 💡 **Immediate Action Plan**

### **Step 1: Test with Current 11 Endpoints**

Your PartyCrew features work with current deployment:
- ✅ User profiles
- ✅ Join/leave PartyCrew
- ✅ View members
- ✅ Content feed
- ✅ Suggested users

### **Step 2: Create Profile & Test**

Run `scripts/create-my-profile.sql` and test in Expo Go.

### **Step 3: Decide on Deployment Strategy**

After testing, choose based on:
- Budget: $0 = Supabase/Netlify, $20 = Vercel Pro
- Complexity: Low = Vercel Pro, Medium = Others
- Timeline: Fast = Vercel Pro, Flexible = Alternatives

---

## 📋 **Migration Checklist (If Not Upgrading Vercel)**

If you choose an alternative platform:

- [ ] Create account on new platform
- [ ] Copy 4 missing API files
- [ ] Convert to platform format (if needed)
- [ ] Deploy functions
- [ ] Update mobile app API URLs
- [ ] Test all endpoints
- [ ] Update documentation

---

## 🔗 **Quick Links**

- Vercel Pro: https://vercel.com/pricing
- Netlify: https://www.netlify.com/pricing/
- Railway: https://railway.app/pricing
- Cloudflare: https://workers.cloudflare.com/
- Supabase Functions: https://supabase.com/docs/guides/functions
- AWS Lambda: https://aws.amazon.com/lambda/pricing/

---

## 📊 **Cost Comparison (Monthly)**

| Platform | Free Tier | Paid Plan | Functions Limit |
|----------|-----------|-----------|-----------------|
| **Vercel Hobby** | $0 | N/A | 12 functions ⚠️ |
| **Vercel Pro** | N/A | $20 | Unlimited ✅ |
| **Netlify** | $0 | $19 | Unlimited ✅ |
| **Railway** | $5 credit | Pay-as-go | Unlimited ✅ |
| **Cloudflare** | $0 | $5 | Unlimited ✅ |
| **Supabase** | $0 | $25 | Unlimited ✅ |
| **AWS Lambda** | $0 | Pay-as-go | Unlimited ✅ |

---

## ✅ **What's Working Right Now**

Your mobile app can fully function with the 11 deployed endpoints:

✅ **Events:** Create, edit, view, manage guests, timeline  
✅ **PartyCrew:** Follow/unfollow users  
✅ **Profiles:** View user profiles with stats  
✅ **Feed:** See PartyCrew content feed  
✅ **Discovery:** Suggested users to follow  
✅ **Email:** Send invitations  

**Missing (non-critical for testing):**
- Event templates (can create manually)
- Email webhooks (tracking not essential)
- Connection requests (only for private accounts)

---

**Recommendation:** Test with current setup, then upgrade Vercel Pro if you like the platform. It's the path of least resistance! 🚀
