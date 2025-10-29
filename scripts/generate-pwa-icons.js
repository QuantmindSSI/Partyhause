#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates all required icon sizes for PWA from SVG
 * Uses sharp library for image processing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_SVG = path.join(__dirname, '../public/partyhaus-icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Icon sizes to generate
const ICONS = {
  standard: [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
  ],
  maskable: [
    { size: 192, name: 'icon-maskable-192.png', padding: 0.2 },
    { size: 512, name: 'icon-maskable-512.png', padding: 0.2 },
  ],
  apple: [
    { size: 120, name: 'apple-touch-icon-120x120.png' },
    { size: 152, name: 'apple-touch-icon-152x152.png' },
    { size: 167, name: 'apple-touch-icon-167x167.png' },
    { size: 180, name: 'apple-touch-icon-180x180.png' },
  ],
  favicon: [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
  ],
  shortcuts: [
    { size: 96, name: 'shortcut-create.png' },
    { size: 96, name: 'shortcut-events.png' },
  ],
  badge: [
    { size: 72, name: 'badge.png' },
  ],
};

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcon(size, outputPath, maskable = false) {
  try {
    let image = sharp(SOURCE_SVG);
    
    if (maskable) {
      // For maskable icons, create with background and padding (safe zone)
      const iconSize = Math.floor(size * 0.8); // 80% for safe zone
      const padding = Math.floor((size - iconSize) / 2);
      
      // Create background
      const background = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366F1
        }
      }).png().toBuffer();
      
      // Resize SVG and composite on background
      const resizedIcon = await sharp(SOURCE_SVG)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer();
      
      await sharp(background)
        .composite([{
          input: resizedIcon,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(outputPath);
    } else {
      // Standard icon - just resize
      await image
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error generating ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons from partyhaus-icon.svg...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Generate standard icons
  console.log('📱 Generating standard icons...');
  for (const icon of ICONS.standard) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, false);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    }
  }
  
  // Generate maskable icons
  console.log('\n🎭 Generating maskable icons...');
  for (const icon of ICONS.maskable) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, true);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size}, maskable)`);
      successCount++;
    }
  }
  
  // Generate Apple Touch icons
  console.log('\n🍎 Generating Apple Touch Icons...');
  for (const icon of ICONS.apple) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, false);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    }
  }
  
  // Generate favicons
  console.log('\n🌐 Generating favicons...');
  for (const icon of ICONS.favicon) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, false);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    }
  }
  
  // Generate shortcut icons
  console.log('\n🔗 Generating shortcut icons...');
  for (const icon of ICONS.shortcuts) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, false);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    }
  }
  
  // Generate badge
  console.log('\n🏷️  Generating badge icon...');
  for (const icon of ICONS.badge) {
    totalCount++;
    const outputPath = path.join(OUTPUT_DIR, icon.name);
    const success = await generateIcon(icon.size, outputPath, false);
    if (success) {
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Generated ${successCount}/${totalCount} icons successfully!`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log('\n🚀 Next steps:');
  console.log('   1. Review the icons in public/icons/');
  console.log('   2. Run: npm run build');
  console.log('   3. Run: npm run preview');
  console.log('   4. Test PWA installation');
  console.log('   5. Deploy: vercel --prod');
}

// Check if source file exists
if (!fs.existsSync(SOURCE_SVG)) {
  console.error(`❌ Source file not found: ${SOURCE_SVG}`);
  process.exit(1);
}

// Run
generateAllIcons()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
