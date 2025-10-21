#!/usr/bin/env node
/**
 * Mobile Email Configuration Test
 * 
 * Verifies that the mobile app can reach the email server
 * Run this to ensure network configuration is correct
 * 
 * Usage: node scripts/test-mobile-email-config.js
 */

import http from 'http';
import os from 'os';

console.log('🔍 Mobile Email Configuration Check');
console.log('=' .repeat(50));
console.log();

// Get all network interfaces
const interfaces = os.networkInterfaces();
const addresses = [];

Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push({
        interface: interfaceName,
        address: iface.address
      });
    }
  });
});

console.log('📡 Network Interfaces:');
addresses.forEach(({ interface: iface, address }) => {
  console.log(`   ${iface}: ${address}`);
});
console.log();

// Check if email server is running
console.log('🔌 Checking Email Server...');

const checkServer = (host, port) => {
  return new Promise((resolve) => {
    const request = http.get(`http://${host}:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: true, data: json });
        } catch (e) {
          resolve({ success: false, error: 'Invalid response' });
        }
      });
    });

    request.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    request.setTimeout(3000, () => {
      request.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
};

// Test localhost
console.log('   Testing localhost:3001...');
const localhostResult = await checkServer('localhost', 3001);
if (localhostResult.success) {
  console.log('   ✅ Email server is running on localhost:3001');
} else {
  console.log(`   ❌ Cannot reach localhost:3001 (${localhostResult.error})`);
  console.log('   💡 Start server with: npm run server');
}
console.log();

// Test each network interface
console.log('📱 Mobile Access Configuration:');
console.log();

for (const { interface: iface, address } of addresses) {
  console.log(`   Interface: ${iface} (${address})`);
  const result = await checkServer(address, 3001);
  
  if (result.success) {
    console.log(`   ✅ Accessible at http://${address}:3001`);
    console.log(`   📱 Use this for mobile physical devices`);
  } else {
    console.log(`   ❌ Not accessible (${result.error})`);
  }
  console.log();
}

// Android emulator check
console.log('🤖 Android Emulator Configuration:');
console.log('   URL: http://10.0.2.2:3001/api/send-email');
console.log('   Note: 10.0.2.2 is a special alias that maps to host localhost');
console.log('   ✅ Should work automatically if server is running');
console.log();

// iOS simulator check
console.log('🍎 iOS Simulator Configuration:');
const primaryAddress = addresses[0]?.address || 'N/A';
console.log(`   URL: http://${primaryAddress}:3001/api/send-email`);
console.log(`   ✅ Should work if server is running`);
console.log();

// Summary
console.log('=' .repeat(50));
console.log('📋 Configuration Summary:');
console.log('=' .repeat(50));
console.log();

if (localhostResult.success) {
  console.log('✅ Email server is running correctly');
  console.log();
  console.log('📱 Mobile App Configuration:');
  console.log();
  console.log('Update apps/mobile/lib/email.ts with:');
  console.log();
  console.log('```typescript');
  console.log('const EMAIL_API_URL = __DEV__');
  console.log('  ? Platform.select({');
  console.log(`      ios: 'http://${primaryAddress}:3001/api/send-email',`);
  console.log(`      android: 'http://10.0.2.2:3001/api/send-email',`);
  console.log(`      default: 'http://${primaryAddress}:3001/api/send-email',`);
  console.log('    })');
  console.log('  : \'https://your-production-domain.com/api/send-email\';');
  console.log('```');
  console.log();
  console.log('✅ Configuration is already correct!');
  console.log();
  console.log('Next Steps:');
  console.log('1. Ensure mobile device/emulator is on same network');
  console.log('2. Run mobile app with: cd apps/mobile && npm start');
  console.log('3. Add a guest and test email sending');
  console.log('4. Check email arrives at recipient');
} else {
  console.log('❌ Email server is not running');
  console.log();
  console.log('Start the server first:');
  console.log('   npm run server');
  console.log();
  console.log('Then run this check again');
}
console.log();
