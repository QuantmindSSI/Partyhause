/**
 * PartyHause Invitation Flow Test
 * ================================
 * Tests the complete invitation sending workflow:
 * 1. User authentication
 * 2. Event creation (or use existing)
 * 3. Guest addition
 * 4. Invitation email sending
 * 5. Email tracking verification
 * 6. Database log verification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN;
const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL;
const API_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test configuration
const TEST_CONFIG = {
  // Use your actual test user credentials
  testUser: {
    email: 'dara@partyhause.com', // Your admin email
    password: 'your_password_here' // You'll need to provide this
  },
  // Guest to invite (will send to admin email due to trial limitation)
  testGuest: {
    name: 'John Doe',
    email: 'dara@partyhause.com', // Trial limitation: must be admin email
  },
  // Test event (will create or use existing)
  testEvent: {
    name: 'Invitation Test Event',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    location: 'Test Venue, 123 Test St',
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`),
  data: (label, data) => console.log(`${colors.magenta}→${colors.reset} ${label}:`, JSON.stringify(data, null, 2)),
};

/**
 * Step 1: Authenticate User
 */
async function authenticateUser() {
  log.section('Step 1: User Authentication');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password,
    });

    if (error) throw error;

    log.success(`Authenticated as: ${data.user.email}`);
    log.data('User ID', data.user.id);
    return data.user;
  } catch (error) {
    log.error(`Authentication failed: ${error.message}`);
    log.warning('Please update TEST_CONFIG.testUser with your actual credentials');
    throw error;
  }
}

/**
 * Step 2: Create or Get Test Event
 */
async function getOrCreateEvent(userId) {
  log.section('Step 2: Event Setup');

  try {
    // Check for existing test event
    const { data: existingEvents } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', userId)
      .eq('name', TEST_CONFIG.testEvent.name)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      log.info('Using existing test event');
      log.data('Event', {
        id: existingEvents[0].id,
        name: existingEvents[0].name,
        date: existingEvents[0].date,
      });
      return existingEvents[0];
    }

    // Create new event
    log.info('Creating new test event...');
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        host_id: userId,
        name: TEST_CONFIG.testEvent.name,
        date: TEST_CONFIG.testEvent.date,
        location: TEST_CONFIG.testEvent.location,
        description: 'Test event for invitation flow testing',
        is_public: false,
      })
      .select()
      .single();

    if (error) throw error;

    log.success('Event created successfully');
    log.data('Event', {
      id: newEvent.id,
      name: newEvent.name,
      date: newEvent.date,
    });
    return newEvent;
  } catch (error) {
    log.error(`Event setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Step 3: Add Guest to Event
 */
async function addGuest(eventId) {
  log.section('Step 3: Add Guest');

  try {
    // Check for existing guest
    const { data: existingGuests } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', TEST_CONFIG.testGuest.email)
      .limit(1);

    let guest;
    
    if (existingGuests && existingGuests.length > 0) {
      log.warning('Guest already exists, using existing guest');
      guest = existingGuests[0];
      
      // Update email_sent_at to null to test sending again
      const { data: updated } = await supabase
        .from('guests')
        .update({ email_sent_at: null })
        .eq('id', guest.id)
        .select()
        .single();
      
      guest = updated;
    } else {
      log.info('Adding new guest...');
      const { data: newGuest, error } = await supabase
        .from('guests')
        .insert({
          event_id: eventId,
          name: TEST_CONFIG.testGuest.name,
          email: TEST_CONFIG.testGuest.email,
          is_checked_in: false,
        })
        .select()
        .single();

      if (error) throw error;
      guest = newGuest;
    }

    log.success('Guest ready');
    log.data('Guest', {
      id: guest.id,
      name: guest.name,
      email: guest.email,
    });
    return guest;
  } catch (error) {
    log.error(`Guest addition failed: ${error.message}`);
    throw error;
  }
}

/**
 * Step 4: Generate Invitation URL
 */
function generateInvitationUrl(eventId, guestId) {
  return `${API_URL}/event/${eventId}/guest/${guestId}`;
}

/**
 * Step 5: Send Invitation Email
 */
async function sendInvitationEmail(event, guest) {
  log.section('Step 4: Send Invitation Email');

  const invitationUrl = generateInvitationUrl(event.id, guest.id);
  log.info(`Invitation URL: ${invitationUrl}`);

  try {
    // Create email log entry
    log.info('Creating email log entry...');
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        event_id: event.id,
        guest_id: guest.id,
        email_type: 'invitation',
        recipient_email: guest.email,
        subject: `🎉 You're Invited to ${event.name}!`,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) throw logError;

    log.success(`Email log created: ${emailLog.id}`);

    // Build email HTML
    const emailHtml = buildInvitationEmail(guest.name, event, invitationUrl);

    // Send email via API
    log.info('Sending email via API...');
    const apiEndpoint = `${API_URL}/api/email`;
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: guest.email,
        subject: `🎉 You're Invited to ${event.name}!`,
        html: emailHtml,
        metadata: {
          emailLogId: emailLog.id,
          guestId: guest.id,
          eventId: event.id,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Email API request failed');
    }

    const result = await response.json();
    log.success('Email sent successfully!');
    log.data('MailerSend Response', result);

    // Update email log with success
    const messageId = result.data?.id || null;
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        resend_email_id: messageId,
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailLog.id);

    // Update guest record
    await supabase
      .from('guests')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', guest.id);

    log.success('Database records updated');

    return {
      emailLogId: emailLog.id,
      messageId,
      invitationUrl,
    };
  } catch (error) {
    log.error(`Email sending failed: ${error.message}`);
    
    // Update email log with failure
    await supabase
      .from('email_logs')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('event_id', event.id)
      .eq('guest_id', guest.id)
      .eq('status', 'pending');

    throw error;
  }
}

/**
 * Step 6: Verify Email Logs
 */
async function verifyEmailLogs(emailLogId) {
  log.section('Step 5: Verify Email Tracking');

  try {
    const { data: emailLog, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .single();

    if (error) throw error;

    log.success('Email log retrieved');
    log.data('Email Log', {
      id: emailLog.id,
      status: emailLog.status,
      sent_at: emailLog.sent_at,
      message_id: emailLog.resend_email_id,
      recipient: emailLog.recipient_email,
      subject: emailLog.subject,
    });

    return emailLog;
  } catch (error) {
    log.error(`Email log verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Build Invitation Email HTML
 */
function buildInvitationEmail(guestName, event, rsvpUrl) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

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
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
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
    
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      
      .container {
        border-radius: 10px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 26px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .event-card {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="party-icon">🎉</div>
      <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hi <strong>${guestName}</strong>,
      </div>
      
      <p>You've been invited to an amazing event! We'd love for you to join us for an unforgettable experience.</p>
      
      <div class="event-card">
        <div class="event-title">${event.name}</div>
        <div class="event-details">
          <div class="detail-item">
            📅 <strong>${formattedDate}</strong>
          </div>
          <div class="detail-item">
            🕐 <strong>${formattedTime}</strong>
          </div>
          <div class="detail-item">
            📍 <strong>${event.location}</strong>
          </div>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${rsvpUrl}" class="cta-button">✨ RSVP Now ✨</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Click the button above to confirm your attendance and get all the event details. 
        We can't wait to see you there!
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-logo">PartyHause 🎊</div>
      <p>Making events memorable, one invitation at a time.</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        This invitation was sent to ${event.location}. If you have any questions, 
        please contact the event host.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main Test Runner
 */
async function runInvitationTest() {
  console.log(`
${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════╗
║   PartyHause Invitation Flow Test Suite         ║
║   Testing: User → Event → Guest → Email         ║
╚══════════════════════════════════════════════════╝
${colors.reset}
`);

  log.warning('⚠️  IMPORTANT: Trial account can only send to dara@partyhause.com');
  log.warning('⚠️  Make sure to update TEST_CONFIG.testUser.password before running\n');

  const results = {
    authentication: false,
    event: false,
    guest: false,
    email: false,
    tracking: false,
  };

  try {
    // Step 1: Authenticate
    const user = await authenticateUser();
    results.authentication = true;

    // Step 2: Get or create event
    const event = await getOrCreateEvent(user.id);
    results.event = true;

    // Step 3: Add guest
    const guest = await addGuest(event.id);
    results.guest = true;

    // Step 4: Send invitation
    const { emailLogId, messageId, invitationUrl } = await sendInvitationEmail(event, guest);
    results.email = true;

    // Step 5: Verify tracking
    await verifyEmailLogs(emailLogId);
    results.tracking = true;

    // Success summary
    log.section('✨ Test Results ✨');
    log.success('All tests passed!');
    console.log(`
${colors.green}Test Summary:${colors.reset}
  ✓ User Authentication: ${results.authentication ? 'PASSED' : 'FAILED'}
  ✓ Event Setup: ${results.event ? 'PASSED' : 'FAILED'}
  ✓ Guest Addition: ${results.guest ? 'PASSED' : 'FAILED'}
  ✓ Email Sending: ${results.email ? 'PASSED' : 'FAILED'}
  ✓ Email Tracking: ${results.tracking ? 'PASSED' : 'FAILED'}

${colors.cyan}Next Steps:${colors.reset}
  1. Check your inbox at ${MAILERSEND_FROM_EMAIL}
  2. Open the invitation URL: ${invitationUrl}
  3. View email log in Supabase dashboard
  4. Check MailerSend dashboard for delivery status

${colors.yellow}MailerSend Message ID:${colors.reset} ${messageId}
    `);

  } catch (error) {
    log.section('❌ Test Failed');
    log.error(error.message);
    console.log(`
${colors.red}Test Summary:${colors.reset}
  ${results.authentication ? '✓' : '✗'} User Authentication: ${results.authentication ? 'PASSED' : 'FAILED'}
  ${results.event ? '✓' : '✗'} Event Setup: ${results.event ? 'PASSED' : 'FAILED'}
  ${results.guest ? '✓' : '✗'} Guest Addition: ${results.guest ? 'PASSED' : 'FAILED'}
  ${results.email ? '✓' : '✗'} Email Sending: ${results.email ? 'PASSED' : 'FAILED'}
  ${results.tracking ? '✓' : '✗'} Email Tracking: ${results.tracking ? 'PASSED' : 'FAILED'}
    `);
    process.exit(1);
  }
}

// Run the test
runInvitationTest().catch(console.error);
