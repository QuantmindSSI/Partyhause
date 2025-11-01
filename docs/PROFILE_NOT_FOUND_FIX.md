# User Profile Not Found - Quick Fix

## The Issue

When you click the Profile button in the Dashboard, you're seeing the error:
```
[useUserProfile Error]: [Error: Failed to fetch profile]
```

This error occurs because:
1. You have a user account in `auth.users` (authentication table)
2. But you don't have a corresponding profile in `user_profiles` (social features table)

The PartyCrew system needs **both** records to function properly.

---

## The Solution

You need to create your user profile in the `user_profiles` table. Follow these steps:

### Step 1: Get Your User ID

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt
2. Go to **SQL Editor**
3. Run this query to find your user ID:

```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

4. Copy your `id` from the results (it's a UUID like `97ba4ccb-5733-473e-ab88-7e0591f867a6`)

### Step 2: Create Your Profile

Run this SQL (replace `YOUR_USER_ID_HERE` with your actual ID from Step 1):

```sql
INSERT INTO public.user_profiles (
  id,
  username,
  display_name,
  bio,
  account_type,
  is_private,
  partycrew_count,
  crewing_count,
  events_hosted,
  haus_score
) VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS
  'yourhandle',          -- Choose a unique username (3-30 chars, alphanumeric + underscore)
  'Your Display Name',   -- Your full name or display name
  'Party enthusiast 🎉', -- Optional bio
  'creator',             -- 'personal', 'business', or 'creator'
  false,                 -- is_private: false = public profile
  0,                     -- partycrew_count (followers)
  0,                     -- crewing_count (following)
  0,                     -- events_hosted
  0                      -- haus_score
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  account_type = EXCLUDED.account_type,
  updated_at = NOW();
```

### Step 3: Verify Profile Created

```sql
SELECT id, username, display_name, bio, account_type, created_at
FROM public.user_profiles
WHERE id = 'YOUR_USER_ID_HERE';  -- ⚠️ REPLACE THIS
```

You should see your profile record with all the data you entered.

---

## Step 4: Test in Expo Go

1. **Reload your app** in Expo Go (shake device → "Reload")
2. Navigate to Dashboard
3. Tap the **Profile button** (person icon, top right)
4. You should now see your profile with stats:
   - Username and display name
   - Bio (if you added one)
   - Stats: 0 PartyCrew, 0 Crewing, X Events, 0 Haus Score
   - "Edit Profile" button
   - Account type badge

---

## What Each Field Means

- **`id`**: Must match your `auth.users` ID (this links authentication to profile)
- **`username`**: Unique handle for your profile (e.g., @yourhandle)
- **`display_name`**: Your full name shown in the app
- **`bio`**: Optional description about yourself
- **`account_type`**: 
  - `'personal'` - Regular user
  - `'creator'` - Event host/creator
  - `'business'` - Business account
- **`is_private`**: 
  - `false` - Public profile (anyone can see)
  - `true` - Private profile (requires approval to follow)
- **Stats** (all start at 0):
  - `partycrew_count` - Number of followers
  - `crewing_count` - Number you're following
  - `events_hosted` - Events you've created
  - `haus_score` - Reputation score

---

## Why This Happens

The PartyCrew migration creates the `user_profiles` table, but it doesn't automatically create profiles for existing users. This is intentional because:

1. Users need to choose their own username
2. Users need to set their account type
3. Privacy settings need to be configured

In production, you'd typically create the profile:
- During onboarding flow (after signup)
- With a "Complete Your Profile" screen
- Or automatically with default values

For testing, we create it manually via SQL.

---

## Future Improvement

Consider adding an auto-profile-creation trigger:

```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    username,
    display_name,
    account_type
  ) VALUES (
    NEW.id,
    'user_' || substr(NEW.id::text, 1, 8),  -- Generated username
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'personal'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

This would auto-create a profile when a user signs up, but they'd still need to customize it.

---

## Testing Checklist

After creating your profile:

- [ ] Profile button appears in Dashboard header
- [ ] Tapping profile button opens profile screen (no error)
- [ ] Profile shows your username and display name
- [ ] Stats show: 0 PartyCrew, 0 Crewing, X Events, 0 Haus Score
- [ ] "Edit Profile" button appears (because it's your profile)
- [ ] Bio section displays (if you added one)
- [ ] Account type badge shows correct type
- [ ] No console errors

---

## Need Help?

If you still see errors after creating the profile:

1. Check the Metro bundler console for detailed errors
2. Verify your user ID matches in both `auth.users` and `user_profiles`
3. Reload the Expo Go app
4. Check the network tab to see the API response

The improved error message should now show:
```
Profile Not Found
This user profile hasn't been created yet.
If this is your profile, you need to create it in Supabase first.

💡 Check scripts/create-user-profile.sql for instructions
```
