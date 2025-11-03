-- ============================================================================
-- SIMPLE USER SESSION CLEANUP (FOR SUPABASE CLI)
-- ============================================================================
-- Purpose: Clear all user sessions - works with supabase db execute
-- Date: November 2, 2025
-- ============================================================================

-- This script signs out all users by deleting their sessions and tokens

BEGIN;

-- Clear all active sessions
TRUNCATE auth.sessions CASCADE;

-- Clear all refresh tokens
TRUNCATE auth.refresh_tokens CASCADE;

-- Clear one-time tokens
TRUNCATE auth.one_time_tokens CASCADE;

-- Clear MFA factors (if any)
TRUNCATE auth.mfa_factors CASCADE;

COMMIT;

-- Show results
SELECT 
    (SELECT COUNT(*) FROM auth.sessions) as active_sessions,
    (SELECT COUNT(*) FROM auth.refresh_tokens) as refresh_tokens,
    (SELECT COUNT(*) FROM auth.users) as total_users;
