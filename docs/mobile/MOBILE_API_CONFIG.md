# Mobile App API Configuration

## Issue Fixed
The mobile app was hardcoded to call `https://partyhause.vercel.app/api/*` but no deployment exists at that URL, causing "DEPLOYMENT_NOT_FOUND" errors when publishing events.

## Solution Implemented
Added environment variable configuration to dynamically set the API URL based on environment.

## Environment Variable
**File:** `apps/mobile/.env`

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### URL Options

#### For Android Emulator (Default)
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
- `10.0.2.2` is the Android emulator's alias for `localhost`
- Use this when testing with Android emulator + local Vercel dev server

#### For iOS Simulator
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```
- iOS simulator can use `localhost` directly

#### For Physical Devices (Expo Go with Tunnel)
```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000
```
- Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`)
- Both computer and phone must be on same network

#### For Production
```bash
EXPO_PUBLIC_API_URL=https://partyhaus.vercel.app
```
- **NOTE:** Production URL is `partyhaus.vercel.app` (no 'e' in partyhaus)
- Use after deploying to Vercel production
- Make sure `/api/events`, `/api/guests`, `/api/timeline` endpoints are deployed

## CURRENT STATUS (Updated: Oct 23, 2025)

### ✅ Mobile App Configuration
- **API URL Updated:** `https://partyhaus.vercel.app`
- **Environment variable configured:** `EXPO_PUBLIC_API_URL`
- **All fetch calls updated** to use dynamic URL

### ⚠️ Deployment Status
- **Health endpoint WORKS:** ✅ https://partyhaus.vercel.app/api/health
- **Events endpoint MISSING:** ❌ https://partyhaus.vercel.app/api/events (404 NOT_FOUND)
- **Guests endpoint MISSING:** ❌ https://partyhaus.vercel.app/api/guests (404 NOT_FOUND)
- **Timeline endpoint MISSING:** ❌ https://partyhaus.vercel.app/api/timeline (404 NOT_FOUND)

### 🚀 Next Action Required
**Deploy missing API endpoints to production:**
```powershell
cd "c:\Users\MY PC\OneDrive\Documents\PartyHause-main"
vercel --prod
```

After deployment completes:
1. Verify endpoints work: `curl https://partyhaus.vercel.app/api/events`
2. Restart Expo server: `npx expo start --tunnel --clear`
3. Test event publishing from mobile app
4. Verify events appear in Supabase database

## Code Changes

### review.tsx
Added environment variable import at the top:
```typescript
// Get API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

Updated all fetch calls to use the dynamic URL:
```typescript
// Before:
await fetch('https://partyhause.vercel.app/api/events', {...})

// After:
await fetch(`${API_URL}/api/events`, {...})
```

### Modified Files
1. `apps/mobile/.env` - Added `EXPO_PUBLIC_API_URL` variable
2. `apps/mobile/app/events/create/review.tsx` - Updated 3 fetch calls to use environment variable

## Testing Steps

### 1. Start Local API Server
```powershell
cd c:\Users\MY PC\OneDrive\Documents\PartyHause-main
vercel dev --listen 3000
```

### 2. Restart Expo Server
```powershell
# Stop current Expo server (Ctrl+C)
# Restart to pick up new environment variable
cd apps\mobile
npx expo start --tunnel --clear
```

### 3. Test Event Publishing
1. Open app in Expo Go
2. Create new event with any template
3. Fill in details and publish
4. Check terminal logs for API calls to `http://10.0.2.2:3000/api/events`
5. Verify event is created in Supabase

### 4. Test Draft Storage
1. Create event and tap "Save as Draft"
2. Navigate to home, tap "Drafts" button
3. Verify draft appears in list
4. Tap "Continue Editing" to restore
5. Publish event and verify draft is deleted

## Troubleshooting

### "Network request failed"
- Verify Vercel dev server is running on port 3000
- Check firewall isn't blocking port 3000
- For Android emulator, ensure `10.0.2.2` is used (not `localhost`)

### "ECONNREFUSED"
- Vercel dev server not running - start with `vercel dev --listen 3000`
- Wrong port - verify server is on 3000, not 3001

### Environment variable not updating
- Restart Expo server completely (Ctrl+C and restart)
- Clear cache: `npx expo start --clear`
- Verify .env file is in `apps/mobile/` directory

### Still getting Vercel deployment errors
- Check .env file has correct `EXPO_PUBLIC_API_URL` value
- Verify no typos in environment variable name
- Restart Metro bundler to pick up changes

## Next Steps

### For Local Development
✅ Current setup is ready - use `http://10.0.2.2:3000`

### For Production Deployment
1. Deploy to Vercel: `.\scripts\deploy-to-vercel.ps1`
2. Update `.env`: `EXPO_PUBLIC_API_URL=https://partyhause.vercel.app`
3. Rebuild app to pick up production URL
4. Configure Supabase allowed origins to include vercel.app domain

### For Multiple Environments
Consider creating:
- `.env.development` - Local API
- `.env.staging` - Staging deployment
- `.env.production` - Production deployment

Use `EXPO_PUBLIC_ENV=production expo start` to switch environments.

## Related Documentation
- `EVENT_PUBLISHING_FIX.md` - Location formatting and draft storage
- `JSON_PARSE_ERROR_DEBUG.md` - Comprehensive error handling
- `PRODUCTION_DEPLOYMENT.md` - Vercel deployment guide
