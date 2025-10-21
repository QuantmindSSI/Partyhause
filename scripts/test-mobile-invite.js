/**
 * Mobile Invitation Testing Script
 * Tests the complete mobile invite flow including:
 * - Network connectivity
 * - Email server accessibility
 * - Database operations (guest creation, email logging)
 * - Email delivery via MailerSend
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_SERVER_URLS = {
  localhost: 'http://localhost:3001/api/send-email',
  ethernet: 'http://192.168.56.1:3001/api/send-email', // iOS/Android physical
  wifi: 'http://172.20.10.8:3001/api/send-email', // Physical devices on WiFi
  androidEmulator: 'http://10.0.2.2:3001/api/send-email',
};

// Test configuration
const TEST_EVENT = {
  name: 'Mobile Test Event 🎉',
  event_date: '2025-11-15T19:00:00Z',
  start_date: '2025-11-15T19:00:00Z',
  end_date: '2025-11-15T23:00:00Z',
  location: 'The Grand Ballroom, Downtown',
};

const TEST_GUEST = {
  name: 'Mobile Test User',
  email: 'thecommodore30@gmail.com',
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

function warn(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Test network connectivity to email server
 */
async function testNetworkConnectivity() {
  section('STEP 1: Network Connectivity Test');
  
  const results = [];
  
  for (const [name, url] of Object.entries(EMAIL_SERVER_URLS)) {
    try {
      info(`Testing ${name}: ${url}`);
      const response = await fetch(url.replace('/api/send-email', '/api/health'), {
        method: 'GET',
        timeout: 3000,
      });
      
      if (response.ok) {
        success(`${name} is accessible`);
        results.push({ name, url, accessible: true });
      } else {
        warn(`${name} returned status ${response.status}`);
        results.push({ name, url, accessible: false });
      }
    } catch (err) {
      error(`${name} is not accessible: ${err.message}`);
      results.push({ name, url, accessible: false });
    }
  }
  
  const accessibleCount = results.filter(r => r.accessible).length;
  
  if (accessibleCount === 0) {
    throw new Error('No email server URLs are accessible! Make sure the server is running on port 3001');
  }
  
  success(`\n${accessibleCount}/${results.length} endpoints accessible`);
  
  // Return the first accessible URL for testing
  const accessibleUrl = results.find(r => r.accessible)?.url;
  return accessibleUrl;
}

/**
 * Create a test event
 */
async function createTestEvent() {
  section('STEP 2: Create Test Event');
  
  info('Getting or creating test user...');
  
  // Try to get an existing user from the database
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  let hostId;
  
  if (existingUsers && existingUsers.length > 0) {
    hostId = existingUsers[0].id;
    success(`Using existing user: ${hostId}`);
  } else {
    // Create a test user in auth.users if needed
    warn('No existing users found, creating test user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-mobile@partyhause.com',
      password: 'TestPassword123!',
    });
    
    if (authError) {
      error(`Failed to create test user: ${authError.message}`);
      throw authError;
    }
    
    hostId = authData.user.id;
    success(`Created test user: ${hostId}`);
  }
  
  info('Creating test event in database...');
  
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      host_id: hostId,
      name: TEST_EVENT.name,
      location: TEST_EVENT.location,
      event_date: TEST_EVENT.event_date,
      start_date: TEST_EVENT.start_date,
      end_date: TEST_EVENT.end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (eventError) {
    error(`Failed to create event: ${eventError.message}`);
    throw eventError;
  }
  
  success(`Event created with ID: ${event.id}`);
  info(`Event name: ${event.name}`);
  info(`Event location: ${event.location}`);
  info(`Event dates: ${event.start_date} to ${event.end_date}`);
  
  return event;
}

/**
 * Add a guest to the event
 */
async function addGuest(eventId) {
  section('STEP 3: Add Guest to Event');
  
  info(`Adding guest: ${TEST_GUEST.name} (${TEST_GUEST.email})`);
  
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      event_id: eventId,
      name: TEST_GUEST.name,
      email: TEST_GUEST.email,
      is_checked_in: false,
    })
    .select()
    .single();
  
  if (guestError) {
    error(`Failed to add guest: ${guestError.message}`);
    throw guestError;
  }
  
  success(`Guest added with ID: ${guest.id}`);
  
  return guest;
}

/**
 * Create email log entry
 */
async function createEmailLog(eventId, guestId) {
  section('STEP 4: Create Email Log Entry');
  
  info('Creating email log in database...');
  
  const subject = `🎉 You're Invited to ${TEST_EVENT.name}!`;
  
  const { data: emailLog, error: logError } = await supabase
    .from('email_logs')
    .insert({
      event_id: eventId,
      guest_id: guestId,
      email_type: 'invitation',
      recipient_email: TEST_GUEST.email,
      subject: subject,
      status: 'pending',
    })
    .select()
    .single();
  
  if (logError) {
    error(`Failed to create email log: ${logError.message}`);
    throw logError;
  }
  
  success(`Email log created with ID: ${emailLog.id}`);
  
  return emailLog;
}

/**
 * Generate invitation URL
 */
function generateInvitationUrl(eventId, guestId) {
  return `http://localhost:5173/event/${eventId}/guest/${guestId}`;
}

/**
 * Build invitation email HTML
 */
function buildInvitationEmail(guestName, eventDetails, rsvpUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .party-icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    
    .event-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
      border-left: 5px solid #667eea;
    }
    
    .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      color: #555;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 18px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .test-badge {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="party-icon">🎉</div>
      <h1>You're Invited!</h1>
      <div class="test-badge">📱 MOBILE TEST</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hi <strong>${guestName}</strong>,
      </div>
      
      <p>You've been invited to an amazing event! We'd love for you to join us for an unforgettable experience.</p>
      
      <div class="event-card">
        <div class="event-title">${eventDetails.name}</div>
        <div class="event-details">
          <div class="detail-item">
            📅 <strong>${eventDetails.date}</strong>
          </div>
          <div class="detail-item">
            📍 <strong>${eventDetails.location}</strong>
          </div>
          ${eventDetails.description ? `
          <div class="detail-item" style="margin-top: 12px;">
            ${eventDetails.description}
          </div>
          ` : ''}
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${rsvpUrl}" class="cta-button">✨ RSVP Now ✨</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Click the button above to confirm your attendance and get all the event details. 
        We can't wait to see you there!
      </p>
      
      <p style="background: #fef3c7; padding: 15px; border-radius: 10px; font-size: 13px; color: #92400e;">
        <strong>🧪 Test Email:</strong> This is a test of the mobile invitation system. 
        It verifies that the mobile app can successfully send beautiful invitation emails via the email server.
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-logo">PartyHause 🎊</div>
      <p>Making events memorable, one invitation at a time.</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        Sent from PartyHause Mobile App (Test Script)
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send invitation email
 */
async function sendInvitationEmail(emailServerUrl, event, guest, emailLogId) {
  section('STEP 5: Send Invitation Email');
  
  const invitationUrl = generateInvitationUrl(event.id, guest.id);
  const html = buildInvitationEmail(
    guest.name,
    {
      name: event.name,
      date: new Date(event.start_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      location: event.location,
      description: 'Join us for an amazing mobile-tested event!',
    },
    invitationUrl
  );
  
  info(`Sending email via: ${emailServerUrl}`);
  info(`To: ${guest.email}`);
  info(`Subject: 🎉 You're Invited to ${event.name}!`);
  
  try {
    const response = await fetch(emailServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: guest.email,
        subject: `🎉 You're Invited to ${event.name}!`,
        html: html,
        metadata: {
          emailLogId: emailLogId,
          guestId: guest.id,
          eventId: event.id,
        },
      }),
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      error(`Invalid JSON response: ${text}`);
      throw new Error('Invalid API response');
    }
    
    if (!response.ok) {
      error(`Email API error (${response.status}): ${JSON.stringify(data)}`);
      throw new Error(data.error || 'Email sending failed');
    }
    
    success('Email sent successfully!');
    
    if (data.data?.id) {
      info(`MailerSend Message ID: ${data.data.id}`);
    }
    
    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (err) {
    error(`Failed to send email: ${err.message}`);
    throw err;
  }
}

/**
 * Update email log with sent status
 */
async function updateEmailLog(emailLogId, messageId) {
  section('STEP 6: Update Email Log Status');
  
  info('Updating email log with sent status...');
  
  const { data, error: updateError } = await supabase
    .from('email_logs')
    .update({
      status: 'sent',
      resend_email_id: messageId,
      sent_at: new Date().toISOString(),
    })
    .eq('id', emailLogId)
    .select()
    .single();
  
  if (updateError) {
    error(`Failed to update email log: ${updateError.message}`);
    throw updateError;
  }
  
  success('Email log updated successfully');
  info(`Status: ${data.status}`);
  info(`Sent at: ${data.sent_at}`);
  
  return data;
}

/**
 * Update guest with email_sent_at timestamp (if column exists)
 */
async function updateGuestEmailStatus(guestId) {
  section('STEP 7: Update Guest Email Status');
  
  info('Checking if email_sent_at column exists...');
  
  try {
    const { data, error: updateError } = await supabase
      .from('guests')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', guestId)
      .select()
      .single();
    
    if (updateError) {
      if (updateError.message.includes('email_sent_at')) {
        warn('email_sent_at column does not exist on guests table (optional feature)');
        info('Skipping guest email status update');
        return null;
      }
      error(`Failed to update guest: ${updateError.message}`);
      throw updateError;
    }
    
    success('Guest record updated successfully');
    info(`Email sent at: ${data.email_sent_at}`);
    
    return data;
  } catch (err) {
    warn('Could not update guest email status (non-critical)');
    return null;
  }
}

/**
 * Verify email in MailerSend dashboard
 */
function verifyInMailerSend() {
  section('STEP 8: Verify Email Delivery');
  
  info('Check MailerSend dashboard for email delivery:');
  console.log('\n  📊 MailerSend Dashboard:');
  console.log('  https://app.mailersend.com/activity\n');
  
  success('Email should appear in the activity log shortly');
  info('Check your inbox at: thecommodore30@gmail.com');
}

/**
 * Clean up test data
 */
async function cleanup(eventId, guestId, emailLogId) {
  section('CLEANUP: Removing Test Data');
  
  info('Cleaning up test data from database...');
  
  // Delete email log
  if (emailLogId) {
    const { error: logError } = await supabase
      .from('email_logs')
      .delete()
      .eq('id', emailLogId);
    
    if (logError) {
      warn(`Failed to delete email log: ${logError.message}`);
    } else {
      success('Email log deleted');
    }
  }
  
  // Delete guest
  if (guestId) {
    const { error: guestError } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId);
    
    if (guestError) {
      warn(`Failed to delete guest: ${guestError.message}`);
    } else {
      success('Guest deleted');
    }
  }
  
  // Delete event
  if (eventId) {
    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (eventError) {
      warn(`Failed to delete event: ${eventError.message}`);
    } else {
      success('Event deleted');
    }
  }
  
  success('Cleanup completed');
}

/**
 * Main test execution
 */
async function main() {
  console.clear();
  log('\n╔════════════════════════════════════════════════════════════╗', colors.bright + colors.magenta);
  log('║       📱 MOBILE INVITATION SYSTEM TEST SCRIPT 📱          ║', colors.bright + colors.magenta);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.bright + colors.magenta);
  
  info('This script simulates the mobile app invite flow:');
  info('  1. Network connectivity check');
  info('  2. Create test event');
  info('  3. Add guest');
  info('  4. Create email log');
  info('  5. Send invitation email');
  info('  6. Update email log status');
  info('  7. Update guest email status');
  info('  8. Verify in MailerSend\n');
  
  let eventId, guestId, emailLogId;
  
  try {
    // Step 1: Test network connectivity
    const emailServerUrl = await testNetworkConnectivity();
    
    // Step 2: Create test event
    const event = await createTestEvent();
    eventId = event.id;
    
    // Step 3: Add guest
    const guest = await addGuest(eventId);
    guestId = guest.id;
    
    // Step 4: Create email log
    const emailLog = await createEmailLog(eventId, guestId);
    emailLogId = emailLog.id;
    
    // Step 5: Send invitation email
    const emailResult = await sendInvitationEmail(emailServerUrl, event, guest, emailLogId);
    
    // Step 6: Update email log
    await updateEmailLog(emailLogId, emailResult.messageId);
    
    // Step 7: Update guest email status
    await updateGuestEmailStatus(guestId);
    
    // Step 8: Verify in MailerSend
    verifyInMailerSend();
    
    // Final summary
    section('TEST SUMMARY');
    success('✓ All tests passed successfully!');
    console.log('\n  Test Results:');
    success(`  Event ID: ${eventId}`);
    success(`  Guest ID: ${guestId}`);
    success(`  Email Log ID: ${emailLogId}`);
    success(`  Message ID: ${emailResult.messageId || 'N/A'}`);
    success(`  Recipient: ${TEST_GUEST.email}`);
    
    // Cleanup
    await cleanup(eventId, guestId, emailLogId);
    
    log('\n╔════════════════════════════════════════════════════════════╗', colors.bright + colors.green);
    log('║                  🎉 TEST COMPLETED! 🎉                     ║', colors.bright + colors.green);
    log('╚════════════════════════════════════════════════════════════╝\n', colors.bright + colors.green);
    
    info('Mobile invite system is working correctly! ✓');
    info('Check your email inbox to see the invitation.');
    
  } catch (err) {
    log('\n╔════════════════════════════════════════════════════════════╗', colors.bright + colors.red);
    log('║                    ❌ TEST FAILED ❌                       ║', colors.bright + colors.red);
    log('╚════════════════════════════════════════════════════════════╝\n', colors.bright + colors.red);
    
    error(`Error: ${err.message}`);
    
    if (err.stack) {
      console.log('\nStack trace:');
      console.log(err.stack);
    }
    
    // Attempt cleanup
    if (eventId || guestId || emailLogId) {
      await cleanup(eventId, guestId, emailLogId);
    }
    
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
