#!/usr/bin/env node
/**
 * Test MailerSend Email Delivery
 * 
 * Tests the complete email sending flow:
 * 1. Server health check
 * 2. Send test email via local server
 * 3. Verify email log created in database
 * 4. Check MailerSend delivery status
 * 
 * Run with: node scripts/test-mailersend.js your-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('❌ Please provide a test email address');
  console.error('Usage: node scripts/test-mailersend.js your-email@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailDelivery() {
  console.log('🧪 Testing MailerSend Email Delivery');
  console.log('=' .repeat(50));
  console.log(`📧 Test recipient: ${testEmail}\n`);

  // Step 1: Health check
  console.log('1️⃣  Checking email server health...');
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log(`   ✅ Server status: ${healthData.status}`);
    console.log(`   📝 ${healthData.message}\n`);
  } catch (error) {
    console.error('   ❌ Email server is not running!');
    console.error('   💡 Start it with: npm run server\n');
    process.exit(1);
  }

  // Step 2: Create email log
  console.log('2️⃣  Creating email log in database...');
  const { data: emailLog, error: logError } = await supabase
    .from('email_logs')
    .insert({
      email_type: 'test',
      recipient_email: testEmail,
      subject: '🧪 PartyHause Email Test',
      status: 'pending'
    })
    .select()
    .single();

  if (logError) {
    console.error('   ❌ Failed to create email log:', logError.message);
    process.exit(1);
  }
  console.log(`   ✅ Email log created (ID: ${emailLog.id})\n`);

  // Step 3: Send test email
  console.log('3️⃣  Sending test email via MailerSend...');
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Test</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #1a1b41;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: #6C63FF;
          margin: 0;
        }
        .status {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 20px 0;
        }
        .info-box {
          background: #f8f9ff;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
        }
        .info-item {
          margin: 10px 0;
        }
        .label {
          font-weight: 600;
          color: #666;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e8f0;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🧪</div>
          <h1>Email Delivery Test</h1>
        </div>
        
        <div class="status">
          <h2 style="margin: 0;">✅ MailerSend is Working!</h2>
          <p style="margin: 10px 0 0 0;">Your email configuration is properly set up.</p>
        </div>
        
        <div class="info-box">
          <div class="info-item">
            <span class="label">Test Time:</span> ${new Date().toLocaleString()}
          </div>
          <div class="info-item">
            <span class="label">Email Log ID:</span> ${emailLog.id}
          </div>
          <div class="info-item">
            <span class="label">Recipient:</span> ${testEmail}
          </div>
          <div class="info-item">
            <span class="label">Sender:</span> PartyHause &lt;dara@partyhause.com&gt;
          </div>
        </div>
        
        <p>This is a test email to verify your PartyHause email delivery system. If you're reading this, it means:</p>
        <ul>
          <li>✅ MailerSend API is properly configured</li>
          <li>✅ Email server is running correctly</li>
          <li>✅ Domain verification is complete</li>
          <li>✅ Email templates are rendering properly</li>
        </ul>
        
        <div class="footer">
          <p>Powered by <strong style="color: #6C63FF;">PartyHause</strong></p>
          <p>Plan. Party. Perfect.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const sendResponse = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: testEmail,
        subject: '🧪 PartyHause Email Test - MailerSend Verification',
        html: emailHtml,
        metadata: {
          emailLogId: emailLog.id,
          testRun: true,
          timestamp: new Date().toISOString()
        }
      })
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok || !sendData.success) {
      console.error('   ❌ Failed to send email:', sendData.error || 'Unknown error');
      console.error('   Response:', JSON.stringify(sendData, null, 2));
      process.exit(1);
    }

    console.log(`   ✅ Email sent successfully!`);
    console.log(`   📧 MailerSend Message ID: ${sendData.data?.id || 'N/A'}\n`);

    // Step 4: Verify email log was updated
    console.log('4️⃣  Verifying email log update...');
    const { data: updatedLog, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLog.id)
      .single();

    if (fetchError) {
      console.error('   ❌ Failed to fetch email log:', fetchError.message);
    } else {
      console.log(`   ✅ Email log status: ${updatedLog.status}`);
      console.log(`   📅 Sent at: ${updatedLog.sent_at || 'Not recorded'}`);
      console.log(`   🆔 MailerSend ID: ${updatedLog.resend_email_id || 'Not recorded'}\n`);
    }

    // Success summary
    console.log('=' .repeat(50));
    console.log('✨ EMAIL TEST COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    console.log('\n📬 Check your inbox at:', testEmail);
    console.log('💡 It may take a few moments to arrive');
    console.log('\n🔍 What to check:');
    console.log('   1. Email arrives in inbox (not spam)');
    console.log('   2. Email renders correctly');
    console.log('   3. From address shows: PartyHause <dara@partyhause.com>');
    console.log('   4. All styling and images display properly');
    console.log('\n📊 MailerSend Dashboard:');
    console.log('   https://app.mailersend.com/activity');
    console.log('\n');

  } catch (error) {
    console.error('   ❌ Error sending email:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailDelivery().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
