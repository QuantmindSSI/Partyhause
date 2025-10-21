# Mobile App Testing Guide

**Branch**: `feature/mobile-expo`  
**Last Push**: October 21, 2025  
**Status**: ✅ Ready for Testing

## 🎉 What's New

The mobile app has been successfully pushed to GitHub and is ready for testing! This includes:

- ✅ Complete React Native mobile app (Expo SDK 54)
- ✅ Email invitation system with MailerSend integration
- ✅ Event templates system with 5 production templates
- ✅ Network-tested email delivery
- ✅ Guest management with check-in functionality

## 📱 Quick Start - Testing on Your Device

### Prerequisites
```bash
npm install -g expo-cli eas-cli
```

### Step 1: Navigate to Mobile App
```bash
cd apps/mobile
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create .env File
Create `apps/mobile/.env` with:
```env
EXPO_PUBLIC_SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Start Development Server
```bash
npx expo start
```

### Step 5: Test on Device

#### Option A: Expo Go App (Easiest)
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan QR code from terminal with your phone
3. App will load automatically

#### Option B: iOS Simulator (Mac Only)
```bash
npx expo start --ios
```

#### Option C: Android Emulator
```bash
npx expo start --android
```

## 🧪 Testing Checklist

### Landing Screen
- [ ] Video background plays smoothly
- [ ] "Get Started" button navigates to auth
- [ ] Animations work correctly
- [ ] UI looks good on your device

### Authentication
- [ ] Sign up with new account works
- [ ] Login with existing account works
- [ ] Error messages display correctly
- [ ] "Back" button returns to landing

### Dashboard
- [ ] Events list loads correctly
- [ ] "Create Event" button works
- [ ] Event cards display properly
- [ ] Pull to refresh works

### Event Details
- [ ] Event information displays
- [ ] "Manage Guests" button navigates correctly
- [ ] "Check-in Mode" toggle works
- [ ] Back navigation works

### Guest Management (⭐ Main Feature)
- [ ] Guest list displays correctly
- [ ] Add guest modal opens
- [ ] Can enter guest name and email
- [ ] **Email toggle** is present
- [ ] Adding guest with email ON sends invitation
- [ ] Success message shows after adding guest
- [ ] Guest appears in list immediately
- [ ] Check-in toggle works
- [ ] Delete guest works

### Email Invitations (🎯 Critical Test)
1. **Start Email Server** (on your development machine):
   ```bash
   # In project root
   npm run server
   ```

2. **Ensure Same WiFi Network**:
   - Your phone and dev machine must be on same WiFi
   - Email server runs on: `http://192.168.56.1:3001` (or your machine's IP)

3. **Add Guest with Email Enabled**:
   - Enter guest name: "Test User"
   - Enter guest email: your_test_email@gmail.com
   - Toggle "Send Invitation Email" ON
   - Click "Add Guest"

4. **Verify Email Sent**:
   - Check success message on mobile app
   - Check your email inbox
   - Email should have party theme 🎉
   - Should include event details and RSVP button

## 🌐 Network Configuration

### For iOS Simulator
Email API: `http://192.168.56.1:3001/api/send-email`

### For Android Emulator
Email API: `http://10.0.2.2:3001/api/send-email`

### For Physical Devices
Email API: `http://192.168.56.1:3001/api/send-email` (Ethernet)  
or `http://172.20.10.8:3001/api/send-email` (WiFi)

**Note**: Check your machine's IP with:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Update in `apps/mobile/lib/email.ts` if needed.

## 🐛 Common Issues & Fixes

### Issue: "Could not connect to development server"
**Fix**: 
1. Ensure development server is running (`npx expo start`)
2. Phone and computer on same WiFi network
3. Try running: `npx expo start --tunnel`

### Issue: "Email sending failed"
**Fix**:
1. Email server must be running: `npm run server`
2. Check server is accessible: Visit `http://localhost:3001/api/health`
3. Verify network IP in `apps/mobile/lib/email.ts`
4. Ensure on same WiFi network

### Issue: "Supabase authentication error"
**Fix**:
1. Check `.env` file exists in `apps/mobile/`
2. Verify Supabase URL and anon key are correct
3. Restart Expo dev server

### Issue: "Module not found" errors
**Fix**:
```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### Issue: App crashes on launch
**Fix**:
1. Check Expo Go app is updated
2. Clear Expo cache: `npx expo start --clear`
3. Restart phone
4. Try development build instead of Expo Go

## 📊 Test Results Expected

### Email Delivery Test
When adding a guest with email enabled:

1. ✅ Success alert appears on mobile
2. ✅ Guest added to list immediately
3. ✅ Email log created in database (status: 'sent')
4. ✅ Email received in inbox within 1-2 minutes
5. ✅ Email has beautiful HTML template
6. ✅ Email includes event details and RSVP link

### Network Connectivity
According to test results:
- ✅ localhost (127.0.0.1:3001) - Works
- ✅ Ethernet (192.168.56.1:3001) - Works
- ✅ WiFi (172.20.10.8:3001) - Works
- ⏸️ Android Emulator (10.0.2.2:3001) - Requires running emulator

## 🚀 Building for Production

### Option 1: Expo Build (Cloud)
```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

### Option 2: Local Build
```bash
# iOS (Mac only)
eas build --platform ios --local

# Android
eas build --platform android --local
```

### Option 3: Development Build
```bash
# Create development build
npx expo run:ios
# or
npx expo run:android
```

## 📚 Additional Resources

### Documentation Files
- `MOBILE_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `MOBILE_EMAIL_STATUS.md` - Email system configuration
- `MOBILE_INVITE_TEST_RESULTS.md` - Automated test results
- `PRODUCTION_DEPLOYMENT.md` - Production deployment guide

### Test Scripts
- `scripts/test-mobile-invite.js` - Automated mobile invite testing
- `scripts/test-mobile-email-config.js` - Network configuration testing
- `scripts/test-mailersend.js` - Email delivery testing

### Key Files to Review
- `apps/mobile/components/screens/GuestManagementScreen.tsx` - Main guest UI
- `apps/mobile/lib/email.ts` - Email service implementation
- `apps/mobile/lib/supabase.ts` - Supabase client setup
- `server/index.js` - Local email server

## 💡 Pro Tips

1. **Use Physical Device**: Best experience, test real-world scenarios
2. **Enable Debug Mode**: Shake device → Enable "Debug Remote JS"
3. **Check Console Logs**: Watch Metro bundler terminal for errors
4. **Test Network**: Use `scripts/test-mobile-email-config.js` to verify connectivity
5. **MailerSend Dashboard**: Monitor emails at https://app.mailersend.com/activity

## 🎯 Success Criteria

The mobile app is working correctly if:

✅ App loads without crashes  
✅ Can sign up and log in  
✅ Can create events  
✅ Can add guests  
✅ Can send email invitations  
✅ Emails are delivered successfully  
✅ Guest check-in toggle works  
✅ UI is responsive and smooth  

## 📞 Support

If you encounter issues:

1. Check error logs in Metro bundler terminal
2. Review `MOBILE_EMAIL_STATUS.md` for email troubleshooting
3. Run automated tests: `node scripts/test-mobile-invite.js`
4. Check MailerSend dashboard for email delivery status
5. Verify Supabase connection in app logs

---

**Ready to Test!** 🚀

Start with: `cd apps/mobile && npx expo start`

Then scan QR code with Expo Go app on your phone!
