# PWA Testing Guide

This guide will help you test the Progressive Web App (PWA) functionality of PartyHause.

## 🎯 What's Been Implemented

### Phase 1: PWA Configuration ✅
- **Manifest**: `public/manifest.json` with app metadata, icons, and branding
- **Service Worker**: `public/sw.js` for offline caching and background sync
- **Vite Plugin**: PWA build integration with Workbox for advanced caching
- **Install Prompt**: Smart install banner for all platforms (iOS, Android, Desktop)
- **Meta Tags**: Complete PWA meta tags in `index.html`

### Key Features
- ✅ Installable on all platforms (iOS, Android, Desktop)
- ✅ Offline support with intelligent caching
- ✅ Network-first strategy for API calls
- ✅ Cache-first for static assets
- ✅ Background sync capability
- ✅ Push notification support
- ✅ Standalone app experience
- ✅ Fast loading with code splitting

## 📱 Testing on Different Platforms

### iOS (Safari)
1. **Open Safari** on your iPhone/iPad
2. Navigate to your app URL (e.g., `https://partyhause.com` or local dev URL)
3. You'll see an install prompt banner at the bottom
4. Alternatively:
   - Tap the **Share button** (square with arrow pointing up)
   - Scroll down and tap **"Add to Home Screen"**
   - Customize the name if desired
   - Tap **"Add"**
5. The app icon will appear on your home screen
6. Tap to launch as a standalone app

**iOS Notes:**
- iOS requires HTTPS (or localhost for testing)
- The app will run in standalone mode without Safari UI
- You can check the manifest by visiting `/manifest.json`

### Android (Chrome)
1. **Open Chrome** on your Android device
2. Navigate to your app URL
3. You'll see:
   - An **install prompt banner** at the bottom of the screen
   - Or a prompt from Chrome asking to install
4. Tap **"Install App"** on the banner
5. Or use the Chrome menu:
   - Tap the **three dots** (⋮) menu
   - Select **"Add to Home screen"** or **"Install app"**
6. The app will be installed and can be launched from your app drawer

**Android Notes:**
- Chrome will automatically show install prompts
- The app appears in the app drawer and launcher
- Can be uninstalled like any other app

### Desktop (Chrome, Edge, Brave)
1. **Open Chrome/Edge/Brave** on your computer
2. Navigate to your app URL
3. Look for the **install icon** in the address bar (⊕ or 🖥️)
4. Click the icon or use:
   - Chrome menu → **"Install PartyHause"**
5. The app will open in its own window
6. You can find it in:
   - **Windows**: Start Menu
   - **macOS**: Applications folder / Launchpad
   - **Linux**: Application menu

**Desktop Notes:**
- App runs in a standalone window (no browser UI)
- Can be pinned to taskbar/dock
- Separate from browser tabs

## 🧪 Testing Checklist

### Installation Testing
- [ ] iOS: Install prompt appears
- [ ] iOS: Manual install via Share → Add to Home Screen works
- [ ] Android: Automatic install prompt appears
- [ ] Android: Install via Chrome menu works
- [ ] Desktop: Install icon appears in address bar
- [ ] Desktop: Manual install via browser menu works
- [ ] App icon displays correctly on home screen/launcher
- [ ] App name appears correctly

### Functionality Testing
- [ ] App launches in standalone mode (no browser UI)
- [ ] Navigation works without browser back button
- [ ] Authentication persists after closing/reopening
- [ ] Events data loads correctly
- [ ] Create new event works offline (with sync when online)
- [ ] Guest management works
- [ ] QR code scanning works
- [ ] Images load and are cached

### Offline Testing
1. **Go offline**:
   - iOS: Enable Airplane Mode
   - Android: Enable Airplane Mode
   - Desktop: Chrome DevTools → Network → Offline
2. **Test features**:
   - [ ] App loads (from cache)
   - [ ] Previously viewed pages load
   - [ ] Static content displays
   - [ ] Appropriate offline message for data that needs network
3. **Go back online**:
   - [ ] Data syncs automatically
   - [ ] New content loads
   - [ ] Cache updates

### Performance Testing
- [ ] First load is fast (<3 seconds)
- [ ] Subsequent loads are instant (cached)
- [ ] Images load progressively
- [ ] No flash of unstyled content
- [ ] Smooth animations and transitions
- [ ] No layout shifts

### Update Testing
1. **Deploy a new version**
2. **Test update flow**:
   - [ ] Service worker detects update
   - [ ] User is notified (if implemented)
   - [ ] App reloads with new version
   - [ ] Old cache is cleaned up

## 🛠️ Developer Testing Tools

### Chrome DevTools
1. **Open DevTools** (F12 or Cmd+Option+I)
2. **Application Tab**:
   - **Manifest**: View parsed manifest.json
   - **Service Workers**: Check registration status
   - **Cache Storage**: Inspect cached resources
   - **Clear Storage**: Reset PWA state

### Lighthouse Audit
1. Open DevTools → **Lighthouse** tab
2. Select **Progressive Web App** category
3. Click **Generate report**
4. Review scores and recommendations

**Target Scores:**
- Performance: >90
- Best Practices: >90
- Accessibility: >90
- PWA: 100

### Service Worker Debugging
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered:', registrations);
});

// Check if app is installed
window.matchMedia('(display-mode: standalone)').matches;

// Force update service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations[0].update();
});
```

## 🐛 Common Issues & Solutions

### Issue: Install prompt doesn't appear
**Solutions:**
- Ensure you're using HTTPS (or localhost)
- Check manifest.json is valid
- Verify service worker is registered
- Clear browser cache and reload
- Check Chrome flags: `chrome://flags/#enable-web-app-install-banner`

### Issue: Service worker not updating
**Solutions:**
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear site data in DevTools → Application → Clear storage
- Check for service worker errors in Console
- Ensure `skipWaiting()` is called in service worker

### Issue: App not working offline
**Solutions:**
- Check cache storage in DevTools
- Verify service worker fetch event is handling requests
- Check network requests in DevTools → Network tab
- Ensure resources are being cached correctly

### Issue: iOS not showing add to home screen
**Solutions:**
- Must use Safari (not Chrome/Firefox on iOS)
- Ensure manifest has correct icons
- Check apple-mobile-web-app meta tags
- Verify HTTPS or localhost

### Issue: Icons not displaying
**Solutions:**
- Check icon paths in manifest.json
- Ensure icons are in `/public/icons/` directory
- Verify icon sizes and formats (PNG, SVG)
- Use maskable icons for Android

## 📊 Testing Metrics

### Key Performance Indicators
- **Time to Interactive**: <3s on 3G
- **First Contentful Paint**: <1.8s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **Service Worker Install**: <1s
- **Cache Hit Rate**: >90% after first load

### User Experience Metrics
- **Install Conversion Rate**: Track how many users install
- **Offline Usage**: Track offline session duration
- **Retention Rate**: Compare PWA vs web users
- **Engagement**: Time in app, features used

## 🚀 Development Testing

### Local Testing
```bash
# Start development server with PWA enabled
npm run dev

# Build for production testing
npm run build
npm run preview

# Test in different browsers
# Chrome: http://localhost:4173
# Safari: Open on iPhone connected to Mac
# Android: Use port forwarding or ngrok
```

### Production Testing
```bash
# Deploy to Vercel
vercel --prod

# Test on real devices
# iOS: https://partyhause.com
# Android: https://partyhause.com
# Desktop: https://partyhause.com

# Monitor with Lighthouse CI
npx @lhci/cli@latest autorun
```

## 📝 Testing Report Template

### Test Session: [Date]
**Tester**: [Name]
**Platform**: [iOS/Android/Desktop]
**Browser**: [Chrome/Safari/Edge]
**Device**: [Model/Version]

#### Installation
- [ ] Install prompt appeared: Yes/No
- [ ] Installation successful: Yes/No
- [ ] Icon appearance: Correct/Incorrect
- [ ] Launch time: [X seconds]

#### Functionality
- [ ] Authentication: Working/Broken
- [ ] Navigation: Smooth/Issues
- [ ] Event creation: Working/Broken
- [ ] Guest management: Working/Broken
- [ ] Offline mode: Working/Partial/Broken

#### Performance
- [ ] Load time (first visit): [X seconds]
- [ ] Load time (cached): [X seconds]
- [ ] Smooth animations: Yes/No
- [ ] Battery impact: Low/Medium/High

#### Issues Found
1. [Description]
2. [Description]

#### Overall Experience
[1-10 rating and comments]

## 🎓 Best Practices for PWA Testing

1. **Test on Real Devices**: Emulators don't fully replicate PWA behavior
2. **Test Different Network Conditions**: 3G, slow 3G, offline
3. **Test Update Flow**: Deploy changes and verify update process
4. **Test Across Browsers**: Each has unique PWA quirks
5. **Test with Different User States**: First-time, returning, installed
6. **Monitor in Production**: Use analytics to track PWA usage
7. **Collect User Feedback**: Ask installed users about their experience

## 📚 Additional Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://web.dev/add-manifest/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Testing PWAs](https://web.dev/testing-web-apps/)

## 🎉 Success Criteria

Your PWA is ready for users when:
- ✅ Passes all Lighthouse PWA criteria
- ✅ Installs successfully on all major platforms
- ✅ Works offline for core features
- ✅ Loads in <3 seconds on 3G
- ✅ No critical errors in console
- ✅ Updates automatically
- ✅ Provides native-like experience

---

**Next Steps**:
1. Generate icon assets (192x192, 512x512 PNG)
2. Test install flow on each platform
3. Configure push notifications (optional)
4. Set up analytics tracking
5. Monitor performance in production
