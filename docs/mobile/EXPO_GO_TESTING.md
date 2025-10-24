# Testing on Expo Go - Quick Guide

## 🚀 Changes Ready for Testing

All new features are now available in the Expo development server!

## 📱 How to Test on Expo Go

### Step 1: Make Sure Expo Server is Running
The development server is already running with tunnel mode:
```bash
npm run start --workspace apps/mobile -- --tunnel
```

### Step 2: Open Expo Go on Your Phone
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store

### Step 3: Scan the QR Code
1. Look at the terminal running `npm run start`
2. You'll see a QR code in the terminal
3. **iOS**: Open Camera app and scan the QR code
4. **Android**: Open Expo Go app and tap "Scan QR Code"

### Step 4: Wait for Bundle to Load
- First load may take 30-60 seconds
- Subsequent reloads are faster
- Changes auto-refresh when you save files

## ✅ New Features Available for Testing

### 1. Dashboard with Create Button
- **Floating Action Button (FAB)**: Purple circle with "+" in bottom-right
- **Empty State Button**: "Create Your First Event" when no events
- Test: Tap the FAB or empty state button

### 2. Enhanced Template Selection
- **11 Event Templates** with icons and descriptions
- Color-coded cards in 2-column grid
- Test: Scroll through templates, tap to select

### 3. Event Basics Screen
- Title, description, dates, location inputs
- Date/time pickers
- Test: Fill out event details, tap Continue

### 4. Guest Import Screen
- Manual guest entry
- Import from device contacts
- CSV import option
- Test: Add guests, tap Continue

### 5. Timeline Builder
- 6 block types (Activity, Meal, Speech, etc.)
- Time and duration controls
- Guest visibility toggle
- Test: Add timeline blocks, tap Continue

### 6. Review & Publish Screen
- Event summary
- Guest and timeline stats
- Save draft or publish
- Test: Review details, tap Publish

## 🧪 Testing Checklist

### Dashboard Tests
- [ ] Dashboard loads with user info
- [ ] FAB appears (if events exist)
- [ ] Empty state appears (if no events)
- [ ] Tapping FAB navigates to template selection
- [ ] Tapping empty state button navigates to template selection

### Template Selection Tests
- [ ] All 11 templates display
- [ ] Icons and colors render correctly
- [ ] Cards are responsive (2 columns)
- [ ] Tapping template navigates to basics screen
- [ ] Template name visible in next screen

### Event Creation Flow Tests
- [ ] All inputs work on basics screen
- [ ] Date picker opens and works
- [ ] Can add guests manually
- [ ] Can import from contacts (requires permission)
- [ ] Can add timeline blocks
- [ ] Can change block type and duration
- [ ] Review screen shows all details
- [ ] Publish creates event (requires auth)

### Navigation Tests
- [ ] Back button works on all screens
- [ ] Progress indicator updates
- [ ] Data persists between screens
- [ ] Can navigate back and forth without losing data

## 🔧 Troubleshooting

### QR Code Not Scanning
- Ensure phone and computer are on same network
- Try closing and reopening Expo Go
- Check if firewall is blocking connection

### App Not Loading
- Wait 60 seconds for first load
- Check terminal for errors
- Restart Expo server: `r` in terminal

### Changes Not Appearing
- Save all files in VS Code
- Reload app: Shake phone → "Reload"
- Or press `r` in terminal

### Permission Errors (Contacts)
- iOS: Settings → Expo Go → Allow Contacts
- Android: App permissions → Allow Contacts

### Network Issues
- Ensure tunnel is working (should see `exp://` URL)
- Try switching between WiFi networks
- Restart router if needed

## 📊 What to Look For

### UI/UX
- Smooth animations
- Proper spacing and alignment
- Readable text at all sizes
- Touch targets are easy to tap (minimum 44x44px)

### Functionality
- All buttons respond to taps
- Forms validate input
- Error messages display correctly
- Loading states show appropriately

### Performance
- App responds quickly
- No lag when scrolling
- Smooth transitions between screens

## 🐛 Reporting Issues

If you find bugs, note:
1. **Screen where it occurred**
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Phone model and OS version**

## 🔄 Hot Reload

The app will automatically reload when you save changes to:
- `.tsx` files
- `.ts` files
- Styles

No need to restart Expo server for most changes!

## 📱 Device Requirements

- **iOS**: iOS 13.0 or later
- **Android**: Android 5.0 (API 21) or later
- **Expo Go**: Latest version recommended

## 🎯 Focus Testing Areas

1. **Create Event Flow**: Test complete wizard from start to finish
2. **Template Selection**: Verify all templates look good
3. **Guest Import**: Test contacts permission and import
4. **Navigation**: Test back/forward navigation
5. **Form Validation**: Try submitting with empty fields

---

## Quick Commands

**Reload App**: Shake phone → Reload
**Open Dev Menu**: Shake phone
**Clear Cache**: Dev Menu → Clear bundler cache
**Restart Server**: Press `r` in terminal

Enjoy testing! 🎉
