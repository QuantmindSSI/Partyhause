#!/usr/bin/env node

/**
 * Build script for deploying React Native Expo app as PWA
 * This script builds the Expo web app and prepares it for Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building PartyHause Mobile as PWA...');

// Navigate to mobile app directory
const mobileDir = path.join(__dirname, '../apps/mobile');
const distDir = path.join(__dirname, '../dist');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install --legacy-peer-deps', { 
    cwd: mobileDir, 
    stdio: 'inherit' 
  });
} catch (error) {
  console.log('⚠️  Dependency installation had warnings, continuing...');
}

// Build Expo web app
console.log('🔨 Building Expo web app...');
execSync(`npx expo export --platform web --output-dir ${distDir}`, {
  cwd: mobileDir,
  stdio: 'inherit'
});

// Copy PWA assets
console.log('📋 Copying PWA assets...');

const publicDir = path.join(mobileDir, 'public');

// Copy service worker
if (fs.existsSync(path.join(publicDir, 'sw.js'))) {
  fs.copyFileSync(
    path.join(publicDir, 'sw.js'),
    path.join(distDir, 'sw.js')
  );
  console.log('  ✓ Copied sw.js');
}

// Copy manifest
if (fs.existsSync(path.join(publicDir, 'manifest.json'))) {
  fs.copyFileSync(
    path.join(publicDir, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  console.log('  ✓ Copied manifest.json');
}

// Copy index.html if it exists
if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  fs.copyFileSync(
    path.join(publicDir, 'index.html'),
    path.join(distDir, 'index.html')
  );
  console.log('  ✓ Copied index.html');
}

// Copy icons
console.log('📱 Copying icons...');
const assetsDir = path.join(mobileDir, 'assets/images');

const iconFiles = [
  'icon.png',
  'favicon.png',
  'icon-192.png',
  'icon-512.png'
];

iconFiles.forEach(iconFile => {
  const sourcePath = path.join(assetsDir, iconFile);
  const destPath = path.join(distDir, iconFile);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`  ✓ Copied ${iconFile}`);
  } else {
    console.log(`  ⚠️  ${iconFile} not found, skipping`);
  }
});

console.log('');
console.log('✅ Build complete!');
console.log('');
console.log('📁 Output directory: dist/');
console.log('');
