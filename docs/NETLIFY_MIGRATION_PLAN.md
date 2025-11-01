# Netlify Migration Plan - Deploy All 19 API Endpoints

## 📊 Current State

### ✅ **Deployed on Vercel (11/19 endpoints)**

1. `api/email.ts` - Send invitation emails
2. `api/health.ts` - Health check
3. `api/events.ts` - Event CRUD operations
4. `api/guests.ts` - Guest management
5. `api/timeline.ts` - Event timeline/schedule
6. `api/partycrew/toggle.ts` - Join/leave PartyCrew
7. `api/partycrew/members.ts` - Get PartyCrew members
8. `api/partycrew/crewing-with.ts` - Get following list
9. `api/users/[id].ts` - User profile by ID
10. `api/users/suggested.ts` - Suggested users
11. `api/feed/crew.ts` - PartyCrew content feed

### ❌ **Not Deployed (8/19 endpoints)**

12. `api/email-webhook.ts` - Email delivery webhooks
13. `api/event-templates.ts` - Get event templates
14. `api/create-event-from-template.ts` - Create from template
15. `api/partycrew/requests.ts` - Connection requests
16. `api/send-email.ts` - Alternative email endpoint
17. `api/templates.ts` - Template management
18. `api/templates/[id].ts` - Single template by ID
19. `api/test.ts` - Testing endpoint

**Note:** `api/services/templateService.ts` is a utility, not an endpoint.

---

## 🎯 Why Netlify?

### **Benefits:**
- ✅ **Unlimited Functions** (no 12-function limit)
- ✅ **Free Tier:** 125,000 invocations/month
- ✅ **100 hours** of function runtime/month
- ✅ **Similar to Vercel** (easy migration)
- ✅ **Great DX** (Developer Experience)
- ✅ **Instant rollbacks**
- ✅ **Environment variables** built-in

### **Netlify vs Vercel Comparison:**

| Feature | Vercel Hobby | Netlify Free | Winner |
|---------|--------------|--------------|--------|
| Functions | 12 limit | Unlimited | Netlify ✅ |
| Invocations | Unlimited | 125k/month | Vercel |
| Build minutes | 6,000/month | 300/month | Vercel |
| Bandwidth | 100 GB | 100 GB | Tie |
| Price | $0 | $0 | Tie |

---

## 📋 Migration Plan (Step-by-Step)

### **Phase 1: Preparation (15 minutes)**

#### Step 1.1: Install Netlify CLI
```bash
npm install -g netlify-cli

# Verify installation
netlify --version
```

#### Step 1.2: Create Netlify Configuration
```bash
cd /Users/startferanmi/Data-Scientist/Partyhause

# Create netlify.toml
cat > netlify.toml << 'EOF'
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
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
EOF
```

#### Step 1.3: Prepare API Functions for Netlify

Netlify Functions use a slightly different format. Create adapter:

```bash
mkdir -p netlify/functions
```

Create adapter script:
```javascript
// netlify/functions/[function-name].ts
import { Handler } from '@netlify/functions';
import handler from '../../api/[original-file]';

export const handler: Handler = async (event, context) => {
  // Convert Netlify event to Vercel-like request
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : undefined,
    query: event.queryStringParameters || {},
  };

  // Mock response object
  let statusCode = 200;
  let responseBody: any;
  let responseHeaders: Record<string, string> = {};

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseBody = data;
      return res;
    },
    setHeader: (key: string, value: string) => {
      responseHeaders[key] = value;
    },
  };

  // Call original handler
  await handler(req as any, res as any);

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...responseHeaders,
    },
    body: JSON.stringify(responseBody),
  };
};
```

---

### **Phase 2: Automated Migration Script (Recommended)**

Create a script to auto-convert all endpoints:

```bash
# Create migration script
cat > scripts/migrate-to-netlify.sh << 'EOF'
#!/bin/bash

# Create Netlify functions directory
mkdir -p netlify/functions

# List of all API endpoints
API_FILES=(
  "email"
  "health"
  "events"
  "guests"
  "timeline"
  "email-webhook"
  "event-templates"
  "create-event-from-template"
  "send-email"
  "templates"
  "test"
)

# Copy and adapt each file
for file in "${API_FILES[@]}"; do
  echo "Migrating api/$file.ts..."
  
  # Create Netlify function wrapper
  cat > "netlify/functions/$file.ts" << FUNC
import { Handler } from '@netlify/functions';
import apiHandler from '../../api/$file';

export const handler: Handler = async (event) => {
  // Convert Netlify event to Vercel request format
  const req: any = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : undefined,
    query: event.queryStringParameters || {},
  };

  let response: any = { statusCode: 200, body: {} };
  
  const res: any = {
    status: (code: number) => {
      response.statusCode = code;
      return res;
    },
    json: (data: any) => {
      response.body = data;
      return res;
    },
    setHeader: () => res,
  };

  await apiHandler(req, res);

  return {
    statusCode: response.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response.body),
  };
};
FUNC

  echo "✅ Created netlify/functions/$file.ts"
done

# Handle nested routes
mkdir -p netlify/functions/partycrew
mkdir -p netlify/functions/users
mkdir -p netlify/functions/feed
mkdir -p netlify/functions/templates

echo "Migration script complete!"
EOF

chmod +x scripts/migrate-to-netlify.sh
```

---

### **Phase 3: Manual File Conversion (Alternative)**

If you prefer manual control, here's the template for each endpoint:

#### Example: Convert `api/health.ts` to Netlify

```typescript
// netlify/functions/health.ts
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // Your original logic here
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(healthStatus),
  };
};
```

---

### **Phase 4: Environment Variables**

#### Step 4.1: Export from Vercel
```bash
# List Vercel env vars
vercel env ls

# Pull them
vercel env pull .env.netlify
```

#### Step 4.2: Add to Netlify
```bash
# Login to Netlify
netlify login

# Link project
netlify link

# Add environment variables
netlify env:set EXPO_PUBLIC_SUPABASE_URL "https://awokklruxeofxsqxcsnt.supabase.co"
netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-key"
netlify env:set MAILERSEND_API_TOKEN "your-mailersend-token"
netlify env:set MAILERSEND_FROM_EMAIL "your-from-email"
# ... add all your env vars
```

Or use the Netlify UI:
1. Go to: https://app.netlify.com
2. Select your site
3. Site settings → Environment variables
4. Add all variables

---

### **Phase 5: Deployment**

#### Step 5.1: Initial Deploy
```bash
cd /Users/startferanmi/Data-Scientist/Partyhause

# Build your app
npm run build

# Deploy to Netlify
netlify deploy --prod
```

#### Step 5.2: Connect to Git (Auto-deploy)
```bash
# Link to GitHub repo
netlify sites:create --name partyhause

# Enable auto-deploy
netlify link

# Set up continuous deployment
git push origin main
# Netlify will auto-deploy on every push
```

---

### **Phase 6: Update Mobile App**

Update API base URL in your mobile app:

```typescript
// apps/mobile/.env
# OLD (Vercel)
# EXPO_PUBLIC_API_URL=https://partyhause.vercel.app

# NEW (Netlify)
EXPO_PUBLIC_API_URL=https://partyhause.netlify.app

# Or use custom domain
EXPO_PUBLIC_API_URL=https://api.partyhause.com
```

---

### **Phase 7: Testing**

#### Test each endpoint:

```bash
# Health check
curl https://partyhause.netlify.app/.netlify/functions/health

# Events
curl https://partyhause.netlify.app/.netlify/functions/events

# User profile
curl https://partyhause.netlify.app/.netlify/functions/users/[id]

# PartyCrew
curl https://partyhause.netlify.app/.netlify/functions/partycrew/toggle
```

---

### **Phase 8: Custom Domain (Optional)**

```bash
# Add custom domain
netlify domains:add api.partyhause.com

# Update DNS
# Add CNAME: api.partyhause.com → partyhause.netlify.app

# Enable HTTPS
netlify certs:create
```

---

## 🚀 Quick Start Migration (Fastest Path)

### Option A: Keep Existing Code Structure

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
```

2. **Create netlify.toml:**
```toml
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

3. **Deploy:**
```bash
netlify deploy --prod --dir=dist --functions=api
```

**Pros:** Zero code changes  
**Cons:** May have compatibility issues

---

### Option B: Use Adapter Pattern (Recommended)

1. Run migration script (Phase 2)
2. Test locally: `netlify dev`
3. Deploy: `netlify deploy --prod`

**Pros:** Clean separation, better control  
**Cons:** Extra adapter layer

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Backup Vercel configuration
- [ ] Document all environment variables
- [ ] List all API endpoints (done ✅)
- [ ] Test all endpoints on Vercel

### Migration
- [ ] Install Netlify CLI
- [ ] Create netlify.toml
- [ ] Convert API functions (manual or script)
- [ ] Set environment variables
- [ ] Deploy to Netlify
- [ ] Test all 19 endpoints

### Post-Migration
- [ ] Update mobile app API URL
- [ ] Test in Expo Go
- [ ] Monitor Netlify analytics
- [ ] Set up custom domain (optional)
- [ ] Configure CORS properly
- [ ] Set up webhooks

### Rollback Plan
- [ ] Keep Vercel deployment live
- [ ] Test Netlify thoroughly
- [ ] Switch DNS gradually
- [ ] Monitor error rates

---

## 🔧 Troubleshooting

### Issue: Function timeout
**Solution:** Increase timeout in netlify.toml:
```toml
[functions]
  "*".timeout = 30
```

### Issue: CORS errors
**Solution:** Add proper headers:
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}
```

### Issue: Environment variables not loading
**Solution:** 
```bash
netlify env:list
netlify env:set KEY "value"
```

---

## 💰 Cost Analysis

### Netlify Free Tier Limits:
- ✅ **125,000 function invocations/month**
- ✅ **100 hours function runtime/month**
- ✅ **100 GB bandwidth/month**
- ✅ **300 build minutes/month**

### Estimated Usage (per month):
- Functions: ~50,000 invocations
- Runtime: ~25 hours
- Bandwidth: ~50 GB

**Verdict:** You'll stay well within free tier! ✅

---

## 🎯 Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Preparation** | 15 min | Netlify CLI |
| **Script Creation** | 30 min | None |
| **Endpoint Migration** | 1-2 hours | Script |
| **Environment Setup** | 15 min | Vercel env vars |
| **Deployment** | 10 min | Migration complete |
| **Testing** | 30 min | Deployment live |
| **Mobile App Update** | 5 min | Testing complete |

**Total:** ~3-4 hours for complete migration

---

## 📝 Next Actions

### Immediate:
1. ✅ Read this plan
2. ⏰ Decide: Migrate now or upgrade Vercel Pro ($20/month)?
3. 📋 If migrating: Start with Phase 1 (Preparation)

### This Week:
- Complete migration to Netlify
- Test all 19 endpoints
- Update mobile app
- Deploy to production

### Long-term:
- Monitor Netlify analytics
- Optimize function performance
- Consider Pro plan if needed ($19/month for more resources)

---

## 🔗 Resources

- **Netlify Functions Docs:** https://docs.netlify.com/functions/overview/
- **Migration Guide:** https://docs.netlify.com/functions/migrate/
- **TypeScript Support:** https://docs.netlify.com/functions/typescript/
- **Environment Variables:** https://docs.netlify.com/environment-variables/overview/
- **Netlify CLI:** https://docs.netlify.com/cli/get-started/

---

## ✅ Success Criteria

Migration is successful when:
- ✅ All 19 API endpoints deployed
- ✅ Mobile app connects successfully
- ✅ Profile button works (user profile API)
- ✅ Explore tab works (feed API)
- ✅ PartyCrew features functional
- ✅ No increase in error rates
- ✅ Response times < 500ms

---

**Ready to migrate?** Start with Phase 1 and work through systematically. Each phase builds on the previous one. Good luck! 🚀
