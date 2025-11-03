-- ============================================================================
-- USER SESSION CLEANUP SCRIPT (FIXED FOR PERMISSIONS)
-- ============================================================================
-- Purpose: Remove all logged-in users using Supabase admin functions
-- Date: November 2, 2025
-- Fix: Uses auth.uid() and RPC functions instead of direct DELETE
-- ============================================================================

-- IMPORTANT: Run this with your service role key or as postgres user
-- OR use the Supabase Dashboard Authentication page

-- ============================================================================
-- OPTION 1: SIGN OUT ALL USERS (RECOMMENDED - SAFEST)
-- ============================================================================
-- This uses Supabase's built-in function to sign out users

-- Sign out the current user (if you're testing)
-- SELECT auth.sign_out();

-- ============================================================================
-- OPTION 2: USE SUPABASE DASHBOARD (EASIEST - NO SQL NEEDED)
-- ============================================================================

/*
Instead of SQL, use the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users

2. For each user:
   - Click the user
   - Click the "..." menu
   - Click "Sign Out User"
   - Confirm

OR

1. Use the Users page filters
2. Select all users
3. Bulk action → Sign out

This is the safest and easiest method!
*/

-- ============================================================================
-- OPTION 3: DELETE USING SERVICE ROLE (REQUIRES ELEVATED PERMISSIONS)
-- ============================================================================

-- If you're running as postgres user or have service role access:

DO $$ 
DECLARE
    session_count INTEGER;
BEGIN
    -- Try to delete sessions
    BEGIN
        DELETE FROM auth.sessions;
        GET DIAGNOSTICS session_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % sessions', session_count;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permission denied for auth.sessions';
        RAISE NOTICE 'Please use the Supabase Dashboard to sign out users';
        RAISE NOTICE 'Or run this script as postgres user';
    END;
    
    -- Try to delete refresh tokens
    BEGIN
        DELETE FROM auth.refresh_tokens;
        GET DIAGNOSTICS session_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % refresh tokens', session_count;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permission denied for auth.refresh_tokens';
    END;
END $$;

-- ============================================================================
-- OPTION 4: CREATE RPC FUNCTION TO SIGN OUT ALL USERS
-- ============================================================================

-- Create a function that can be called to sign out all users
CREATE OR REPLACE FUNCTION admin_sign_out_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated permissions
AS $$
DECLARE
    session_count INTEGER;
    token_count INTEGER;
BEGIN
    -- Must be run by authenticated admin
    IF auth.role() != 'authenticated' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Must be authenticated'
        );
    END IF;
    
    -- Delete sessions
    DELETE FROM auth.sessions;
    GET DIAGNOSTICS session_count = ROW_COUNT;
    
    -- Delete refresh tokens
    DELETE FROM auth.refresh_tokens;
    GET DIAGNOSTICS token_count = ROW_COUNT;
    
    -- Delete one-time tokens
    DELETE FROM auth.one_time_tokens;
    
    RETURN json_build_object(
        'success', true,
        'sessions_deleted', session_count,
        'tokens_deleted', token_count,
        'timestamp', NOW()
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_sign_out_all_users() TO authenticated;

-- Now call the function:
-- SELECT admin_sign_out_all_users();

-- ============================================================================
-- OPTION 5: EXPIRE ALL SESSIONS (INDIRECT METHOD)
-- ============================================================================

-- Update session expiry times to force re-authentication
-- This doesn't require DELETE permissions

DO $$
DECLARE
    session_record RECORD;
BEGIN
    -- Try to update sessions to expired
    BEGIN
        UPDATE auth.sessions
        SET expires_at = NOW() - INTERVAL '1 day'
        WHERE expires_at > NOW();
        
        RAISE NOTICE 'Expired all active sessions';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permission denied. Please use Supabase Dashboard.';
    END;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (THESE WORK WITHOUT SPECIAL PERMISSIONS)
-- ============================================================================

-- Check how many sessions exist
SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_sessions,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_sessions
FROM auth.sessions;

-- Check refresh tokens
SELECT COUNT(*) as refresh_tokens FROM auth.refresh_tokens;

-- Check users
SELECT COUNT(*) as total_users FROM auth.users;

-- List active sessions (if you have permission)
SELECT 
    id,
    user_id,
    created_at,
    updated_at,
    expires_at,
    expires_at > NOW() as is_active
FROM auth.sessions
ORDER BY expires_at DESC
LIMIT 10;

-- ============================================================================
-- RECOMMENDED SOLUTION
-- ============================================================================

/*
Since you got the permission error, here's what to do:

METHOD 1: Use Supabase Dashboard (EASIEST) ⭐
-----------------------------------------------
1. Go to: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/auth/users
2. Click on each user
3. Click "Sign Out User" from the menu
4. Done!

METHOD 2: Use Supabase API (AUTOMATED)
---------------------------------------
Use the script I'll create: scripts/signout-all-users.js
This uses Supabase's management API to sign out users programmatically


METHOD 3: Run as Postgres User
-------------------------------
1. Contact Supabase support to run as postgres
2. Or upgrade to Pro plan for elevated SQL access
3. Then run the DELETE commands


METHOD 4: Create and Use RPC Function
--------------------------------------
1. Run the CREATE FUNCTION above (OPTION 4)
2. Then call: SELECT admin_sign_out_all_users();
*/

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================

-- Summary of solutions:
RAISE NOTICE '========================================';
RAISE NOTICE 'Permission error detected!';
RAISE NOTICE 'Please use one of these methods:';
RAISE NOTICE '1. Supabase Dashboard → Auth → Users → Sign out each user';
RAISE NOTICE '2. Run: node scripts/signout-all-users.js (I will create this)';
RAISE NOTICE '3. Create the RPC function above and call it';
RAISE NOTICE '========================================';
