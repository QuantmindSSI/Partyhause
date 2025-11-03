#!/usr/bin/env node

/**
 * Sign Out All Users - Automated Script
 * Uses Supabase Admin API to force logout all users
 * 
 * Usage: node scripts/signout-all-users.js
 * 
 * Prerequisites:
 * - SUPABASE_SERVICE_ROLE_KEY in .env file
 * - @supabase/supabase-js installed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  log.error('SUPABASE_URL not found in environment variables');
  log.info('Add it to your .env file:');
  log.info('SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  log.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  log.warn('This is required to sign out users programmatically');
  log.info('Get it from: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/settings/api');
  log.info('Add it to your .env file:');
  log.info('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get all users from Supabase Auth
 */
async function getAllUsers() {
  try {
    log.info('Fetching all users...');
    
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    log.success(`Found ${data.users.length} users`);
    return data.users;
  } catch (error) {
    log.error(`Failed to fetch users: ${error.message}`);
    throw error;
  }
}

/**
 * Sign out a specific user
 */
async function signOutUser(userId) {
  try {
    const { error } = await supabase.auth.admin.signOut(userId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to sign out user ${userId}: ${error.message}`);
    return false;
  }
}

/**
 * Sign out all users
 */
async function signOutAllUsers() {
  try {
    // Get all users
    const users = await getAllUsers();
    
    if (users.length === 0) {
      log.warn('No users found to sign out');
      return { success: 0, failed: 0 };
    }
    
    log.info(`Signing out ${users.length} users...`);
    console.log('');
    
    let successCount = 0;
    let failedCount = 0;
    
    // Sign out each user
    for (const user of users) {
      process.stdout.write(`  Signing out ${user.email || user.id}... `);
      
      const success = await signOutUser(user.id);
      
      if (success) {
        console.log(`${colors.green}✓${colors.reset}`);
        successCount++;
      } else {
        console.log(`${colors.red}✗${colors.reset}`);
        failedCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');
    return { success: successCount, failed: failedCount };
  } catch (error) {
    log.error(`Failed to sign out users: ${error.message}`);
    throw error;
  }
}

/**
 * Verify cleanup - check for active sessions
 */
async function verifyCleanup() {
  try {
    log.info('Verifying cleanup...');
    
    // Query sessions table (requires proper permissions)
    const { data, error } = await supabase
      .from('auth.sessions')
      .select('id', { count: 'exact' })
      .limit(0);
    
    if (error) {
      log.warn('Could not verify sessions (permission issue)');
      log.info('Check manually in Supabase Dashboard');
      return null;
    }
    
    return data;
  } catch (error) {
    log.warn('Verification skipped (normal for Supabase free tier)');
    return null;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('');
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   PartyHause - Sign Out All Users         ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  
  log.info(`Supabase URL: ${SUPABASE_URL}`);
  log.info(`Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
  console.log('');
  
  try {
    // Confirm action
    log.warn('This will sign out ALL users immediately!');
    log.info('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Sign out all users
    const result = await signOutAllUsers();
    
    // Display results
    console.log('');
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    log.success(`Successfully signed out: ${result.success} users`);
    
    if (result.failed > 0) {
      log.error(`Failed to sign out: ${result.failed} users`);
    }
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log('');
    
    // Verify
    await verifyCleanup();
    
    // Next steps
    console.log('');
    log.info('Next steps:');
    console.log('  1. Clear client-side storage: ./scripts/clear-client-storage.sh');
    console.log('  2. Clear browser DevTools → Application → Storage');
    console.log('  3. Restart Expo: npx expo start --clear --tunnel');
    console.log('  4. Test login flow');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.log('');
    log.error(`Script failed: ${error.message}`);
    console.log('');
    log.info('Alternative methods:');
    console.log('  1. Use Supabase Dashboard → Auth → Users → Sign out manually');
    console.log('  2. Check that SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('  3. Verify your Supabase project permissions');
    console.log('');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { signOutAllUsers, getAllUsers };
