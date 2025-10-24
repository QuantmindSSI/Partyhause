// Simple test script to verify MailerSend email functionality
// Run with: node test-email.js

import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testing MailerSend Email API...');
  
  if (!process.env.MAILERSEND_API_TOKEN) {
    console.error('❌ MAILERSEND_API_TOKEN not found in environment variables');
    return;
  }
  
  console.log('✅ API Token found');
  
  const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_TOKEN,
  });
  
  try {
    const recipientEmail = process.env.TEST_RECIPIENT || 'dara@partyhause.com';
      if (!process.env.MAILERSEND_FROM_EMAIL) {
        console.error('MAILERSEND_FROM_EMAIL is not configured. Set it to your verified sending address.');
        return;
      }

    const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL, "PartyHause");
    const recipients = [new Recipient(recipientEmail, recipientEmail)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(process.env.TEST_SUBJECT || '🎉 PartyHause Email Test - WORKING!')
      .setHtml(`
        <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #6C63FF;">PartyHause Email Test ✅</h1>
          <p>If you're reading this, the email system is working perfectly!</p>
          <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🚀 Status:</strong> Email API is functional</p>
            <p><strong>📧 Provider:</strong> MailerSend</p>
            <p><strong>🔧 Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          </div>
          <p>Ready to send party invitations! 🎊</p>
        </div>
      `);

    const result = await mailerSend.email.send(emailParams);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Result:', result);
    
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error details:', error);
    
    const errorMessage = error?.message || error?.body?.message || JSON.stringify(error);
    console.error('Error message:', errorMessage);
    
    if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('unauthorized')) {
      console.log('💡 Check your MAILERSEND_API_TOKEN in the .env file');
    }
    
    if (errorMessage.toLowerCase().includes('domain') || errorMessage.toLowerCase().includes('email')) {
        console.log('💡 Email provider rejected the recipient or domain; ensure your sending domain is verified in the provider dashboard');
    }
  }
}

testEmail();