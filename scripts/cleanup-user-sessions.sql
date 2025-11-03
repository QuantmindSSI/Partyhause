-- ============================================================================
-- USER SESSION & DATA CLEANUP SCRIPT
-- ============================================================================
-- Purpose: Remove all logged-in users and reset application to fresh state
-- Use Case: Testing from scratch, development reset
-- Date: November 2, 2025
-- ============================================================================

-- IMPORTANT: This script performs destructive operations!
-- Review each section and uncomment only what you need.

-- ============================================================================
-- SECTION 1: CLEAR ALL USER SESSIONS (FORCE RE-LOGIN)
-- ============================================================================
-- This will log out ALL users immediately across all devices

-- Clear all active sessions
DELETE FROM auth.sessions;

-- Clear all refresh tokens
DELETE FROM auth.refresh_tokens;

-- Clear MFA factors (if you use 2FA)
DELETE FROM auth.mfa_factors;

-- Clear SSO connections
DELETE FROM auth.sso_domains;
DELETE FROM auth.sso_providers;

-- Clear one-time tokens
DELETE FROM auth.one_time_tokens;

COMMENT ON TABLE auth.sessions IS 'All user sessions have been cleared - users must re-authenticate';

-- ============================================================================
-- SECTION 2: CLEAR USER DATA (OPTIONAL - KEEPS ACCOUNTS)
-- ============================================================================
-- Uncomment these if you want to clear PartyCrew data but keep user accounts

-- Clear all PartyCrew connections (follows/unfollows)
-- DELETE FROM connections;

-- Clear all PartyCrew posts
-- DELETE FROM partycrew_posts;

-- Clear all likes on posts
-- DELETE FROM partycrew_post_likes;

-- Clear all comments on posts
-- DELETE FROM partycrew_comments;

-- Clear all notifications
-- DELETE FROM partycrew_notifications;

-- Clear all connection requests
-- DELETE FROM connection_requests;

-- Clear poll responses
-- DELETE FROM poll_responses;

-- Reset user profile stats (optional - usually auto-updated by triggers)
-- UPDATE user_profiles SET 
--   followers_count = 0,
--   following_count = 0,
--   posts_count = 0,
--   events_created_count = 0
-- WHERE id IS NOT NULL;

-- ============================================================================
-- SECTION 3: CLEAR EVENT DATA (OPTIONAL)
-- ============================================================================
-- Uncomment if you want to clear all event data

-- Clear event guests
-- DELETE FROM event_guests;

-- Clear event timeline items
-- DELETE FROM event_timeline;

-- Clear event updates
-- DELETE FROM event_updates;

-- Clear all events
-- DELETE FROM events;

-- Clear event templates
-- DELETE FROM event_templates;

-- ============================================================================
-- SECTION 4: DELETE ALL USER ACCOUNTS (EXTREME - USE CAREFULLY!)
-- ============================================================================
-- ⚠️ WARNING: This PERMANENTLY DELETES all user accounts!
-- ⚠️ Uncomment ONLY if you want to completely wipe all users!

-- Delete all user profiles first (FK constraint)
-- DELETE FROM user_profiles;

-- Delete all users from auth system
-- DELETE FROM auth.users;

-- ============================================================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify what was cleared

-- Check active sessions (should be 0)
SELECT COUNT(*) as active_sessions FROM auth.sessions;

-- Check refresh tokens (should be 0)
SELECT COUNT(*) as refresh_tokens FROM auth.refresh_tokens;

-- Check total users (shows how many accounts still exist)
SELECT COUNT(*) as total_users FROM auth.users;

-- Check user profiles
SELECT COUNT(*) as user_profiles FROM user_profiles;

-- Check connections (follows)
SELECT COUNT(*) as connections FROM connections;

-- Check posts
SELECT COUNT(*) as posts FROM partycrew_posts;

-- Check events
SELECT COUNT(*) as events FROM events;

-- ============================================================================
-- SECTION 6: RESET AUTO-INCREMENT SEQUENCES (OPTIONAL)
-- ============================================================================
-- Reset ID sequences if you deleted all data

-- Reset sequences for tables that use serial IDs
-- ALTER SEQUENCE IF EXISTS partycrew_posts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS partycrew_comments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS partycrew_notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS events_id_seq RESTART WITH 1;

-- ============================================================================
-- RECOMMENDED USAGE OPTIONS
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ OPTION 1: Force Re-Login Only (Recommended for Testing)                │
-- │ - Users keep their accounts and data                                    │
-- │ - Must log in again to access app                                       │
-- │ - Best for: Testing authentication flow                                 │
-- └─────────────────────────────────────────────────────────────────────────┘
-- Execute: SECTION 1 only (already uncommented above)


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ OPTION 2: Clear Social Data, Keep Accounts                             │
-- │ - Users keep their accounts                                             │
-- │ - All follows, posts, likes removed                                     │
-- │ - Must log in again                                                     │
-- │ - Best for: Testing social features from scratch                        │
-- └─────────────────────────────────────────────────────────────────────────┘
-- Execute: SECTION 1 + uncomment SECTION 2


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ OPTION 3: Complete Reset (Full Wipe)                                   │
-- │ - Everything deleted                                                    │
-- │ - No users, no data                                                     │
-- │ - Like fresh install                                                    │
-- │ - Best for: Major testing cycles, demo prep                             │
-- └─────────────────────────────────────────────────────────────────────────┘
-- Execute: All sections (uncomment SECTION 2, 3, 4)


-- ============================================================================
-- POST-CLEANUP TASKS
-- ============================================================================

-- After running this script:

-- 1. Clear client-side storage:
--    - Run: scripts/clear-client-storage.sh
--    - Or manually: Clear browser localStorage, cookies
--    - Mobile: Uninstall/reinstall Expo Go app

-- 2. Verify in Supabase Dashboard:
--    - Authentication > Users (should show users but no sessions)
--    - Or no users if you deleted accounts

-- 3. Test authentication:
--    - Try logging in from mobile app
--    - Try logging in from web app
--    - Verify you can create new account

-- 4. Re-create test users if needed:
--    - Run: scripts/create-test-users.sql (if you have one)
--    - Or manually sign up new test accounts

-- ============================================================================
-- ROLLBACK / UNDO
-- ============================================================================

-- ⚠️ IMPORTANT: Sessions and tokens CANNOT be restored once deleted!
-- Make sure you're okay with forcing all users to re-login.

-- If you accidentally deleted user accounts, you'll need to restore from backup.
-- Supabase offers Point-in-Time Recovery (PITR) for Pro plans.

-- ============================================================================
-- EXECUTION EXAMPLE
-- ============================================================================

-- STEP 1: Connect to Supabase SQL Editor
-- https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql/new

-- STEP 2: Copy this script

-- STEP 3: Review and uncomment sections you need

-- STEP 4: Run the script

-- STEP 5: Verify with SECTION 5 queries

-- STEP 6: Clear client-side storage (see below)

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'User session cleanup completed at %', NOW();
  RAISE NOTICE 'All active sessions have been terminated';
  RAISE NOTICE 'Users will need to re-authenticate on next access';
END $$;
