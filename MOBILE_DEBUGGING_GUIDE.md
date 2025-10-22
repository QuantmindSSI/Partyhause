# Mobile App Debugging Guide 🔍

## How to Debug Mobile Invite Issues

### 1. Enable Metro Bundler Logging

When running the app, watch the Metro terminal for console logs:

```bash
cd apps/mobile
npx expo start
```

Look for these log patterns:

#### Event Creation Logs:
```
[EventCreation] Creating event: { name, description, location... }
[EventCreation] Event created successfully: { id, name... }
[EventCreation] Error creating event: <error>
```

#### Guest Addition Logs:
```
[GuestManagement] Adding guest: { name, email, sendInvite }
[GuestManagement] Sending invitation email...
[GuestManagement] Email sent successfully
[GuestManagement] Email sending failed: <error>
[GuestManagement] Error adding guest: <error>
```

#### Email Service Logs:
```
[EmailService] Sending email to: <email>
[EmailService] API URL: <production or dev url>
[EmailService] Email sent successfully: { success, data }
[EmailService] API error: <error>
[EmailService] Failed to parse response: <response text>
[EmailService] Error sending email: <error>
```

### 2. Check React Native Debugger

#### Enable Debug Mode:
1. Shake your device (or Cmd+D on iOS Simulator / Cmd+M on Android Emulator)
2. Select "Debug JS Remotely"
3. Open Chrome DevTools at `http://localhost:8081/debugger-ui`
4. Watch Console tab for logs

#### Network Inspection:
1. Install React Native Debugger: https://github.com/jhen0409/react-native-debugger
2. Enable Network Inspect
3. Watch API calls to:
   - `https://www.partyhause.com/api/send-email` (Production)
   - `http://192.168.56.1:3001/api/send-email` (iOS Dev)
   - `http://10.0.2.2:3001/api/send-email` (Android Dev)

### 3. Test Email API Directly

#### From Command Line:
```bash
# Test production endpoint
node test-mobile-invite-system.js

# Test health endpoint
$body = @{ } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://www.partyhause.com/api/health' -Method GET
```

#### Expected Response:
```json
{
  "status": "ok",
  "message": "Email API server is running",
  "config": {
    "mailerSendConfigured": true,
    "hasToken": true,
    "hasFromEmail": true
  }
}
```

### 4. Check Supabase Database

#### Email Logs Table:
```sql
-- Check recent email attempts
SELECT 
  id,
  email_type,
  recipient_email,
  status,
  error_message,
  sent_at,
  created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;
```

#### Guest Records:
```sql
-- Check guests with email status
SELECT 
  g.id,
  g.name,
  g.email,
  g.email_sent_at,
  e.name as event_name
FROM guests g
LEFT JOIN events e ON g.event_id = e.id
ORDER BY g.created_at DESC
LIMIT 20;
```

### 5. Common Issues & Solutions

#### Issue 1: "Can't create events"

**Symptoms:**
- Create Event button doesn't work
- No console logs when tapping Create Event
- Form validation issues

**Debug Steps:**
1. Check Metro terminal for error logs
2. Verify user is authenticated: `console.log('[EventCreation] userId:', userId)`
3. Check Supabase connection
4. Verify all required fields filled

**Console Logs to Check:**
```
[EventCreation] Creating event: ...
[EventCreation] Error creating event: <error message>
```

**Common Fixes:**
```typescript
// Add validation logging
console.log('[EventCreation] Validation:', {
  hasName: !!name.trim(),
  hasLocation: !!(location.trim() || venue.trim()),
  userId,
});
```

#### Issue 2: "Invites not sending"

**Symptoms:**
- Guest added successfully but no email received
- Alert shows "email failed" message
- No email in inbox

**Debug Steps:**
1. **Check Environment**: Is __DEV__ true or false?
   ```typescript
   console.log('[EmailService] __DEV__:', __DEV__);
   console.log('[EmailService] API URL:', EMAIL_API_URL);
   ```

2. **Verify API Endpoint**:
   - Production should use: `https://www.partyhause.com/api/send-email`
   - Development iOS: `http://192.168.56.1:3001/api/send-email`
   - Development Android: `http://10.0.2.2:3001/api/send-email`

3. **Check Network**:
   - Device must have internet connection
   - Development: Local server must be running on port 3001
   - Production: Vercel endpoint must be accessible

4. **Verify Email Format**:
   ```typescript
   console.log('[GuestManagement] Email validation:', {
     email: newGuestEmail,
     isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newGuestEmail),
   });
   ```

5. **Check Event Object**:
   ```typescript
   console.log('[GuestManagement] Event data:', {
     hasEvent: !!event,
     eventId: event?.id,
     eventName: event?.name,
     eventDate: event?.date || event?.start_date,
     eventLocation: event?.location,
   });
   ```

**Expected Flow:**
```
1. [GuestManagement] Adding guest: { name: "John", email: "john@test.com", sendInvite: true }
2. [GuestManagement] Sending invitation email...
3. [EmailService] Sending email to: john@test.com
4. [EmailService] API URL: https://www.partyhause.com/api/send-email
5. [EmailService] Email sent successfully: { success: true, ... }
6. [GuestManagement] Email sent successfully
7. Alert: "Guest added and invitation email sent!"
```

**If Email Fails:**
```
1. [GuestManagement] Email sending failed: <error message>
2. [EmailService] API error: { error: "..." }
   OR
   [EmailService] Error sending email: Network request failed
   OR
   [EmailService] Failed to parse response: <html error page>
```

#### Issue 3: "Network request failed"

**Symptoms:**
- Error: "Network request failed"
- No response from API
- Timeout errors

**Possible Causes:**
1. **Development Environment**:
   - Local server not running
   - Wrong IP address configured
   - Firewall blocking port 3001
   - Device and dev machine on different networks

2. **Production Environment**:
   - No internet connection
   - Vercel endpoint down (unlikely)
   - CORS issues
   - DNS resolution failure

**Debug Steps:**
```bash
# 1. Test endpoint from command line
curl https://www.partyhause.com/api/health

# 2. Check local server (development)
curl http://192.168.56.1:3001/api/health

# 3. Verify IP address
ipconfig  # Windows
ifconfig  # Mac/Linux

# 4. Check firewall
# Ensure port 3001 is open
```

**Fixes:**
```typescript
// Add timeout to fetch
const response = await fetch(EMAIL_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(options),
  signal: AbortSignal.timeout(10000), // 10 second timeout
});
```

#### Issue 4: "Invalid API response"

**Symptoms:**
- Error: "Invalid API response"
- Failed to parse JSON
- HTML error page received

**Possible Causes:**
- Vercel deployment protection enabled
- Server returned HTML error page
- API endpoint returning wrong format
- CORS preflight failure

**Debug Steps:**
```typescript
// Log raw response
const text = await response.text();
console.log('[EmailService] Raw response:', text.substring(0, 200));

try {
  const data = JSON.parse(text);
  console.log('[EmailService] Parsed data:', data);
} catch (e) {
  console.error('[EmailService] Parse error:', e);
  console.error('[EmailService] Response was:', text);
}
```

**Check Response:**
- Should be JSON: `{ "success": true, "data": {...} }`
- NOT HTML: `<!DOCTYPE html>...`

### 6. Enhanced Debugging Setup

#### Add Enhanced Logging to email.ts:

```typescript
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const startTime = Date.now();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[EmailService] 📧 Sending email');
    console.log('[EmailService] To:', options.to);
    console.log('[EmailService] Subject:', options.subject);
    console.log('[EmailService] API URL:', EMAIL_API_URL);
    console.log('[EmailService] Environment:', __DEV__ ? 'Development' : 'Production');
    console.log('[EmailService] Platform:', Platform.OS);
    console.log('[EmailService] Metadata:', JSON.stringify(options.metadata));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const duration = Date.now() - startTime;
    console.log(`[EmailService] Response received in ${duration}ms`);
    console.log('[EmailService] Status:', response.status, response.statusText);

    const text = await response.text();
    console.log('[EmailService] Response length:', text.length, 'bytes');
    
    // Log first 200 chars for debugging
    if (text.length > 200) {
      console.log('[EmailService] Response preview:', text.substring(0, 200) + '...');
    } else {
      console.log('[EmailService] Full response:', text);
    }

    let data;
    try {
      data = JSON.parse(text);
      console.log('[EmailService] ✅ Parsed JSON successfully');
    } catch (e) {
      console.error('[EmailService] ❌ Failed to parse JSON');
      console.error('[EmailService] Parse error:', e.message);
      console.error('[EmailService] Response was:', text.substring(0, 500));
      throw new Error('Invalid API response: ' + text.substring(0, 100));
    }

    if (!response.ok) {
      console.error('[EmailService] ❌ API returned error status');
      console.error('[EmailService] Status:', response.status);
      console.error('[EmailService] Error data:', JSON.stringify(data, null, 2));
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[EmailService] ✅ Email sent successfully!');
    console.log('[EmailService] Message ID:', data.data?.id || 'N/A');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[EmailService] ❌ Error after ${duration}ms`);
    console.error('[EmailService] Error type:', error.constructor.name);
    console.error('[EmailService] Error message:', error.message);
    if (error.stack) {
      console.error('[EmailService] Stack trace:', error.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 7. Testing Checklist

Before releasing:

- [ ] **Event Creation**
  - [ ] Can create event with all fields
  - [ ] Validation works for required fields
  - [ ] Date/time picker works
  - [ ] Event appears in dashboard

- [ ] **Guest Management**
  - [ ] Can navigate to guest list
  - [ ] Can add guest with name and email
  - [ ] Toggle for "Send Email" works

- [ ] **Email Sending**
  - [ ] Email sends in production mode
  - [ ] Email sends in development mode (if local server running)
  - [ ] Success alert shows when email sent
  - [ ] Warning alert shows when email fails
  - [ ] Email appears in inbox
  - [ ] Email log created in Supabase
  - [ ] Guest record updated with email_sent_at

- [ ] **Error Handling**
  - [ ] Network errors shown to user
  - [ ] Invalid email format rejected
  - [ ] Duplicate guest email prevented
  - [ ] API errors logged and displayed

### 8. Quick Test Commands

```bash
# Test production email API
curl -X POST https://www.partyhause.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"dara@partyhause.com","subject":"Test","html":"<h1>Test</h1>"}'

# Test health endpoint
curl https://www.partyhause.com/api/health

# Run comprehensive test suite
node test-mobile-invite-system.js

# Check Vercel logs
vercel logs https://www.partyhause.com

# Check environment variables
vercel env ls
```

### 9. Support Resources

- **Expo Docs**: https://docs.expo.dev
- **React Query Docs**: https://tanstack.com/query/latest
- **Supabase Docs**: https://supabase.com/docs
- **MailerSend Docs**: https://developers.mailersend.com
- **Vercel Docs**: https://vercel.com/docs

### 10. Contact for Help

If still having issues after trying all debugging steps:

1. Collect logs from Metro terminal
2. Take screenshots of errors
3. Note what you were trying to do
4. Check database for any partial data
5. Test API endpoints independently

Remember: **Console logs are your best friend!** Always check Metro terminal first.
