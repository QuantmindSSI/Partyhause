/**
 * Authenticated Image Upload Test
 * Creates a test user and tests uploads with authentication
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = '***REDACTED_JWT***';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUpTestUser() {
  console.log('👤 Creating test user...');
  
  const testEmail = `test-${Date.now()}@partyhaus.test`;
  const testPassword = 'TestPassword123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('❌ Sign up error:', error.message);
      return null;
    }
    
    console.log('✅ Test user created:', data.user?.id);
    return data.user;
  } catch (error) {
    console.log('❌ Sign up failed:', error.message);
    return null;
  }
}

async function signInTestUser(email, password) {
  console.log('🔐 Signing in test user...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('❌ Sign in error:', error.message);
      return null;
    }
    
    console.log('✅ User signed in:', data.user?.id);
    return data.user;
  } catch (error) {
    console.log('❌ Sign in failed:', error.message);
    return null;
  }
}

async function testAuthenticatedUpload(userId) {
  console.log('📤 Testing authenticated upload...');
  
  try {
    // Create test image content
    const svgContent = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#10B981"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="16">
          Authenticated Upload Test
        </text>
      </svg>
    `;
    
    const buffer = Buffer.from(svgContent);
    const fileName = `${userId}/test-authenticated-${Date.now()}.svg`;
    
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(fileName, buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (error) {
      console.log('❌ Authenticated upload error:', error);
      return false;
    }
    
    console.log('✅ Authenticated upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-invites')
      .getPublicUrl(fileName);
    
    console.log('🔗 Public URL:', publicUrl);
    
    // Test public access
    const response = await fetch(publicUrl);
    if (response.ok) {
      console.log('✅ Public access verified');
      return true;
    } else {
      console.log('❌ Public access failed:', response.status);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Authenticated upload test failed:', error.message);
    return false;
  }
}

async function testUnauthorizedUpload() {
  console.log('🚫 Testing unauthorized upload (should fail)...');
  
  try {
    // Try to upload to another user's folder
    const svgContent = '<svg><rect fill="red"/></svg>';
    const buffer = Buffer.from(svgContent);
    const fileName = 'different-user-123/unauthorized-test.svg';
    
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(fileName, buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (error) {
      console.log('✅ Unauthorized upload correctly blocked:', error.message);
      return true;
    } else {
      console.log('❌ Unauthorized upload should have failed but succeeded');
      return false;
    }
    
  } catch (error) {
    console.log('✅ Unauthorized upload correctly blocked:', error.message);
    return true;
  }
}

async function testMultipleImageFormats(userId) {
  console.log('🖼️ Testing multiple image formats...');
  
  const results = [];
  
  // Test SVG
  try {
    const svgContent = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(`${userId}/test.svg`, Buffer.from(svgContent), { contentType: 'image/svg+xml' });
    
    results.push({ format: 'SVG', success: !error, error: error?.message });
  } catch (e) {
    results.push({ format: 'SVG', success: false, error: e.message });
  }
  
  // Test a minimal PNG (1x1 transparent pixel)
  try {
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // 8-bit RGBA
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x1D, 0x01, 0x00, 0x00, 0x00, 0x01, // Transparent pixel
      0x00, 0x01, 0x00, 0x00, 0x02, 0x7D, 0x03, 0x3A, // Data
      0x28, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(`${userId}/test.png`, pngData, { contentType: 'image/png' });
    
    results.push({ format: 'PNG', success: !error, error: error?.message });
  } catch (e) {
    results.push({ format: 'PNG', success: false, error: e.message });
  }
  
  // Display results
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.format}: ${result.success ? 'Success' : result.error}`);
  });
  
  return results.every(r => r.success);
}

async function runAuthenticatedTests() {
  console.log('🚀 Starting Authenticated Image Upload Tests\n');
  
  const testEmail = `test-${Date.now()}@partyhaus.test`;
  const testPassword = 'TestPassword123!';
  
  // Sign up test user
  const user = await signUpTestUser();
  if (!user) {
    console.log('❌ Could not create test user. Aborting tests.');
    return;
  }
  
  const tests = [
    { name: 'Authenticated Upload', fn: () => testAuthenticatedUpload(user.id) },
    { name: 'Unauthorized Upload (should fail)', fn: testUnauthorizedUpload },
    { name: 'Multiple Image Formats', fn: () => testMultipleImageFormats(user.id) }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}:`);
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Print summary
  console.log('\n📊 Authenticated Test Results:');
  console.log('===============================');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`\n🎯 ${passedTests}/${results.length} tests passed`);
  
  if (passedTests === results.length) {
    console.log('🎉 All authenticated upload tests passed!');
    console.log('💡 The image upload system is working correctly with proper security.');
  } else {
    console.log('⚠️ Some tests failed. Review the security policies.');
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\n👋 Test user signed out');
}

runAuthenticatedTests().catch(console.error);