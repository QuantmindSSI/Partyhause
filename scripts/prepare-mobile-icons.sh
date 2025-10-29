#!/bin/bash

# Script to prepare PWA icons for the mobile app
# Copies existing icons from the web app and generates missing ones

set -e

echo "🎨 Preparing PWA icons for mobile app..."

SOURCE_DIR="/Users/startferanmi/Data-Scientist/Partyhause/public"
MOBILE_ASSETS="/Users/startferanmi/Data-Scientist/Partyhause/apps/mobile/assets/images"
MOBILE_PUBLIC="/Users/startferanmi/Data-Scientist/Partyhause/apps/mobile/public"

# Create public directory if it doesn't exist
mkdir -p "$MOBILE_PUBLIC"

echo "📁 Copying icons from web app..."

# Copy the main SVG icon if it exists
if [ -f "$SOURCE_DIR/partyhaus-icon.svg" ]; then
  cp "$SOURCE_DIR/partyhaus-icon.svg" "$MOBILE_PUBLIC/partyhaus-icon.svg"
  echo "  ✓ Copied partyhaus-icon.svg"
fi

# Copy all PNG icons
if [ -d "$SOURCE_DIR/icons" ]; then
  cp "$SOURCE_DIR/icons"/*.png "$MOBILE_PUBLIC/" 2>/dev/null || true
  echo "  ✓ Copied PNG icons"
fi

# Check if we have the main icon in mobile assets
if [ -f "$MOBILE_ASSETS/icon.png" ]; then
  echo "📱 Using existing mobile icon.png"
  cp "$MOBILE_ASSETS/icon.png" "$MOBILE_PUBLIC/icon.png"
  
  # Check if ImageMagick is available for resizing
  if command -v convert &> /dev/null; then
    echo "🎨 Generating icon sizes with ImageMagick..."
    
    # Generate 192x192 icon if not exists
    if [ ! -f "$MOBILE_PUBLIC/icon-192.png" ]; then
      convert "$MOBILE_ASSETS/icon.png" -resize 192x192 "$MOBILE_PUBLIC/icon-192.png"
      echo "  ✓ Generated icon-192.png"
    fi
    
    # Generate 512x512 icon if not exists
    if [ ! -f "$MOBILE_PUBLIC/icon-512.png" ]; then
      convert "$MOBILE_ASSETS/icon.png" -resize 512x512 "$MOBILE_PUBLIC/icon-512.png"
      echo "  ✓ Generated icon-512.png"
    fi
    
    # Generate maskable icon (with padding for safe zone)
    if [ ! -f "$MOBILE_PUBLIC/icon-maskable.png" ]; then
      convert "$MOBILE_ASSETS/icon.png" -resize 410x410 -background transparent -gravity center -extent 512x512 "$MOBILE_PUBLIC/icon-maskable.png"
      echo "  ✓ Generated icon-maskable.png"
    fi
    
  else
    echo "⚠️  ImageMagick not found. Using original icons."
    echo "   Install with: brew install imagemagick"
    
    # Just copy the original as fallback
    cp "$MOBILE_ASSETS/icon.png" "$MOBILE_PUBLIC/icon-192.png" 2>/dev/null || true
    cp "$MOBILE_ASSETS/icon.png" "$MOBILE_PUBLIC/icon-512.png" 2>/dev/null || true
  fi
else
  echo "⚠️  No icon.png found in mobile assets"
fi

# Copy favicon
if [ -f "$MOBILE_ASSETS/favicon.png" ]; then
  cp "$MOBILE_ASSETS/favicon.png" "$MOBILE_PUBLIC/favicon.png"
  echo "  ✓ Copied favicon.png"
fi

echo ""
echo "✅ Icon preparation complete!"
echo "📁 Icons are ready in: $MOBILE_PUBLIC"
echo ""
