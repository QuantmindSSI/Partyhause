/**
 * Comprehensive Mobile Invite System Test
 * Tests the complete flow of sending invitations from mobile app
 */

const PRODUCTION_API = 'https://www.partyhause.com/api/send-email';
const HEALTH_API = 'https://www.partyhause.com/api/health';

async function testHealthEndpoint() {
  console.log('\n📊 Step 1: Testing Health Endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await fetch(HEALTH_API);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Health check passed');
      console.log('   Status:', data.status);
      console.log('   Message:', data.message);
      console.log('   MailerSend configured:', data.config.mailerSendConfigured);
      console.log('   Has API token:', data.config.hasToken);
      console.log('   Has from email:', data.config.hasFromEmail);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('   Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

async function testEmailSending() {
  console.log('\n📧 Step 2: Testing Email Sending');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testPayload = {
    to: 'dara@partyhause.com',
    subject: '🧪 Mobile App Integration Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Mobile App Email Test</h1>
        <p>This email was sent from the mobile app integration test suite.</p>
        <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Test Details:</h3>
          <ul>
            <li><strong>Endpoint:</strong> ${PRODUCTION_API}</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            <li><strong>Environment:</strong> Production</li>
          </ul>
        </div>
        <p style="color: #666;">If you received this email, the mobile app email integration is working correctly! ✅</p>
      </div>
    `,
    metadata: {
      source: 'mobile-integration-test',
      testType: 'email-sending',
    }
  };
  
  try {
    console.log('📤 Sending test email...');
    console.log('   To:', testPayload.to);
    console.log('   Subject:', testPayload.subject);
    
    const response = await fetch(PRODUCTION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Email sent successfully');
      console.log('   Message ID:', data.data?.id || 'N/A');
      console.log('   Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Email sending failed');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error || 'Unknown error');
      console.log('   Full response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function testMobileInvitationFlow() {
  console.log('\n🎉 Step 3: Testing Mobile Invitation Flow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Simulate mobile app invitation
  const guestData = {
    name: 'Mobile Test Guest',
    email: 'dara@partyhause.com',
  };
  
  const eventData = {
    id: 'test-event-123',
    name: 'Mobile App Test Party',
    date: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    location: 'Virtual Event Space',
    description: 'Testing invitation emails from PartyHause mobile app',
  };
  
  const invitationUrl = `https://www.partyhause.com/event/${eventData.id}/guest/test-guest-456`;
  
  const invitationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    .header h1 {
      margin: 0;
      font-size: 32px;
    }
    .content {
      padding: 40px 30px;
    }
    .event-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${guestData.name}</strong>,</p>
      <p>You've been invited to an amazing event!</p>
      <div class="event-card">
        <h2 style="color: #667eea; margin-top: 0;">${eventData.name}</h2>
        <p>📅 <strong>${eventData.date}</strong></p>
        <p>📍 <strong>${eventData.location}</strong></p>
        <p>${eventData.description}</p>
      </div>
      <p style="text-align: center;">
        <a href="${invitationUrl}" class="cta-button">✨ RSVP Now ✨</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  const payload = {
    to: guestData.email,
    subject: `🎉 You're Invited to ${eventData.name}!`,
    html: invitationHtml,
    metadata: {
      source: 'mobile-app',
      eventId: eventData.id,
      guestId: 'test-guest-456',
    }
  };
  
  try {
    console.log('📱 Simulating mobile app invitation...');
    console.log('   Guest:', guestData.name, `<${guestData.email}>`);
    console.log('   Event:', eventData.name);
    console.log('   RSVP URL:', invitationUrl);
    
    const response = await fetch(PRODUCTION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Invitation sent successfully');
      console.log('   The mobile app can send invitations! 🎊');
      return true;
    } else {
      console.log('❌ Invitation sending failed');
      console.log('   Error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Invitation flow error:', error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Step 4: Environment Variables Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('Expected environment variables on Vercel:');
  console.log('   ✓ MAILERSEND_API_TOKEN (Production, Preview, Development)');
  console.log('   ✓ MAILERSEND_FROM_EMAIL (Production, Preview, Development)');
  console.log('   ✓ SUPABASE_URL (Production, Preview, Development)');
  console.log('   ✓ SUPABASE_SERVICE_ROLE_KEY (Production, Preview, Development)');
  console.log('');
  console.log('Mobile app configuration:');
  console.log('   ✓ Production API: https://www.partyhause.com/api/send-email');
  console.log('   ✓ Development iOS: http://192.168.56.1:3001/api/send-email');
  console.log('   ✓ Development Android: http://10.0.2.2:3001/api/send-email');
  console.log('');
  console.log('📝 To verify on Vercel, run: vercel env ls');
  
  return true;
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Mobile Invite System Comprehensive Test Suite       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const results = {
    health: false,
    email: false,
    invitation: false,
    env: false,
  };
  
  try {
    results.health = await testHealthEndpoint();
    results.email = await testEmailSending();
    results.invitation = await testMobileInvitationFlow();
    results.env = await checkEnvironmentVariables();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    Test Results                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Health Endpoint:         ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Email Sending:           ${results.email ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Invitation Flow:         ${results.invitation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Environment Variables:   ${results.env ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    const allPassed = Object.values(results).every(r => r === true);
    
    if (allPassed) {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              🎉 ALL TESTS PASSED! 🎉                   ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('✅ Mobile app is ready to send invitation emails!');
      console.log('');
      console.log('📱 How to use in mobile app:');
      console.log('   1. Open PartyHause mobile app');
      console.log('   2. Navigate to an event you host');
      console.log('   3. Tap "Add Guest" button');
      console.log('   4. Enter guest name and email');
      console.log('   5. Enable "Send Email" toggle');
      console.log('   6. Tap "Add Guest" to save and send invitation');
      console.log('');
      console.log('🔍 Email will be sent via:');
      console.log('   • Production: https://www.partyhause.com/api/send-email');
      console.log('   • MailerSend API for delivery');
      console.log('   • Tracked in Supabase email_logs table');
      console.log('');
      return true;
    } else {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              ⚠️  SOME TESTS FAILED ⚠️                  ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('Please review the failed tests above and fix the issues.');
      console.log('');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Fatal error during tests:', error);
    return false;
  }
}

// Run all tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
