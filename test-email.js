// Simple test script to verify email functionality
// Run with: node test-email.js

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testing Resend Email API...');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API Key found');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const recipient = process.env.TEST_RECIPIENT || 'thecommodore30@gmail.com';
      if (!process.env.RESEND_FROM_EMAIL) {
        console.error('RESEND_FROM_EMAIL is not configured. Set it to your verified sending address.');
        return;
      }

  const from = process.env.TEST_FROM || `PartyHause <${process.env.RESEND_FROM_EMAIL}>`;

    const result = await resend.emails.send({
      from,
      to: [recipient], // Using the provided test recipient
  subject: process.env.TEST_SUBJECT || '🎉 PartyHause Email Test - WORKING!',
      html: `
        <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #6C63FF;">PartyHause Email Test ✅</h1>
          <p>If you're reading this, the email system is working perfectly!</p>
          <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🚀 Status:</strong> Email API is functional</p>
            <p><strong>📧 Provider:</strong> Resend</p>
            <p><strong>🔧 Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          </div>
          <p>Ready to send party invitations! 🎊</p>
        </div>
      `,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Result:', result);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('💡 Check your RESEND_API_KEY in the .env file');
    }
    
    if (error.message.includes('domain')) {
        console.log('💡 Email provider rejected the recipient or domain; ensure your sending domain is verified in the provider dashboard');
    }
  }
}

testEmail();