-- Create User Profile for thecommodore30@gmail.com
-- User ID: 97ba4ccb-5733-473e-ab88-7e0591f867a6
-- Run this in Supabase SQL Editor

-- Step 1: Verify your user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '97ba4ccb-5733-473e-ab88-7e0591f867a6';

-- Step 2: Create your profile (customize the values below)
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
  '97ba4ccb-5733-473e-ab88-7e0591f867a6',  -- Your actual user ID
  'thecommodore',          -- ✏️ CUSTOMIZE: Choose your username (3-30 chars, alphanumeric + underscore)
  'The Commodore',         -- ✏️ CUSTOMIZE: Your display name
  'Party host & creator 🎉', -- ✏️ CUSTOMIZE: Your bio (optional)
  'creator',                -- ✏️ CUSTOMIZE: 'personal', 'business', or 'creator'
  false,                    -- Public profile (set true for private)
  0,                        -- Initial followers count
  0,                        -- Initial following count
  0,                        -- Initial events hosted
  0                         -- Initial Haus Score
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  account_type = EXCLUDED.account_type,
  updated_at = NOW();

-- Step 3: Verify profile was created successfully
SELECT 
  id, 
  username, 
  display_name, 
  bio, 
  account_type,
  is_private,
  partycrew_count,
  crewing_count,
  events_hosted,
  haus_score,
  created_at
FROM public.user_profiles
WHERE id = '97ba4ccb-5733-473e-ab88-7e0591f867a6';

-- Expected result: One row with your profile data
-- If you see the row, your profile is ready! Reload Expo Go and test the Profile button.
