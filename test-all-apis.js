// Test multiple API endpoints
async function testAllAPIs() {
  console.log('🔧 Testing All API Endpoints...\n');
  
  const endpoints = [
    { name: 'Health Check (JS)', url: 'https://partyhause.vercel.app/api/health' },
    { name: 'Test Endpoint (TS)', url: 'https://partyhause.vercel.app/api/test' },
    { name: 'Send Email (TS)', url: 'https://partyhause.vercel.app/api/send-email' },
    { name: 'Email Webhook (TS)', url: 'https://partyhause.vercel.app/api/email-webhook' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🌐 Testing ${endpoint.name}:`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCCESS:', data);
      } else {
        const text = await response.text();
        console.log(`   ❌ ERROR: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ REQUEST FAILED: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Summary: Check which endpoints are working');
}

testAllAPIs();