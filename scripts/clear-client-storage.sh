#!/bin/bash

# ============================================================================
# Client-Side Storage Cleanup Script
# ============================================================================
# Purpose: Clear all client-side authentication and app data
# Use Case: Force fresh start after clearing server-side sessions
# Date: November 2, 2025
# ============================================================================

set -e  # Exit on error

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PartyHause - Client Storage Cleanup Script        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# SECTION 1: Web Browser Storage
# ============================================================================

echo -e "${YELLOW}📦 Section 1: Web Browser Storage${NC}"
echo "This will clear browser data for localhost development"
echo ""

clear_web_storage() {
    echo "To clear web browser storage manually:"
    echo ""
    echo "  Chrome/Edge:"
    echo "    1. Open DevTools (F12)"
    echo "    2. Application tab → Storage"
    echo "    3. Click 'Clear site data'"
    echo ""
    echo "  Firefox:"
    echo "    1. Open DevTools (F12)"
    echo "    2. Storage tab"
    echo "    3. Right-click each item → Delete All"
    echo ""
    echo "  Safari:"
    echo "    1. Develop → Show Web Inspector"
    echo "    2. Storage tab"
    echo "    3. Clear all items"
    echo ""
    
    # Provide automated browser clearing (if browser is installed)
    if command -v osascript &> /dev/null; then
        echo -e "${GREEN}Detected macOS - Can automate some browsers${NC}"
        echo ""
        read -p "Clear Safari browsing data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Clearing Safari cache..."
            osascript -e 'tell application "Safari" to quit'
            rm -rf ~/Library/Caches/com.apple.Safari/*
            rm -rf ~/Library/Safari/LocalStorage/*
            echo -e "${GREEN}✓ Safari cache cleared${NC}"
        fi
    fi
    
    # Chrome/Edge paths
    if [ -d "$HOME/Library/Application Support/Google/Chrome" ]; then
        echo ""
        read -p "Clear Chrome localStorage? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Closing Chrome..."
            pkill -x "Google Chrome" 2>/dev/null || true
            sleep 1
            
            # Clear localhost storage only
            if [ -d "$HOME/Library/Application Support/Google/Chrome/Default/Local Storage" ]; then
                find "$HOME/Library/Application Support/Google/Chrome/Default/Local Storage" \
                    -name "*localhost*" -delete 2>/dev/null || true
                echo -e "${GREEN}✓ Chrome localhost storage cleared${NC}"
            fi
        fi
    fi
}

clear_web_storage

# ============================================================================
# SECTION 2: Mobile App (Expo) Storage
# ============================================================================

echo ""
echo -e "${YELLOW}📱 Section 2: Mobile App Storage${NC}"
echo ""

clear_expo_storage() {
    MOBILE_DIR="apps/mobile"
    
    if [ ! -d "$MOBILE_DIR" ]; then
        echo -e "${RED}✗ Mobile directory not found${NC}"
        return 1
    fi
    
    echo "Clearing Expo cache..."
    
    # Clear Expo cache
    if [ -d "$MOBILE_DIR/.expo" ]; then
        rm -rf "$MOBILE_DIR/.expo"
        echo -e "${GREEN}✓ Cleared .expo cache${NC}"
    fi
    
    # Clear Metro bundler cache
    if [ -d "$MOBILE_DIR/node_modules/.cache" ]; then
        rm -rf "$MOBILE_DIR/node_modules/.cache"
        echo -e "${GREEN}✓ Cleared Metro cache${NC}"
    fi
    
    # Clear watchman (if installed)
    if command -v watchman &> /dev/null; then
        echo "Clearing watchman cache..."
        watchman watch-del-all 2>/dev/null || true
        echo -e "${GREEN}✓ Cleared watchman cache${NC}"
    fi
    
    echo ""
    echo "To clear app data on device:"
    echo ""
    echo "  iOS (Expo Go):"
    echo "    1. Long-press Expo Go app"
    echo "    2. Remove App → Delete"
    echo "    3. Reinstall from App Store"
    echo "    4. Scan QR code again"
    echo ""
    echo "  Android (Expo Go):"
    echo "    1. Settings → Apps → Expo Go"
    echo "    2. Storage → Clear Data"
    echo "    3. Or uninstall and reinstall"
    echo ""
}

clear_expo_storage

# ============================================================================
# SECTION 3: Development Environment
# ============================================================================

echo ""
echo -e "${YELLOW}🔧 Section 3: Development Environment${NC}"
echo ""

clear_dev_environment() {
    # Clear Next.js cache (if using Next.js)
    if [ -d ".next" ]; then
        rm -rf .next
        echo -e "${GREEN}✓ Cleared Next.js cache${NC}"
    fi
    
    # Clear Vite cache
    if [ -d "node_modules/.vite" ]; then
        rm -rf node_modules/.vite
        echo -e "${GREEN}✓ Cleared Vite cache${NC}"
    fi
    
    # Clear TypeScript cache
    if [ -f "tsconfig.tsbuildinfo" ]; then
        rm tsconfig.tsbuildinfo
        echo -e "${GREEN}✓ Cleared TypeScript cache${NC}"
    fi
    
    # Clear dist/build folders
    if [ -d "dist" ]; then
        echo "Found dist/ folder"
        read -p "Clear build output (dist/)? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf dist
            echo -e "${GREEN}✓ Cleared dist/${NC}"
        fi
    fi
}

clear_dev_environment

# ============================================================================
# SECTION 4: Supabase Local Storage Keys
# ============================================================================

echo ""
echo -e "${YELLOW}🔑 Section 4: Supabase Storage Keys${NC}"
echo ""

echo "Common Supabase localStorage keys to clear:"
echo "  - sb-<project-ref>-auth-token"
echo "  - supabase.auth.token"
echo "  - supabase.auth.session"
echo ""
echo "These are automatically cleared when you clear localStorage"
echo "in your browser's DevTools (Section 1)"

# ============================================================================
# SECTION 5: Verification
# ============================================================================

echo ""
echo -e "${YELLOW}✅ Section 5: Verification${NC}"
echo ""

echo "After running this script:"
echo ""
echo "  1. ✓ Expo cache cleared"
echo "  2. ✓ Metro bundler cache cleared"
echo "  3. ✓ Build caches cleared"
echo ""
echo "  Manual steps remaining:"
echo "  • Clear browser DevTools → Application → Storage"
echo "  • Uninstall/reinstall Expo Go app on mobile"
echo "  • Run: npx expo start --clear"
echo ""

# ============================================================================
# SECTION 6: Auto-restart Development Servers
# ============================================================================

echo ""
echo -e "${YELLOW}🔄 Section 6: Restart Development${NC}"
echo ""

read -p "Restart Expo with cleared cache? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Expo with cleared cache..."
    cd apps/mobile
    npx expo start --clear --tunnel &
    echo -e "${GREEN}✓ Expo started with cleared cache${NC}"
    echo "Scan the QR code to test fresh login"
fi

# ============================================================================
# COMPLETION
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Client Storage Cleanup Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Run the SQL cleanup script in Supabase Dashboard"
echo "  2. Clear browser storage (DevTools → Application)"
echo "  3. Reinstall Expo Go app on mobile devices"
echo "  4. Test fresh login flow"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  • SQL Script: scripts/cleanup-user-sessions.sql"
echo "  • This script: scripts/clear-client-storage.sh"
echo ""
