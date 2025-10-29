#!/bin/bash

# Complete deployment script for PartyHause Mobile PWA
# This script prepares icons, builds the app, and deploys to Vercel

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 PartyHause Mobile PWA Deployment"
echo "===================================="
echo ""

# Step 1: Prepare icons
echo "Step 1: Preparing PWA icons..."
bash "$SCRIPT_DIR/prepare-mobile-icons.sh"
echo ""

# Step 2: Build the mobile app
echo "Step 2: Building Expo web app..."
cd "$PROJECT_ROOT/apps/mobile"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --legacy-peer-deps
fi

echo "🔨 Exporting Expo web app..."
npx expo export --platform web --output-dir "$PROJECT_ROOT/dist"

# Step 3: Copy PWA assets
echo ""
echo "Step 3: Copying PWA assets to dist..."

# Copy service worker
if [ -f "public/sw.js" ]; then
  cp public/sw.js "$PROJECT_ROOT/dist/sw.js"
  echo "  ✓ Copied service worker"
fi

# Copy manifest
if [ -f "public/manifest.json" ]; then
  cp public/manifest.json "$PROJECT_ROOT/dist/manifest.json"
  echo "  ✓ Copied manifest.json"
fi

# Copy icons
if [ -d "public" ]; then
  cp public/*.png "$PROJECT_ROOT/dist/" 2>/dev/null || true
  echo "  ✓ Copied icons"
fi

# Copy index.html if it exists (to override Expo's default)
if [ -f "public/index.html" ]; then
  cp public/index.html "$PROJECT_ROOT/dist/index.html"
  echo "  ✓ Copied custom index.html"
fi

# Step 4: Verify build
echo ""
echo "Step 4: Verifying build..."
cd "$PROJECT_ROOT"

if [ ! -f "dist/index.html" ]; then
  echo "❌ Error: dist/index.html not found"
  exit 1
fi

if [ ! -f "dist/manifest.json" ]; then
  echo "❌ Error: dist/manifest.json not found"
  exit 1
fi

if [ ! -f "dist/sw.js" ]; then
  echo "❌ Error: dist/sw.js not found"
  exit 1
fi

echo "  ✓ All required files present"
echo ""

# Step 5: Display summary
echo "✅ Build Complete!"
echo ""
echo "📁 Output directory: $PROJECT_ROOT/dist"
echo ""
echo "📊 Build Summary:"
echo "  - Static files: $(find dist -type f | wc -l | xargs) files"
echo "  - Total size: $(du -sh dist | cut -f1)"
echo ""
echo "🧪 Test locally:"
echo "  npm install -g serve"
echo "  serve dist"
echo ""
echo "🚀 Deploy to Vercel:"
echo "  vercel --prod"
echo ""
