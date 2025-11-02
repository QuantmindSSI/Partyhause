#!/bin/bash
# Set Netlify environment variables for PartyCrew deployment
# Run this script to configure all required environment variables

echo "🔧 Setting Netlify environment variables for PartyCrew..."

# Read from apps/mobile/.env
if [ -f "apps/mobile/.env" ]; then
  source apps/mobile/.env
fi

# Set Supabase environment variables
if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "Setting SUPABASE_URL..."
  npx netlify env:set NEXT_PUBLIC_SUPABASE_URL "$EXPO_PUBLIC_SUPABASE_URL"
  npx netlify env:set EXPO_PUBLIC_SUPABASE_URL "$EXPO_PUBLIC_SUPABASE_URL"
fi

if [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Setting SUPABASE_ANON_KEY..."
  npx netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
fi

# Set service role key (need to get from user or Supabase dashboard)
echo ""
echo "⚠️  Please set SUPABASE_SERVICE_ROLE_KEY manually:"
echo "   npx netlify env:set SUPABASE_SERVICE_ROLE_KEY <your-service-role-key>"
echo ""
echo "⚠️  Please set MAILERSEND_API_TOKEN manually:"
echo "   npx netlify env:set MAILERSEND_API_TOKEN <your-mailersend-token>"
echo ""
echo "⚠️  Please set MAILERSEND_FROM_EMAIL manually:"
echo "   npx netlify env:set MAILERSEND_FROM_EMAIL <your-from-email>"
echo ""

echo "✅ Basic environment variables set!"
echo "📝 Don't forget to set the manual variables above before deploying."