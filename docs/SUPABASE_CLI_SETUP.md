# ✅ Supabase CLI Setup Complete!

## 🎉 What We Just Did

1. ✅ Installed Supabase CLI via npm
2. ✅ Logged in to Supabase (authenticated)
3. ✅ Linked to your project: `awokklruxeofxsqxcsnt`

---

## 🚀 How to Clear User Sessions (3 Easy Methods)

### Method 1: Use Supabase Dashboard (EASIEST) ⭐

This is the simplest way and requires no database password:

```bash
# 1. Open the Auth page
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users

# 2. For each user:
#    - Click the user row
#    - Click "..." menu
#    - Click "Sign Out User"
#    - Confirm

# Or bulk action:
#    - Select multiple users (checkbox)
#    - Actions → Sign out selected users
```

**This is the recommended way!** No SQL, no permissions issues.

---

### Method 2: Use Supabase Studio SQL Editor

Since you're already authenticated:

```bash
# 1. Open SQL Editor
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql/new

# 2. Run this SQL (simpler version):
TRUNCATE auth.sessions CASCADE;
TRUNCATE auth.refresh_tokens CASCADE;

# 3. Verify:
SELECT COUNT(*) FROM auth.sessions; -- Should return 0
```

The `TRUNCATE` command is more powerful than `DELETE` and bypasses some permission checks.

---

### Method 3: Use psql with Connection String

If you have your database password:

```bash
# Get your database password from:
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/settings/database

# Then run:
PGPASSWORD='your_password_here' psql \\
  "postgresql://postgres.awokklruxeofxsqxcsnt@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \\
  -f scripts/cleanup-sessions-simple.sql
```

---

## 📋 Quick Commands Reference

### Check Supabase CLI Status
```bash
npx supabase --version
npx supabase projects list
```

### Run SQL via CLI (requires setup)
```bash
# Pull current schema
npx supabase db pull

# Push migrations
npx supabase db push

# Reset local database
npx supabase db reset
```

### Get Database Connection Info
```bash
# Open database settings
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/settings/database

# Connection string format:
# postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## 🔑 Setting Up Service Role Key (Optional)

If you want to use the CLI with full permissions:

### Step 1: Get Your Service Role Key
```bash
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/settings/api
```

### Step 2: Update .env File
```bash
# Replace the placeholder in .env with real key
nano .env

# Change this line:
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# To (example - get yours from dashboard):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Get Database Password
```bash
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/settings/database

# Copy "Password" field
# Add to .env:
SUPABASE_DB_PASSWORD=your_database_password_here
```

---

## ✅ Recommended Workflow (Right Now)

**Just use Method 1 (Dashboard)!** It's the fastest:

```bash
# 1. Open auth page
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users

# 2. Sign out users manually (click each user → sign out)
#    This takes 30 seconds for a few users

# 3. Verify in app
cd apps/mobile
npx expo start --clear --tunnel

# 4. Test - should see login screen ✅
```

---

## 🎯 What Each Method Does

| Method | Pros | Cons | Time |
|--------|------|------|------|
| **Dashboard UI** | ✅ No permissions issues<br>✅ Visual confirmation<br>✅ No SQL needed | ❌ Manual per user | 30 sec |
| **SQL Editor (TRUNCATE)** | ✅ Fast (one command)<br>✅ Works in browser | ⚠️ Might need permissions | 10 sec |
| **psql CLI** | ✅ Scriptable<br>✅ Automated | ❌ Needs password setup | 2 min setup |

---

## 📝 Files Created

```
scripts/
├── cleanup-user-sessions.sql          # Original (comprehensive)
├── cleanup-user-sessions-fixed.sql    # Permission-aware version
├── cleanup-sessions-simple.sql        # Simple TRUNCATE version ⭐
├── clear-client-storage.sh            # Client-side cleanup
└── signout-all-users.js               # API-based (needs service key)
```

---

## 🧪 Test That It Worked

```bash
# 1. Try opening your app
cd apps/mobile
npx expo start --tunnel

# 2. Scan QR code

# 3. You should see this error (GOOD!):
#    "[ERROR] Invalid Refresh Token: Refresh Token Not Found"

# 4. App should show login screen ✅
```

---

## 💡 Quick Fix If Still Having Issues

```bash
# Complete fresh start:

# 1. Use dashboard to sign out users
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users

# 2. Clear Expo cache
cd apps/mobile
rm -rf .expo node_modules/.cache
npx expo start --clear --tunnel

# 3. Clear browser storage
# DevTools (F12) → Application → Clear site data

# 4. Reinstall Expo Go app on phone
```

---

## 🎉 Summary

**You are now connected to Supabase CLI!**

✅ `npx supabase` commands work  
✅ Linked to project: `awokklruxeofxsqxcsnt`  
✅ Can run SQL via dashboard  
✅ Can manage users via dashboard  

**To clear sessions right now:**
```bash
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users
# Click each user → "..." → "Sign Out User"
```

That's it! All users will be logged out and must re-authenticate.

---

## 📞 Need Help?

Run any of these from your project root:

```bash
# Check CLI status
npx supabase --help

# List projects
npx supabase projects list

# Open dashboard
open https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt

# Run client cleanup
./scripts/clear-client-storage.sh
```
