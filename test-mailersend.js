/**
 * Quick MailerSend API Test
 * Tests if your MailerSend credentials work
 */

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import dotenv from 'dotenv';

dotenv.config();

const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN;
const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL;

console.log('\n🧪 Testing MailerSend Configuration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check environment variables
console.log('✓ Checking environment variables...');
console.log(`  API Token: ${MAILERSEND_API_TOKEN ? '✅ Set (' + MAILERSEND_API_TOKEN.substring(0, 15) + '...)' : '❌ Missing'}`);
console.log(`  From Email: ${MAILERSEND_FROM_EMAIL ? '✅ ' + MAILERSEND_FROM_EMAIL : '❌ Missing'}`);

if (!MAILERSEND_API_TOKEN || !MAILERSEND_FROM_EMAIL) {
  console.error('\n❌ Missing required environment variables!');
  console.log('\nMake sure your .env file has:');
  console.log('  MAILERSEND_API_TOKEN=mlsn.xxx...');
  console.log('  MAILERSEND_FROM_EMAIL=dara@partyhause.com');
  process.exit(1);
}

console.log('\n✓ Initializing MailerSend client...');

const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_TOKEN,
});

console.log('✓ MailerSend client created');

console.log('\n✓ Preparing test email...');

const sentFrom = new Sender(MAILERSEND_FROM_EMAIL, "PartyHause Test");
const recipients = [new Recipient(MAILERSEND_FROM_EMAIL, MAILERSEND_FROM_EMAIL)]; // Send to yourself

const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setSubject('🧪 MailerSend Test - PartyHause')
  .setHtml(`
    <div style="font-family: system-ui, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <h1>✅ MailerSend is Working!</h1>
      <p>This test email confirms that your MailerSend integration is configured correctly.</p>
      <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>From:</strong> ${MAILERSEND_FROM_EMAIL}</p>
      <p><strong>API Token:</strong> ${MAILERSEND_API_TOKEN.substring(0, 15)}...</p>
      <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 20px 0;">
      <p style="font-size: 14px; opacity: 0.8;">
        If you received this email, your PartyHause email system is ready to send invitations! 🎉
      </p>
    </div>
  `);

console.log('✓ Email prepared');
console.log('\n📧 Sending test email...');
console.log(`   To: ${MAILERSEND_FROM_EMAIL}`);
console.log(`   From: ${MAILERSEND_FROM_EMAIL}`);
console.log(`   Subject: 🧪 MailerSend Test - PartyHause`);

try {
  const response = await mailerSend.email.send(emailParams);
  
  console.log('\n✅ SUCCESS! Email sent successfully!\n');
  console.log('Response:', response);
  
  if (response.body && response.body.message_id) {
    console.log(`\n📨 Message ID: ${response.body.message_id}`);
    console.log(`\n🎯 Check your MailerSend dashboard:`);
    console.log(`   https://app.mailersend.com/activity`);
    console.log(`\n📬 Check your inbox at: ${MAILERSEND_FROM_EMAIL}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ MailerSend is working! Your invitation system is ready.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
} catch (error) {
  console.error('\n❌ FAILED! Error sending email:\n');
  console.error(error);
  
  console.log('\n🔍 Troubleshooting:');
  console.log('1. Verify your API token is correct in .env');
  console.log('2. Check that dara@partyhause.com is verified in MailerSend');
  console.log('3. Make sure your MailerSend account is active');
  console.log('4. Check MailerSend dashboard for any issues');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}
