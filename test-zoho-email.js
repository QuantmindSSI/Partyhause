/**
 * Comprehensive Zoho Mail Integration Tests
 * 
 * Tests all email functionality with Zoho Mail
 * Run with: node test-zoho-email.js
 */

import { config } from 'dotenv';
import { 
  sendZohoEmail, 
  sendBatchZohoEmails, 
  verifyZohoConnection, 
  testZohoConfig,
  buildEmailHtml 
} from './api/zoho-email.js';

// Load environment variables
config();

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const DELAY_BETWEEN_TESTS = 2000; // 2 seconds between tests

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Helper function to run a test
 */
async function runTest(name, testFn) {
  results.total++;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🧪 TEST ${results.total}: ${name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.passed++;
    results.tests.push({ name, status: 'PASS', duration });
    console.log(`\n✅ PASS (${duration}ms): ${name}`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    results.failed++;
    results.tests.push({ name, status: 'FAIL', duration, error: error.message });
    console.error(`\n❌ FAIL (${duration}ms): ${name}`);
    console.error('Error:', error.message);
    return false;
  }
}

/**
 * Wait between tests
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 1: Configuration & Connection Tests
// ═════════════════════════════════════════════════════════════

async function test1_EnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const required = [
    'ZOHO_SMTP_HOST',
    'ZOHO_SMTP_PORT',
    'ZOHO_SMTP_USER',
    'ZOHO_SMTP_PASS',
    'ZOHO_FROM_EMAIL',
  ];

  const missing = [];
  for (const varName of required) {
    if (process.env[varName]) {
      console.log(`✓ ${varName}: Set`);
    } else {
      console.log(`✗ ${varName}: Missing`);
      missing.push(varName);
    }
  }

  assert(missing.length === 0, `Missing environment variables: ${missing.join(', ')}`);
}

async function test2_ConfigTest() {
  console.log('Running configuration test...');
  
  const configTest = await testZohoConfig();
  
  console.log('Configuration checks:');
  Object.entries(configTest.checks).forEach(([key, value]) => {
    console.log(`  ${value ? '✓' : '✗'} ${key}`);
  });

  if (configTest.errors.length > 0) {
    console.log('\nErrors:');
    configTest.errors.forEach(err => console.log(`  - ${err}`));
  }

  assert(configTest.success, 'Configuration test failed');
}

async function test3_ConnectionVerification() {
  console.log('Verifying SMTP connection...');
  
  const result = await verifyZohoConnection();
  
  assert(result.success, `Connection failed: ${result.error}`);
  console.log('✓ Connection verified successfully');
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 2: Basic Email Sending Tests
// ═════════════════════════════════════════════════════════════

async function test4_SendPlainTextEmail() {
  console.log(`Sending plain text email to ${TEST_EMAIL}...`);
  
  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] Plain Text Email',
    text: 'This is a plain text test email from PartyHause Zoho Mail integration.',
    html: '<p>This is a <strong>plain text</strong> test email from PartyHause Zoho Mail integration.</p>',
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  assert(result.messageId, 'No message ID returned');
  assert(result.accepted && result.accepted.length > 0, 'No accepted recipients');
  
  console.log('✓ Email sent successfully');
  console.log('  Message ID:', result.messageId);
  console.log('  Accepted:', result.accepted);
}

async function test5_SendHTMLEmail() {
  console.log(`Sending HTML email to ${TEST_EMAIL}...`);
  
  const html = buildEmailHtml({
    title: 'HTML Test Email',
    body: `
      <h1>HTML Test Email</h1>
      <p>This email tests HTML rendering with Zoho Mail.</p>
      <ul>
        <li>Bold text: <strong>Works!</strong></li>
        <li>Italic text: <em>Works!</em></li>
        <li>Link: <a href="https://partyhause.netlify.app">PartyHause</a></li>
      </ul>
    `,
    footer: 'Sent from PartyHause Test Suite',
  });

  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] HTML Email',
    html,
    text: 'This is an HTML test email. Please view it in HTML mode.',
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  assert(result.messageId, 'No message ID returned');
  
  console.log('✓ HTML email sent successfully');
  console.log('  Message ID:', result.messageId);
}

async function test6_SendWithMetadata() {
  console.log(`Sending email with metadata to ${TEST_EMAIL}...`);
  
  const metadata = {
    eventId: 'test-event-123',
    guestId: 'test-guest-456',
    templateId: 'test-template',
    customField: 'custom-value',
  };

  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] Email with Metadata',
    html: '<p>This email includes metadata for tracking.</p>',
    metadata,
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  
  console.log('✓ Email with metadata sent successfully');
  console.log('  Metadata:', metadata);
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 3: Advanced Email Features
// ═════════════════════════════════════════════════════════════

async function test7_SendWithCustomFrom() {
  console.log(`Sending email with custom from name...`);
  
  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] Custom From Name',
    html: '<p>This email has a custom sender name.</p>',
    from: {
      email: process.env.ZOHO_FROM_EMAIL,
      name: 'PartyHause Test Bot',
    },
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  
  console.log('✓ Email with custom from name sent successfully');
}

async function test8_SendWithReplyTo() {
  console.log(`Sending email with reply-to address...`);
  
  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] Reply-To Address',
    html: '<p>Reply to this email to test reply-to functionality.</p>',
    replyTo: 'noreply@partyhause.com',
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  
  console.log('✓ Email with reply-to sent successfully');
}

async function test9_SendWithCC() {
  console.log(`Sending email with CC...`);
  
  // For testing, CC to the same address
  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '[TEST] Email with CC',
    html: '<p>This email includes a CC recipient.</p>',
    cc: TEST_EMAIL,
  });

  assert(result.success, `Failed to send email: ${result.error}`);
  
  console.log('✓ Email with CC sent successfully');
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 4: Invitation Email Tests
// ═════════════════════════════════════════════════════════════

async function test10_SendInvitationEmail() {
  console.log(`Sending invitation email to ${TEST_EMAIL}...`);
  
  const invitationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>You're Invited!</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 You're Invited!</h1>
  </div>
  <div class="content">
    <h2>Test Birthday Party</h2>
    <p><strong>Date:</strong> December 25, 2025</p>
    <p><strong>Location:</strong> 123 Party Street, Fun City</p>
    <p><strong>Time:</strong> 7:00 PM - 11:00 PM</p>
    <p>We'd love for you to join us for an unforgettable celebration!</p>
    <p style="text-align: center; margin-top: 30px;">
      <a href="https://partyhause.netlify.app/rsvp/test-event" class="button">RSVP Now</a>
    </p>
  </div>
</body>
</html>
  `;

  const result = await sendZohoEmail({
    to: TEST_EMAIL,
    subject: '🎉 You\'re Invited to Test Birthday Party!',
    html: invitationHtml,
    metadata: {
      eventId: 'test-event-789',
      guestId: 'test-guest-101',
      emailType: 'invitation',
    },
  });

  assert(result.success, `Failed to send invitation: ${result.error}`);
  
  console.log('✓ Invitation email sent successfully');
  console.log('  Message ID:', result.messageId);
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 5: Batch Email Tests
// ═════════════════════════════════════════════════════════════

async function test11_SendBatchEmails() {
  console.log('Sending batch of 5 emails...');
  
  const emails = Array.from({ length: 5 }, (_, i) => ({
    to: TEST_EMAIL,
    subject: `[TEST] Batch Email ${i + 1}/5`,
    html: `<p>This is batch email number ${i + 1} of 5.</p>`,
    metadata: {
      batchId: 'test-batch-001',
      emailNumber: i + 1,
    },
  }));

  const result = await sendBatchZohoEmails(emails, {
    batchSize: 2,
    delayMs: 1000,
    onProgress: (sent, total) => {
      console.log(`  Progress: ${sent}/${total} emails sent`);
    },
  });

  assert(result.success, 'Batch send failed');
  assert(result.successCount === 5, `Expected 5 successes, got ${result.successCount}`);
  assert(result.failureCount === 0, `Expected 0 failures, got ${result.failureCount}`);
  
  console.log('✓ Batch emails sent successfully');
  console.log(`  Success: ${result.successCount}, Failed: ${result.failureCount}`);
}

// ═════════════════════════════════════════════════════════════
// TEST SUITE 6: Error Handling Tests
// ═════════════════════════════════════════════════════════════

async function test12_InvalidRecipient() {
  console.log('Testing invalid recipient error handling...');
  
  const result = await sendZohoEmail({
    to: 'invalid-email',
    subject: '[TEST] Invalid Recipient',
    html: '<p>This should fail due to invalid email.</p>',
  });

  assert(!result.success, 'Expected failure for invalid email');
  assert(result.error, 'Expected error message');
  
  console.log('✓ Invalid recipient handled correctly');
  console.log('  Error:', result.error);
}

async function test13_MissingSubject() {
  console.log('Testing missing subject error handling...');
  
  try {
    await sendZohoEmail({
      to: TEST_EMAIL,
      subject: '',
      html: '<p>Email without subject.</p>',
    });
    throw new Error('Should have thrown error for missing subject');
  } catch (error) {
    assert(error.message.includes('subject'), 'Expected subject-related error');
    console.log('✓ Missing subject handled correctly');
  }
}

async function test14_MissingContent() {
  console.log('Testing missing content error handling...');
  
  try {
    await sendZohoEmail({
      to: TEST_EMAIL,
      subject: '[TEST] Missing Content',
    });
    throw new Error('Should have thrown error for missing content');
  } catch (error) {
    assert(error.message.includes('content'), 'Expected content-related error');
    console.log('✓ Missing content handled correctly');
  }
}

// ═════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     ZOHO MAIL INTEGRATION - COMPREHENSIVE TEST SUITE     ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Test Email:', TEST_EMAIL);
  console.log('Zoho Host:', process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com');
  console.log('Zoho User:', process.env.ZOHO_SMTP_USER || 'Not set');
  console.log();

  // Configuration & Connection Tests
  console.log('\n\n📋 TEST SUITE 1: CONFIGURATION & CONNECTION');
  console.log('════════════════════════════════════════════\n');
  await runTest('1. Environment Variables Check', test1_EnvironmentVariables);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('2. Configuration Test', test2_ConfigTest);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('3. SMTP Connection Verification', test3_ConnectionVerification);

  // Basic Email Sending Tests
  console.log('\n\n📧 TEST SUITE 2: BASIC EMAIL SENDING');
  console.log('════════════════════════════════════════════\n');
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('4. Send Plain Text Email', test4_SendPlainTextEmail);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('5. Send HTML Email', test5_SendHTMLEmail);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('6. Send Email with Metadata', test6_SendWithMetadata);

  // Advanced Email Features
  console.log('\n\n🚀 TEST SUITE 3: ADVANCED EMAIL FEATURES');
  console.log('════════════════════════════════════════════\n');
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('7. Send with Custom From Name', test7_SendWithCustomFrom);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('8. Send with Reply-To Address', test8_SendWithReplyTo);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('9. Send with CC', test9_SendWithCC);

  // Invitation Email Tests
  console.log('\n\n🎉 TEST SUITE 4: INVITATION EMAILS');
  console.log('════════════════════════════════════════════\n');
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('10. Send Invitation Email', test10_SendInvitationEmail);

  // Batch Email Tests
  console.log('\n\n📬 TEST SUITE 5: BATCH EMAIL SENDING');
  console.log('════════════════════════════════════════════\n');
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('11. Send Batch of 5 Emails', test11_SendBatchEmails);

  // Error Handling Tests
  console.log('\n\n⚠️  TEST SUITE 6: ERROR HANDLING');
  console.log('════════════════════════════════════════════\n');
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('12. Invalid Recipient Error', test12_InvalidRecipient);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('13. Missing Subject Error', test13_MissingSubject);
  await wait(DELAY_BETWEEN_TESTS);
  await runTest('14. Missing Content Error', test14_MissingContent);

  // Print final results
  printResults();
}

function printResults() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║                      TEST RESULTS                         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log();

  console.log('Individual Test Results:');
  console.log('─────────────────────────────────────────────────────────────');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    const duration = `${test.duration}ms`;
    console.log(`${icon} Test ${index + 1}: ${test.name.padEnd(40)} ${duration.padStart(8)}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  console.log();

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('Zoho Mail integration is working perfectly!');
  } else {
    console.log(`⚠️  ${results.failed} test(s) failed. Please review the errors above.`);
  }
  
  console.log();
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n\n❌ FATAL ERROR:');
  console.error(error);
  process.exit(1);
});
