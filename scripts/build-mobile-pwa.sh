#!/bin/bash

# Build script for deploying React Native Expo app as PWA
# This script builds the Expo web app and prepares it for Vercel deployment

set -e

echo "🚀 Building PartyHause Mobile as PWA..."

# Navigate to mobile app directory
cd "$(dirname "$0")/../apps/mobile"

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building Expo web app..."
npx expo export --platform web --output-dir ../../dist

echo "📋 Copying PWA assets..."
# Copy service worker to dist root
cp public/sw.js ../../dist/sw.js

# Copy manifest to dist root  
cp public/manifest.json ../../dist/manifest.json

# Copy index.html if needed (Expo should generate one, but we can override)
if [ -f "public/index.html" ]; then
  cp public/index.html ../../dist/index.html
fi

echo "📱 Copying icons..."
# Copy icons to dist root
cp assets/images/icon.png ../../dist/icon.png
cp assets/images/favicon.png ../../dist/favicon.png

# Generate icon sizes if they don't exist
if command -v convert &> /dev/null; then
  echo "🎨 Generating icon sizes..."
  convert assets/images/icon.png -resize 192x192 ../../dist/icon-192.png
  convert assets/images/icon.png -resize 512x512 ../../dist/icon-512.png
else
  echo "⚠️  ImageMagick not found. Skipping icon generation."
  echo "   Install with: brew install imagemagick"
  # Copy original as fallback
  cp assets/images/icon.png ../../dist/icon-192.png
  cp assets/images/icon.png ../../dist/icon-512.png
fi

echo "✅ Build complete!"
echo ""
echo "📁 Output directory: dist/"
echo ""
echo "Next steps:"
echo "1. Test locally: npx serve dist"
echo "2. Deploy to Vercel: cd ../.. && vercel --prod"
echo ""
