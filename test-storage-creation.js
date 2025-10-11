/**
 * Manually create storage bucket and test uploads
 */

const SERVICE_ROLE_KEY = '***REDACTED_JWT***';
const SUPABASE_URL = 'http://127.0.0.1:54321';

async function createBucket() {
  console.log('🪣 Creating event-invites bucket...');
  
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    },
    body: JSON.stringify({
      id: 'event-invites',
      name: 'event-invites',
      public: true,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Bucket created:', result);
    return true;
  } else {
    const error = await response.text();
    console.log('❌ Bucket creation failed:', response.status, error);
    return false;
  }
}

async function listBuckets() {
  console.log('📋 Listing buckets...');
  
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY
    }
  });

  if (response.ok) {
    const buckets = await response.json();
    console.log('Available buckets:', buckets);
    return buckets;
  } else {
    console.log('Failed to list buckets:', response.status);
    return [];
  }
}

async function testUpload() {
  console.log('⬆️ Testing file upload...');
  
  // Create a test file
  const testContent = 'This is a test file for image upload verification';
  const blob = new Blob([testContent], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('', blob); // No file field name for Supabase storage
  
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/event-invites/test-user-123/test-upload.txt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY
    },
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    // Test public URL access
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/event-invites/test-user-123/test-upload.txt`;
    console.log('🔗 Public URL:', publicUrl);
    
    // Verify public access
    const publicResponse = await fetch(publicUrl);
    if (publicResponse.ok) {
      const content = await publicResponse.text();
      console.log('✅ Public access works, content:', content);
    } else {
      console.log('❌ Public access failed:', publicResponse.status);
    }
    
    return true;
  } else {
    const error = await response.text();
    console.log('❌ Upload failed:', response.status, error);
    return false;
  }
}

async function runStorageTests() {
  console.log('🚀 Starting Storage Tests\n');
  
  // List existing buckets
  await listBuckets();
  
  // Create bucket
  await createBucket();
  
  // List buckets again
  await listBuckets();
  
  // Test upload
  await testUpload();
  
  console.log('\n✅ Storage tests completed');
}

runStorageTests().catch(console.error);