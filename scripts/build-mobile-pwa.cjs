#!/usr/bin/env node

/**
 * Build the React Native Expo app as a standalone static PWA artifact.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building PartyHause Mobile as PWA...');

// Directories
const rootDir = path.join(__dirname, '..');
const mobileDir = path.join(rootDir, 'apps/mobile');
const distDir = path.join(mobileDir, 'dist');

function collectHtmlFiles(directory) {
  const htmlFiles = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      htmlFiles.push(...collectHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(entryPath);
    }
  }
  return htmlFiles;
}

// Install dependencies for the workspace (including mobile)
console.log('📦 Installing workspace dependencies...');
try {
  execSync('npm install --workspaces --legacy-peer-deps', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
} catch (error) {
  console.log('⚠️  Dependency installation had warnings, continuing...');
}

// Build Expo web app
console.log('🔨 Building Expo web app...');
fs.rmSync(distDir, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir "${distDir}"`, {
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

// DON'T copy index.html - let Expo generate it
// Our custom index.html doesn't have the necessary Expo script tags

// Copy icons
console.log('📱 Copying icons...');
const assetsDir = path.join(mobileDir, 'assets/images');

const iconFiles = [
  'icon.png',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png',
  'shortcut-create.png',
  'shortcut-events.png',
  'badge.png'
];

iconFiles.forEach(iconFile => {
  const sourcePath = path.join(assetsDir, iconFile);
  const destPath = path.join(distDir, iconFile);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Required PWA icon not found: ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, destPath);
  console.log(`  ✓ Copied ${iconFile}`);
});

// Add the PWA manifest and module scripts to every statically rendered route.
console.log('🔧 Preparing exported HTML...');
const htmlFiles = collectHtmlFiles(distDir);
if (htmlFiles.length === 0) {
  throw new Error(`Expo output contains no HTML files: ${distDir}`);
}

for (const htmlPath of htmlFiles) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(
    /<script src="\/_expo\/static\/js\/web\/entry-([^"]+)\.js" defer>/g,
    '<script type="module" src="/_expo/static/js/web/entry-$1.js"></script>'
  );

  if (!html.includes('rel="manifest"')) {
    html = html.replace(
      '</head>',
      '  <link rel="manifest" href="/manifest.json" />\n</head>'
    );
  }

  if (!html.includes('rel="manifest"')) {
    throw new Error(`Expo output does not contain a closing head element: ${htmlPath}`);
  }

  fs.writeFileSync(htmlPath, html);
}
console.log(`  ✓ Prepared ${htmlFiles.length} HTML files`);

console.log('');
console.log('✅ Build complete!');
console.log('');
console.log('📁 Output directory: apps/mobile/dist/');
console.log('');
