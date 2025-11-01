-- Create User Profile for Current Authenticated User
-- Run this in Supabase SQL Editor after signing up

-- First, check your auth.users ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Copy your ID from above and use it below
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

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
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with your actual user ID
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

-- Verify profile was created
SELECT id, username, display_name, bio, account_type, created_at
FROM public.user_profiles
WHERE id = 'YOUR_USER_ID_HERE';  -- ⚠️ REPLACE THIS with your actual user ID
