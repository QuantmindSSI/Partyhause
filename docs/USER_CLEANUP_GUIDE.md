# User Session Cleanup Guide
## Reset Application for Fresh Testing

**Date**: November 2, 2025  
**Purpose**: Force all users to log out and test from scratch  
**Use Case**: Development testing, demo preparation, QA cycles

---

## Overview

This guide helps you completely reset the application so all users must:
1. Log in again (no saved sessions)
2. Start with fresh data (optional)
3. Test authentication and onboarding flows from scratch

---

## Quick Start (TL;DR)

```bash
# 1. Clear server-side sessions (Supabase)
# Go to: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql
# Run: scripts/cleanup-user-sessions.sql

# 2. Clear client-side caches
chmod +x scripts/clear-client-storage.sh
./scripts/clear-client-storage.sh

# 3. Clear browser storage (manual)
# Open DevTools → Application → Clear site data

# 4. Restart Expo fresh
cd apps/mobile
npx expo start --clear --tunnel
```

---

## Detailed Cleanup Process

### Step 1: Clear Server-Side Sessions (Supabase)

**What it does**: Logs out ALL users by deleting their sessions and tokens

**How to do it**:

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql/new
   ```

2. **Open the cleanup script**:
   ```bash
   cat scripts/cleanup-user-sessions.sql
   ```

3. **Choose your cleanup level**:

   **Option A: Force Re-Login Only** (Recommended)
   ```sql
   -- Keeps user accounts and data
   -- Just logs everyone out
   
   DELETE FROM auth.sessions;
   DELETE FROM auth.refresh_tokens;
   DELETE FROM auth.one_time_tokens;
   ```

   **Option B: Clear Social Data Too**
   ```sql
   -- Logs out users AND clears their follows, posts, etc.
   
   DELETE FROM auth.sessions;
   DELETE FROM auth.refresh_tokens;
   DELETE FROM connections;
   DELETE FROM partycrew_posts;
   DELETE FROM partycrew_post_likes;
   ```

   **Option C: Complete Reset** (Nuclear option)
   ```sql
   -- Deletes EVERYTHING including user accounts
   
   DELETE FROM auth.sessions;
   DELETE FROM auth.refresh_tokens;
   DELETE FROM user_profiles;
   DELETE FROM auth.users;
   -- etc...
   ```

4. **Run the script** in Supabase SQL Editor

5. **Verify it worked**:
   ```sql
   SELECT COUNT(*) as active_sessions FROM auth.sessions;
   -- Should return 0
   
   SELECT COUNT(*) as total_users FROM auth.users;
   -- Shows how many accounts remain
   ```

**Result**: ✅ All users are now logged out on the server side

---

### Step 2: Clear Client-Side Storage

**What it does**: Removes cached auth tokens from browsers and mobile apps

**How to do it**:

1. **Run the automated script**:
   ```bash
   cd /Users/startferanmi/Data-Scientist/Partyhause
   chmod +x scripts/clear-client-storage.sh
   ./scripts/clear-client-storage.sh
   ```

2. **Follow the prompts**:
   - Clear Safari? (y/n)
   - Clear Chrome? (y/n)
   - Restart Expo? (y/n)

**What gets cleared**:
- ✅ Expo cache (.expo folder)
- ✅ Metro bundler cache
- ✅ Watchman cache
- ✅ TypeScript build cache
- ✅ Vite cache
- ✅ Browser localStorage (partial)

---

### Step 3: Clear Browser Storage Manually

**What it does**: Removes auth tokens stored in localStorage/cookies

**How to do it**:

#### Chrome/Edge/Brave
1. Open app in browser (http://localhost:5173)
2. Press **F12** (DevTools)
3. Go to **Application** tab
4. Click **Storage** in left sidebar
5. Click **"Clear site data"** button
6. Refresh page (Ctrl+R / Cmd+R)

#### Firefox
1. Open app in browser
2. Press **F12** (DevTools)
3. Go to **Storage** tab
4. Right-click **Local Storage** → Delete All
5. Right-click **Session Storage** → Delete All
6. Right-click **Cookies** → Delete All
7. Refresh page

#### Safari
1. Open app in browser
2. Develop → Show Web Inspector (Cmd+Option+I)
3. Go to **Storage** tab
4. Delete Local Storage, Session Storage, Cookies
5. Refresh page

**Keys to look for** (in Local Storage):
- `sb-awokklruxeofxsqxcsnt-auth-token`
- `supabase.auth.token`
- `supabase.auth.session`

---

### Step 4: Clear Mobile App Data

**What it does**: Forces mobile users to log in fresh

**How to do it**:

#### iOS (Expo Go App)
1. Long-press the **Expo Go** app icon
2. Tap **"Remove App"**
3. Confirm **"Delete App"**
4. Go to App Store
5. Reinstall **Expo Go**
6. Scan QR code again

#### Android (Expo Go App)
**Option A: Clear Data (keeps app)**
1. Go to **Settings** → **Apps**
2. Find **Expo Go**
3. Tap **Storage**
4. Tap **"Clear Data"** and **"Clear Cache"**
5. Reopen Expo Go
6. Scan QR code again

**Option B: Reinstall (complete fresh start)**
1. Go to **Settings** → **Apps**
2. Find **Expo Go**
3. Tap **Uninstall**
4. Go to Play Store
5. Reinstall **Expo Go**
6. Scan QR code again

---

### Step 5: Restart Development Servers

**What it does**: Ensures no cached data in dev servers

**How to do it**:

#### Stop all running servers
```bash
# Kill any existing Expo/Metro processes
pkill -f expo
pkill -f metro

# Kill web dev server (if running)
pkill -f vite
```

#### Clear and restart Expo
```bash
cd apps/mobile

# Clear cache and restart
npx expo start --clear --tunnel

# Or with specific options
npx expo start --clear --tunnel --reset-cache
```

#### Clear and restart web (if needed)
```bash
# From project root
npm run dev

# Or clear cache first
rm -rf node_modules/.vite dist
npm run dev
```

---

## Verification Checklist

After completing cleanup, verify everything is reset:

### Server-Side (Supabase)
- [ ] Run: `SELECT COUNT(*) FROM auth.sessions;` → Returns 0
- [ ] Run: `SELECT COUNT(*) FROM auth.refresh_tokens;` → Returns 0
- [ ] Check Supabase Dashboard → Authentication → Users → No active sessions shown

### Client-Side (Browser)
- [ ] Open DevTools → Application → Local Storage → Should be empty or minimal
- [ ] Open DevTools → Application → Session Storage → Should be empty
- [ ] Open DevTools → Application → Cookies → Supabase auth cookies removed
- [ ] Refresh page → Should redirect to login screen

### Mobile App
- [ ] Open app → Should show login/welcome screen
- [ ] No auto-login should occur
- [ ] Previously logged-in users must enter credentials again

### Development Environment
- [ ] `.expo` folder removed from `apps/mobile/`
- [ ] `node_modules/.cache` cleared
- [ ] Expo starts with clean bundler cache

---

## Testing Fresh User Experience

Once cleanup is complete, test the full user journey:

### 1. New User Signup Flow
```bash
# Start the app
cd apps/mobile && npx expo start --tunnel

# On mobile device:
1. Scan QR code
2. Tap "Sign Up"
3. Enter email/password
4. Verify email (check inbox)
5. Complete profile setup
```

### 2. Existing User Login Flow
```bash
# Users who had accounts before cleanup:
1. Open app
2. Should see login screen (not auto-logged in)
3. Enter credentials
4. Should successfully log in
5. Data should persist if you only cleared sessions
```

### 3. Authentication Edge Cases
- [ ] Test wrong password → Shows error
- [ ] Test password reset flow
- [ ] Test social login (if configured)
- [ ] Test session expiry handling
- [ ] Test logout functionality

---

## Cleanup Options Comparison

| Cleanup Level | Sessions | User Data | Accounts | Use Case |
|---------------|----------|-----------|----------|----------|
| **Level 1: Sessions Only** | ✅ Cleared | ✅ Kept | ✅ Kept | Test auth flow |
| **Level 2: Sessions + Social Data** | ✅ Cleared | ❌ Cleared | ✅ Kept | Test social features |
| **Level 3: Complete Wipe** | ✅ Cleared | ❌ Cleared | ❌ Deleted | Fresh install test |

### Recommended: Level 1 (Sessions Only)

**Best for most testing scenarios:**
- Users keep their accounts
- Data (events, follows, posts) is preserved
- Must log in again to access
- Quick to execute
- Easy to recover from

**SQL to run**:
```sql
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.one_time_tokens;
```

---

## Troubleshooting

### Problem: Users Still Auto-Login

**Possible causes:**
1. Client-side storage not cleared
2. Browser cached the page
3. Mobile app cache not cleared

**Solutions:**
```bash
# 1. Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 2. Clear Expo cache again
cd apps/mobile
npx expo start --clear --tunnel --reset-cache

# 3. Check localStorage in DevTools
# Should not see: sb-*-auth-token keys
```

### Problem: SQL Script Fails

**Error**: "permission denied for table auth.sessions"

**Solution**: 
```sql
-- Use service role in Supabase SQL Editor
-- Or grant permissions:
GRANT DELETE ON auth.sessions TO authenticated;
```

**Error**: "cannot delete from table auth.sessions because other objects depend on it"

**Solution**:
```sql
-- Disable triggers temporarily
ALTER TABLE auth.sessions DISABLE TRIGGER ALL;
DELETE FROM auth.sessions;
ALTER TABLE auth.sessions ENABLE TRIGGER ALL;
```

### Problem: Mobile App Crashes After Cleanup

**Solution:**
```bash
# 1. Clear cache and reinstall
cd apps/mobile
rm -rf node_modules/.expo node_modules/.cache
npm install
npx expo start --clear

# 2. If still failing, reinstall Expo Go app on device
```

---

## Automation Scripts

### Daily Reset for Development

Create a cron job or npm script for daily cleanup:

**package.json**:
```json
{
  "scripts": {
    "reset:dev": "./scripts/clear-client-storage.sh && echo 'Now run SQL script in Supabase'",
    "reset:sessions": "echo 'Run SQL: DELETE FROM auth.sessions, auth.refresh_tokens'",
    "fresh:start": "npm run reset:dev && cd apps/mobile && npx expo start --clear --tunnel"
  }
}
```

**Usage**:
```bash
npm run reset:dev
npm run fresh:start
```

---

## Recovery / Undo

### Can't Undo Session Deletion

**Important**: Once sessions are deleted, they **cannot be restored**. Users must log in again.

### Restore Accidentally Deleted User Accounts

If you ran Level 3 cleanup by mistake:

**Option 1: Supabase Backup (Pro Plan)**
```bash
# Contact Supabase support for Point-in-Time Recovery (PITR)
# Can restore to any point in last 7-30 days
```

**Option 2: Manual Recreation**
```sql
-- Users must sign up again
-- No automated way to restore
```

**Prevention**:
- Always review SQL before running
- Test cleanup scripts on staging first
- Keep backups of production data

---

## Best Practices

### Before Major Testing Cycles

1. **Announce to team**:
   ```
   "Running user session cleanup at 5 PM today.
   All users will need to log in again."
   ```

2. **Backup current state** (if important):
   ```bash
   # Export current data from Supabase Dashboard
   # Table Editor → Export to CSV
   ```

3. **Run cleanup during low-traffic time**

4. **Verify immediately after**:
   ```sql
   SELECT COUNT(*) FROM auth.sessions; -- Should be 0
   ```

### During Development

1. **Use Level 1 cleanup** (sessions only)
2. **Keep user accounts** for testing
3. **Clear client caches** frequently
4. **Document any custom cleanup needs**

### Before Production Deploy

1. **DO NOT run cleanup** on production
2. **Test cleanup thoroughly** on staging
3. **Have rollback plan** ready
4. **Communicate to users** if needed

---

## Related Documentation

- **Session Management**: `docs/AUTHENTICATION.md`
- **User Data Structure**: `supabase/migrations/20251101_partycrew_social_network.sql`
- **API Endpoints**: `docs/ENDPOINT_STATUS.md`

---

## Summary Commands

```bash
# Complete cleanup workflow:

# 1. Server-side (Supabase SQL Editor)
https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql
# Paste and run: scripts/cleanup-user-sessions.sql

# 2. Client-side (run from project root)
chmod +x scripts/clear-client-storage.sh
./scripts/clear-client-storage.sh

# 3. Browser (manual in DevTools)
# F12 → Application → Clear site data

# 4. Mobile (reinstall Expo Go)
# iOS: Delete app → Reinstall from App Store
# Android: Settings → Apps → Expo Go → Clear Data

# 5. Restart dev servers
cd apps/mobile
npx expo start --clear --tunnel
```

---

**Status**: Ready to use  
**Last Updated**: November 2, 2025  
**Tested**: ✅ Verified on development environment
