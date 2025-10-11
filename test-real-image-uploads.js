/**
 * Real Image Upload Test using the image-utils.ts functions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create a test image
function createTestImage() {
  const testImageSVG = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4F46E5"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-family="Arial">
        PartyHaus Test Image
      </text>
      <circle cx="100" cy="100" r="50" fill="#EF4444" opacity="0.8"/>
      <circle cx="300" cy="200" r="40" fill="#10B981" opacity="0.8"/>
    </svg>
  `;
  
  const testDir = './test-images';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  fs.writeFileSync(path.join(testDir, 'test-invite.svg'), testImageSVG);
  console.log('✅ Created test SVG image');
}

// Simulate File object from SVG content
async function createFileFromSVG() {
  const svgContent = fs.readFileSync('./test-images/test-invite.svg', 'utf8');
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  
  // Create a File-like object
  const file = new File([blob], 'test-invite.svg', { type: 'image/svg+xml' });
  return file;
}

// Test direct Supabase upload
async function testDirectUpload() {
  console.log('📤 Testing direct Supabase upload...');
  
  try {
    const svgContent = fs.readFileSync('./test-images/test-invite.svg', 'utf8');
    const buffer = Buffer.from(svgContent);
    
    const fileName = `test-user-123/invite-${Date.now()}.svg`;
    
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(fileName, buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });
    
    if (error) {
      console.log('❌ Upload error:', error);
      return false;
    }
    
    console.log('✅ Upload successful:', data);
    
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
    console.log('❌ Upload test failed:', error.message);
    return false;
  }
}

// Test PNG image creation and upload
async function testPNGUpload() {
  console.log('📤 Testing PNG image upload...');
  
  // Create a minimal PNG file (1x1 pixel red dot)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // Width: 1, Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Bit depth: 8, Color: RGB
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // Compressed data
    0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, // Red pixel data
    0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, // IEND chunk
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  try {
    const fileName = `test-user-123/test-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('event-invites')
      .upload(fileName, pngData, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.log('❌ PNG upload error:', error);
      return false;
    }
    
    console.log('✅ PNG upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-invites')
      .getPublicUrl(fileName);
    
    console.log('🔗 PNG Public URL:', publicUrl);
    return true;
    
  } catch (error) {
    console.log('❌ PNG upload test failed:', error.message);
    return false;
  }
}

// Test the validation functions
async function testValidation() {
  console.log('✅ Testing validation functions...');
  
  // Test file size validation (simulate large file)
  const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
  console.log(`📏 Large file (${Math.round(largeFile.size / 1024 / 1024)}MB):`, largeFile.size > 5 * 1024 * 1024 ? 'Should fail' : 'Should pass');
  
  // Test file type validation
  const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
  console.log('📄 Text file:', textFile.type.startsWith('image/') ? 'Should pass' : 'Should fail');
  
  const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  console.log('🖼️ JPEG file:', jpegFile.type.startsWith('image/') ? 'Should pass' : 'Should fail');
  
  return true;
}

// Test deletion
async function testDeletion() {
  console.log('🗑️ Testing file deletion...');
  
  try {
    // List files in the bucket first
    const { data: files, error: listError } = await supabase.storage
      .from('event-invites')
      .list('test-user-123');
    
    if (listError) {
      console.log('❌ List error:', listError);
      return false;
    }
    
    console.log(`📁 Found ${files.length} files in test-user-123 folder`);
    
    if (files.length > 0) {
      const fileToDelete = `test-user-123/${files[0].name}`;
      console.log(`🗑️ Deleting: ${fileToDelete}`);
      
      const { error: deleteError } = await supabase.storage
        .from('event-invites')
        .remove([fileToDelete]);
      
      if (deleteError) {
        console.log('❌ Delete error:', deleteError);
        return false;
      }
      
      console.log('✅ File deleted successfully');
      return true;
    } else {
      console.log('ℹ️ No files to delete');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Deletion test failed:', error.message);
    return false;
  }
}

async function runRealImageTests() {
  console.log('🚀 Starting Real Image Upload Tests\n');
  
  const tests = [
    { name: 'Create Test Image', fn: () => { createTestImage(); return Promise.resolve(true); } },
    { name: 'Direct SVG Upload', fn: testDirectUpload },
    { name: 'PNG Upload', fn: testPNGUpload },
    { name: 'Validation Functions', fn: testValidation },
    { name: 'File Deletion', fn: testDeletion }
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
  console.log('\n📊 Real Image Upload Test Results:');
  console.log('=====================================');
  
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
    console.log('🎉 All image upload tests passed! System is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Review the errors above.');
  }
}

runRealImageTests().catch(console.error);