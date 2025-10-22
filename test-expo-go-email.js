/**
 * Quick test for Expo Go email sending
 * Run this to verify the production endpoint works
 */

const PRODUCTION_API = 'https://www.partyhause.com/api/send-email';

console.log('🧪 Testing Expo Go Email Configuration\n');
console.log('This simulates what happens when sending email from Expo Go...\n');

async function testExpoGoEmail() {
  const payload = {
    to: 'dara@partyhause.com',
    subject: '📱 Expo Go Test - Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #6C63FF;">🎉 Test from Expo Go</h1>
        <p>This email was sent to test the Expo Go integration.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <h3>Configuration Details:</h3>
          <ul>
            <li><strong>Endpoint:</strong> ${PRODUCTION_API}</li>
            <li><strong>Environment:</strong> Expo Go (Production API)</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>
        </div>
        <p>If you received this email, Expo Go can successfully send invitations! ✅</p>
        <p style="color: #666; font-size: 14px;">
          Expo Go always uses the production API because it cannot access localhost servers.
        </p>
      </div>
    `,
    metadata: {
      source: 'expo-go-test',
      testType: 'email-configuration',
    }
  };

  try {
    console.log('📤 Sending test email via production API...');
    console.log('   Endpoint:', PRODUCTION_API);
    console.log('   To:', payload.to);
    console.log('   Subject:', payload.subject);
    console.log('');

    const response = await fetch(PRODUCTION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ SUCCESS! Email sent from production endpoint');
      console.log('');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Expo Go Configuration: WORKING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('What this means:');
      console.log('  ✅ Production API endpoint is accessible');
      console.log('  ✅ MailerSend is configured correctly');
      console.log('  ✅ Expo Go can send invitation emails');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Build and deploy your mobile app to test on Expo Go');
      console.log('  2. Try adding a guest with "Send Email" enabled');
      console.log('  3. Check Metro logs for:');
      console.log('     [EmailService] Is Expo Go: true');
      console.log('     [EmailService] API URL: https://www.partyhause.com/api/send-email');
      console.log('');
      return true;
    } else {
      console.log('❌ FAILED! Email not sent');
      console.log('');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('Possible issues:');
      console.log('  - MailerSend API token invalid');
      console.log('  - Email address not verified');
      console.log('  - Network connectivity issue');
      console.log('');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common causes:');
    console.error('  - No internet connection');
    console.error('  - Vercel endpoint down (unlikely)');
    console.error('  - DNS resolution issue');
    console.error('');
    console.error('Try:');
    console.error('  1. Check internet connection');
    console.error('  2. curl https://www.partyhause.com/api/health');
    console.error('  3. Check Vercel dashboard');
    console.error('');
    return false;
  }
}

// Run the test
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Expo Go Email Configuration Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

testExpoGoEmail()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
