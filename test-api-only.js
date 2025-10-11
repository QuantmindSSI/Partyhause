// Test just the API test endpoint
async function testAPIOnly() {
  console.log('🔧 Testing API Test Endpoint...');
  
  try {
    const response = await fetch('https://partyhaus.vercel.app/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const text = await response.text();
      console.log('❌ Error response:', text);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAPIOnly();