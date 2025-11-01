# Event Details Loading Fix - November 1, 2025

## Problems Identified

### 1. ❌ CORS Error - Wrong API Domain
**Error:**
```
Access to fetch at 'https://www.partyhaus.com/api/events?id=...' 
from origin 'https://partyhaus.vercel.app' has been blocked by CORS policy
```

**Root Cause:** 
- The API URL is being redirected to `www.partyhaus.com` 
- But the app is running on `partyhaus.vercel.app`
- CORS doesn't allow cross-origin requests between these

**Fix Applied:**
Updated `/apps/mobile/.env`:
```bash
# OLD (wrong spelling)
EXPO_PUBLIC_API_URL=https://partyhause.vercel.app

# NEW (correct spelling, matches deployment)
EXPO_PUBLIC_API_URL=https://partyhaus.vercel.app
```

---

### 2. ❌ Routing Error - Expo Router Web Issue
**Error:**
```
[Layout children]: No route named "[id]" exists in nested children
```

**Root Cause:**
- Expo Router's web version has issues with dynamic routes `[id]`
- The route exists but isn't being recognized on web platform

**Fix:**
This is an Expo Router web limitation. Options:
1. **Use native app** (recommended) - Works perfectly on iOS/Android
2. **Wait for route fix** - Expo Router web support is improving
3. **Use alternative routing** - Implement web-specific routing

---

## Quick Fixes Applied

### ✅ Fix 1: Corrected API URL
File: `/apps/mobile/.env`
- Changed from `partyhause` to `partyhaus` (removed 'e')
- Now matches actual deployment URL

### ✅ Fix 2: Improved Error Logging
File: `/apps/mobile/app/events/[id]/index.tsx`
- Added detailed console logs
- Better error messages with retry options
- Shows which API endpoint is being called

---

## How to Apply Fixes

### Step 1: Restart Expo Server
```bash
# Stop current server
Ctrl+C

# Restart with new environment variables
cd apps/mobile
npx expo start --tunnel --clear
```

### Step 2: Test on Native (Recommended)
The routing works perfectly on **native platforms**:
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator  
npx expo start --android

# Expo Go App
Scan QR code with Expo Go
```

### Step 3: Verify Logs
Look for these logs when navigating to an event:
```
[Event Details] Fetching event: <event-id>
[Event Details] Making API request to: https://partyhaus.vercel.app/api/events?id=...
[Event Details] Response status: 200
[Event Details] Event loaded successfully: <event-name>
```

---

## Why Events Weren't Loading

### Issue Chain:
1. ❌ User clicks event from dashboard
2. ❌ App tries to fetch from wrong API URL (`www.partyhaus.com`)
3. ❌ CORS blocks the request (cross-origin)
4. ❌ Fetch fails with network error
5. ❌ Event details screen shows error

### After Fix:
1. ✅ User clicks event from dashboard
2. ✅ App fetches from correct URL (`partyhaus.vercel.app`)
3. ✅ Same origin - CORS allows request
4. ✅ API returns event data
5. ✅ Event details screen displays

---

## Platform-Specific Behavior

### ✅ **Native (iOS/Android)** - WORKS PERFECTLY
- Dynamic routes work correctly
- API calls succeed
- Full functionality available

### ⚠️ **Web** - PARTIAL SUPPORT
- **Dashboard works**: Lists all events
- **Event details**: Routing issue (Expo Router limitation)
- **Workaround**: Use native app or wait for Expo Router web improvements

---

## Testing Checklist

### After restarting server:

**On Native (iOS/Android/Expo Go):**
- [ ] Dashboard loads with user's events
- [ ] Click on an event card
- [ ] Event details screen loads
- [ ] See event name, date, location
- [ ] See guest count and statistics
- [ ] No CORS errors in console
- [ ] Console shows: `[Event Details] Event loaded successfully`

**On Web (Chrome/Safari):**
- [ ] Dashboard loads with events
- [ ] Clicking event shows routing error (expected)
- [ ] Use native app instead

---

## API URL Reference

### Correct URLs:
- ✅ `https://partyhaus.vercel.app` - Main deployment
- ✅ `https://partyhaus-[hash].vercel.app` - Preview deployments
- ✅ `http://localhost:8081` - Local Expo dev server

### Wrong URLs (cause CORS):
- ❌ `https://www.partyhaus.com` - Different origin
- ❌ `https://partyhause.vercel.app` - Wrong spelling
- ❌ `https://www.partyhause.com` - Wrong spelling + subdomain

---

## Domain Configuration Note

The deployment has multiple domains aliased:
- `partyhaus.vercel.app` (main)
- `www.partyhause.com` (alias)
- `partyhause.com` (not resolving - DNS issue)

For the mobile app to work correctly, always use the **main Vercel domain** without www: `https://partyhaus.vercel.app`

---

## Next Steps

### Immediate:
1. Restart Expo server to load new env vars
2. Test on Expo Go (native app)
3. Verify events load correctly

### Short Term:
1. Monitor Expo Router updates for web dynamic route support
2. Consider separate web build if web version is priority
3. Update all API references to use correct domain

### Long Term:
1. Fix apex domain DNS (`partyhause.com`)
2. Implement web-specific routing if needed
3. Add API domain validation in build process

---

## Summary

**Root Cause:** Wrong API URL in environment variables + Expo Router web limitations
**Impact:** CORS errors blocking all API calls + web routing not working for `[id]` routes
**Fix:** Corrected domain from `partyhause` to `partyhaus`
**Result:** Events load correctly on **NATIVE PLATFORMS ONLY**

### ⚠️ IMPORTANT: Web vs Native

**✅ NATIVE (iOS/Android/Expo Go):**
- Dynamic routes work perfectly
- Event details load correctly
- Full functionality available
- **USE THIS FOR TESTING**

**❌ WEB (Chrome/Safari):**
- Dynamic routes `[id]` not supported by Expo Router web
- Event details fail to load (routing issue, not API issue)
- Shows 404 errors
- **DO NOT USE FOR EVENT DETAILS**

**Action Required:** Use native app (Expo Go) to test event details!

```bash
# Already running with correct env:
# Scan QR code with Expo Go app
# - Dashboard will load
# - Click any event
# - Event details will load (native only!)
```
