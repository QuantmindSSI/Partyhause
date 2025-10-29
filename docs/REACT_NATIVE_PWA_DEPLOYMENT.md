# React Native PWA Deployment Guide

This guide explains how to deploy the React Native (Expo) app as a Progressive Web App (PWA) for PartyHause.

## 🎯 Overview

The React Native mobile app can be deployed as a fully functional PWA that works on web browsers while maintaining the same codebase as the native mobile apps.

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Expo CLI (installed automatically)
- Vercel CLI (for deployment): `npm install -g vercel`

## 🛠️ Build Process

### Quick Build

```bash
npm run build
```

This will:
1. Prepare PWA icons
2. Build the Expo web app
3. Export static files to `dist/`
4. Copy PWA assets (manifest, service worker, icons)

### Manual Build Steps

If you need more control:

```bash
# 1. Prepare icons
bash ./scripts/prepare-mobile-icons.sh

# 2. Build mobile app
cd apps/mobile
npx expo export --platform web --output-dir ../../dist

# 3. Copy PWA assets
bash ../../scripts/build-mobile-pwa.sh
```

## 📱 PWA Features

The deployed PWA includes:

### ✅ Installability
- Can be installed on any device (iOS, Android, Desktop)
- Home screen icon with app metadata
- Splash screen on launch

### ✅ Offline Support
- Service worker for offline caching
- Network-first for API calls
- Cache-first for static assets
- Supabase requests always use network

### ✅ Native-like Experience
- Standalone display mode (no browser UI)
- Portrait orientation
- Theme color matching app design
- Smooth navigation with Expo Router

### ✅ Cross-Platform
- Works on web browsers
- Shares codebase with iOS/Android apps
- Consistent UI/UX across platforms

## 🚀 Deployment

### Deploy to Vercel

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to production:**
   ```bash
   vercel --prod
   ```

3. **Verify deployment:**
   - Check that the site loads
   - Test PWA installation
   - Verify service worker registration
   - Test offline functionality

### Deploy to Other Platforms

The `dist/` directory contains a static site that can be deployed to:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## 🧪 Testing

### Local Testing

```bash
# Install serve if you don't have it
npm install -g serve

# Serve the dist directory
serve dist

# Visit http://localhost:3000
```

### Test PWA Features

1. **Installation:**
   - Open Chrome DevTools > Application > Manifest
   - Check that manifest is loaded
   - Click "Install" button in address bar

2. **Service Worker:**
   - Open Chrome DevTools > Application > Service Workers
   - Verify service worker is registered and active
   - Test offline mode by checking "Offline" checkbox

3. **Caching:**
   - Open Chrome DevTools > Application > Cache Storage
   - Verify `partyhause-mobile-v1` cache exists
   - Check cached assets

## 📁 Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
├── assets/                 # App assets (icons, images)
├── lib/                    # Utilities (supabase, storage)
├── public/                 # PWA assets
│   ├── index.html         # Custom HTML with PWA meta tags
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── *.png              # PWA icons
├── app.config.ts          # Expo configuration
└── package.json

scripts/
├── prepare-mobile-icons.sh    # Copy/generate PWA icons
├── build-mobile-pwa.sh        # Quick build script
└── deploy-mobile-pwa.sh       # Full deployment script

dist/                          # Build output (generated)
```

## 🔧 Configuration Files

### vercel.json
- Already configured to serve from `dist/`
- Service worker headers set correctly
- Manifest MIME type configured
- API routes preserved

### apps/mobile/app.config.ts
- Web output set to "static"
- Metro bundler configured
- PWA metadata included

### apps/mobile/public/manifest.json
- App name and description
- Theme colors
- Icons for all sizes
- Shortcuts for quick actions
- Display mode: standalone

## 🐛 Troubleshooting

### Build fails with "window is not defined"
✅ Fixed: Supabase client now uses lazy initialization to avoid SSR issues

### Service worker not registering
- Check that `sw.js` is in the dist root
- Verify service worker headers in vercel.json
- Check browser console for errors

### Icons not showing
- Run `bash scripts/prepare-mobile-icons.sh`
- Check that icons are copied to `dist/`
- Verify manifest.json icon paths

### AsyncStorage errors on web
✅ Fixed: Custom storage adapter uses localStorage on web

## 📊 Performance

The PWA build is optimized for performance:
- Code splitting with Expo Router
- Static rendering for all routes
- Lazy loading of components
- Service worker caching
- React Compiler enabled

## 🔄 Updates

When you update the app:

1. Increment version in `apps/mobile/package.json`
2. Update cache name in `public/sw.js` (e.g., `partyhause-mobile-v2`)
3. Rebuild and deploy: `npm run build && vercel --prod`
4. Users will get the update automatically on next visit

## 🎨 Customization

### Change Theme Color
Edit `apps/mobile/public/manifest.json`:
```json
{
  "theme_color": "#6366F1",
  "background_color": "#FFFFFF"
}
```

### Update App Name
Edit `apps/mobile/app.config.ts`:
```typescript
{
  name: "PartyHause",
  description: "Your custom description"
}
```

### Add Shortcuts
Edit `apps/mobile/public/manifest.json`:
```json
{
  "shortcuts": [
    {
      "name": "Create Event",
      "url": "/events/new",
      "icons": [...]
    }
  ]
}
```

## 📚 Resources

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🆘 Support

If you encounter issues:
1. Check the build output for errors
2. Review the troubleshooting section
3. Test locally with `serve dist`
4. Check browser console for errors
5. Verify environment variables are set

## ✅ Checklist

- [x] PWA manifest configured
- [x] Service worker implemented
- [x] Icons prepared for all sizes
- [x] Build script created
- [x] Vercel configuration updated
- [x] SSR issues fixed (window, AsyncStorage)
- [x] Storage adapter for web platform
- [x] Lazy Supabase initialization
- [ ] Deploy to production
- [ ] Test PWA installation
- [ ] Verify offline functionality

---

Built with ❤️ using Expo and React Native
