#!/bin/bash

# PWA Icon Generator Script
# Generates all required icon sizes for PWA from the source SVG

echo "🎨 Generating PWA icons from partyhaus-icon.svg..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Source SVG file
SOURCE_SVG="public/partyhaus-icon.svg"
OUTPUT_DIR="public/icons"

# Check if source exists
if [ ! -f "$SOURCE_SVG" ]; then
    echo "❌ Source file not found: $SOURCE_SVG"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "📁 Output directory: $OUTPUT_DIR"

# Function to generate icon with background
generate_icon() {
    local size=$1
    local output=$2
    local maskable=$3
    
    if [ "$maskable" = "true" ]; then
        # Maskable icons need safe zone (80% of canvas)
        local icon_size=$((size * 80 / 100))
        local offset=$(( (size - icon_size) / 2 ))
        
        echo "  → $output (${size}x${size}, maskable)"
        
        # Create white background and overlay icon
        convert -size ${size}x${size} xc:"#6366F1" \
            \( "$SOURCE_SVG" -resize ${icon_size}x${icon_size} \) \
            -gravity center -composite \
            "$output"
    else
        echo "  → $output (${size}x${size})"
        convert "$SOURCE_SVG" -resize ${size}x${size} "$output"
    fi
}

# Generate standard icons
echo "📱 Generating standard icons..."
generate_icon 192 "$OUTPUT_DIR/icon-192.png" false
generate_icon 512 "$OUTPUT_DIR/icon-512.png" false

# Generate maskable icons (for Android adaptive icons)
echo "🎭 Generating maskable icons..."
generate_icon 192 "$OUTPUT_DIR/icon-maskable-192.png" true
generate_icon 512 "$OUTPUT_DIR/icon-maskable-512.png" true

# Generate shortcut icons
echo "🔗 Generating shortcut icons..."
generate_icon 96 "$OUTPUT_DIR/shortcut-create.png" false
generate_icon 96 "$OUTPUT_DIR/shortcut-events.png" false

# Generate badge icon
echo "🏷️ Generating badge icon..."
generate_icon 72 "$OUTPUT_DIR/badge.png" false

# Generate Apple Touch Icons
echo "🍎 Generating Apple Touch Icons..."
generate_icon 120 "$OUTPUT_DIR/apple-touch-icon-120x120.png" false
generate_icon 152 "$OUTPUT_DIR/apple-touch-icon-152x152.png" false
generate_icon 167 "$OUTPUT_DIR/apple-touch-icon-167x167.png" false
generate_icon 180 "$OUTPUT_DIR/apple-touch-icon-180x180.png" false

# Generate favicon sizes
echo "🌐 Generating favicon sizes..."
generate_icon 16 "$OUTPUT_DIR/favicon-16x16.png" false
generate_icon 32 "$OUTPUT_DIR/favicon-32x32.png" false
generate_icon 48 "$OUTPUT_DIR/favicon-48x48.png" false

# Create favicon.ico (multi-size)
echo "💠 Creating favicon.ico..."
convert "$OUTPUT_DIR/favicon-16x16.png" \
        "$OUTPUT_DIR/favicon-32x32.png" \
        "$OUTPUT_DIR/favicon-48x48.png" \
        "public/favicon.ico"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "📊 Generated files:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the icons in $OUTPUT_DIR"
echo "   2. Update manifest.json with correct icon paths"
echo "   3. Test the PWA installation"
echo "   4. Run 'npm run build' to bundle with Vite"
