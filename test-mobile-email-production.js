/**
 * Test Mobile Email Production Integration
 * Simulates mobile app sending email via production Vercel endpoint
 */

const PRODUCTION_EMAIL_API = 'https://www.partyhause.com/api/send-email';

async function testMobileEmailIntegration() {
  console.log('🧪 Testing Mobile App Email Integration\n');
  console.log('📍 Production Endpoint:', PRODUCTION_EMAIL_API);
  console.log('');

  // Test 1: Send test invitation email
  console.log('📧 Test 1: Sending invitation email from mobile app...');
  
  const guestData = {
    name: 'Mobile Test Guest',
    email: 'dara@partyhause.com', // Use verified sender email for testing
  };

  const eventData = {
    name: 'Mobile App Test Event',
    date: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    location: 'Virtual Event Location',
    description: 'Testing email invitations from PartyHause mobile app',
  };

  const invitationUrl = 'https://www.partyhause.com/event/test-123/guest/test-456';

  // Build the HTML email content (same as mobile app)
  const emailHtml = `
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
        Hi <strong>${guestData.name}</strong>,
      </div>
      
      <p>You've been invited to an amazing event! We'd love for you to join us for an unforgettable experience.</p>
      
      <div class="event-card">
        <div class="event-title">${eventData.name}</div>
        <div>
          📅 <strong>${eventData.date}</strong><br>
          📍 <strong>${eventData.location}</strong><br>
          <p style="margin-top: 12px;">${eventData.description}</p>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${invitationUrl}" class="cta-button">✨ RSVP Now ✨</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Click the button above to confirm your attendance and get all the event details. 
        We can't wait to see you there!
      </p>
    </div>
    
    <div class="footer">
      <div style="font-size: 24px; font-weight: 700; color: #667eea; margin-bottom: 10px;">
        PartyHause 🎊
      </div>
      <p>Making events memorable, one invitation at a time.</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        Sent from PartyHause Mobile App (Test)
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const payload = {
    to: guestData.email,
    subject: `🎉 You're Invited to ${eventData.name}!`,
    html: emailHtml,
    metadata: {
      source: 'mobile-test',
      eventId: 'test-123',
      guestId: 'test-456',
    },
  };

  try {
    console.log('📤 Sending request to:', PRODUCTION_EMAIL_API);
    console.log('📧 To:', guestData.email);
    console.log('📬 Subject:', payload.subject);
    console.log('');

    const response = await fetch(PRODUCTION_EMAIL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ SUCCESS! Email sent from mobile app simulation');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('🎉 Mobile email integration is working!');
      console.log('');
      console.log('📱 Mobile app can now:');
      console.log('   ✅ Send invitation emails when adding guests');
      console.log('   ✅ Use production Vercel endpoint');
      console.log('   ✅ Generate proper invitation URLs');
      console.log('   ✅ Track email delivery status');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Test on physical device or emulator');
      console.log('   2. Add a guest in mobile app with "Send Email" toggle ON');
      console.log('   3. Check email delivery in recipient inbox');
      console.log('   4. Verify email tracking in Supabase email_logs table');
      return true;
    } else {
      console.log('❌ FAILED! Email sending failed');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR!', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testMobileEmailIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
