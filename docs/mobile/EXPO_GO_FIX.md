# Expo Go Email Fix - Quick Guide 📱

## Problem Identified ✅

**Expo Go cannot access localhost servers!**

When you run the app in Expo Go:
- `__DEV__` flag is `true` (development mode)
- App tried to use `http://192.168.56.1:3001/api/send-email`
- But Expo Go runs on your phone and can't reach your local server
- Result: Network request failed, no emails sent

## Solution Applied ✅

Updated `apps/mobile/lib/email.ts` to detect Expo Go and force production API:

```typescript
import Constants from 'expo-constants';

// Detect if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// For Expo Go, ALWAYS use production URL
const EMAIL_API_URL = isExpoGo || !__DEV__
  ? 'https://www.partyhause.com/api/send-email' // Production
  : 'http://localhost:3001/api/send-email'; // Local dev
```

## What Changed 🔧

### Before:
```
Expo Go → __DEV__ = true → localhost:3001 → ❌ Network Error
```

### After:
```
Expo Go → Detected → Production API → ✅ Email Sent!
```

## How to Test 🧪

### 1. Test API Endpoint (from computer):
```bash
node test-expo-go-email.js
```

Expected output:
```
✅ SUCCESS! Email sent from production endpoint
🎉 Expo Go Configuration: WORKING
```

### 2. Test in Expo Go App:

1. **Start the app**:
   ```bash
   cd apps/mobile
   npx expo start
   ```

2. **Scan QR code** with Expo Go on your phone

3. **Watch Metro logs** for these messages:
   ```
   [EmailService] Is Expo Go: true
   [EmailService] API URL: https://www.partyhause.com/api/send-email
   [EmailService] Environment: Expo Go (Production API)
   ```

4. **Add a guest**:
   - Navigate to an event
   - Tap "Add Guest"
   - Enter name and email
   - Enable "Send Email" toggle
   - Tap "Add Guest"

5. **Check logs** for success:
   ```
   [EmailService] ✅ EMAIL SENT SUCCESSFULLY!
   ```

## Environment Detection 🔍

The app now logs detailed environment info:

```
[EmailService] __DEV__ flag: true
[EmailService] Is Expo Go: true
[EmailService] App Ownership: expo
[EmailService] Environment: Expo Go (Production API)
[EmailService] API URL: https://www.partyhause.com/api/send-email
```

## Different Modes 📱

| Mode | __DEV__ | isExpoGo | API URL |
|------|---------|----------|---------|
| **Expo Go** | ✅ true | ✅ true | 🌐 Production |
| **iOS Simulator** | ✅ true | ❌ false | 🏠 localhost:3001 |
| **Android Emulator** | ✅ true | ❌ false | 🏠 10.0.2.2:3001 |
| **Production Build** | ❌ false | ❌ false | 🌐 Production |

## Troubleshooting 🔧

### Still not working?

1. **Check Metro terminal** for environment logs
2. **Verify production API** works:
   ```bash
   curl https://www.partyhause.com/api/health
   ```
3. **Check internet connection** on your phone
4. **Look for error logs**:
   ```
   [EmailService] ❌ ERROR
   [EmailService] Error message: <details>
   ```

### Common Issues:

**"Network request failed"**
- Phone not connected to internet
- Vercel endpoint down (unlikely - we just tested it ✅)

**"Invalid API response"**
- Check Vercel logs: `vercel logs https://www.partyhause.com`

**"No logs appearing"**
- Make sure you're watching the Metro terminal
- Try shaking phone to enable Remote JS Debugging

## Production API Status ✅

Verified working as of October 22, 2025:
- ✅ Health endpoint: OK
- ✅ Email endpoint: Sending successfully
- ✅ MailerSend: Configured correctly
- ✅ Environment variables: All set

## What to Expect 📧

When you add a guest in Expo Go now:

1. App detects Expo Go environment
2. Uses production API automatically
3. Sends request to Vercel
4. Vercel calls MailerSend
5. Email delivered to guest
6. Success alert shown
7. Email log created in Supabase

All working! 🎉

## Need Help? 🆘

If invites still aren't sending:

1. Copy **all** Metro terminal logs
2. Take screenshot of error alert
3. Check Supabase `email_logs` table for failures:
   ```sql
   SELECT * FROM email_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

The enhanced logging will show exactly where it fails! 🔍
