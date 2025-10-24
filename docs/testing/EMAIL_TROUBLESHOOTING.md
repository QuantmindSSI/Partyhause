# 🔧 Email System Troubleshooting Guide

## ❌ Problem: "Failed to fetch" Error

### Root Cause
The app tries to send emails to `http://localhost:3001/api/send-email` but the local email server wasn't running.

### ✅ Solution Applied

**What Was Fixed:**
1. ✅ Updated `server/index.js` to use **MailerSend** instead of Resend
2. ✅ Started email API server on port 3001
3. ✅ Restarted development server

**Servers Now Running:**
- 🟢 **Dev Server:** `http://localhost:5173` (Vite)
- 🟢 **Email API:** `http://localhost:3001` (Node/Express with MailerSend)

---

## 🚀 How to Start Both Servers

### Option 1: Manual Start (Two Terminals)

**Terminal 1 - Email API Server:**
```powershell
npm run server
```
Expected output:
```
Email server running at http://localhost:3001
```

**Terminal 2 - Dev Server:**
```powershell
npm run dev
```
Expected output:
```
VITE v7.1.9  ready in XXXXms
➜  Local:   http://localhost:5173/
```

### Option 2: Start Together (PowerShell)
```powershell
# Start email server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server"

# Wait a moment
Start-Sleep -Seconds 2

# Start dev server
npm run dev
```

---

## 🧪 Testing the Email System

### Quick Test

1. **Open browser:** `http://localhost:5173`
2. **Login** to your account
3. **Navigate to any event**
4. **Click "Test Email"** button
5. **Check console** for logs
6. **Check email** at thecommodore30@gmail.com

### Add Guest Test

1. **Click "Add Guest"**
2. **Enter:**
   - Name: Test User
   - Email: any-email@example.com
3. **Click "Add Guest"**
4. **Watch for:**
   - ✅ Success toast
   - ✅ Console logs showing email sent
   - ✅ Email in MailerSend dashboard
   - ✅ Email in recipient inbox

---

## 📊 Checking Server Status

### Verify Email Server is Running
```powershell
# Check if port 3001 is listening
netstat -ano | findstr :3001
```
Should show: `TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING`

### Verify Dev Server is Running
```powershell
# Check if port 5173 is listening
netstat -ano | findstr :5173
```
Should show: `TCP    127.0.0.1:5173    0.0.0.0:0    LISTENING`

### Check Node Processes
```powershell
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName
```
Should show 2 node processes running.

---

## 🔍 Console Logs to Watch

### In Browser Console (F12):

**When adding guest, you should see:**
```javascript
📝 Email log created: [uuid]
sendEmailWithTracking - sending to apiUrl: http://localhost:3001/api/send-email
sendEmailWithTracking - payload: { to: "email@example.com", subject: "...", ... }
✓ Email sent successfully
```

**If you see errors:**
```javascript
❌ Email sending failed: TypeError: Failed to fetch
```
This means the email server (port 3001) is not running.

### In Terminal (Email Server):

**When email is sent, you should see:**
```
📨 [server] /api/send-email called from http://localhost:5173
📨 [server] request body: {"to":"...","subject":"...","html":"..."}
📨 [server] env MAILERSEND_API_TOKEN present: true
📨 [server] env MAILERSEND_FROM_EMAIL present: true
📨 [server] Using configured from header: PartyHause <dara@partyhause.com>
📨 [server] MailerSend response: {...}
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Failed to fetch"
**Symptom:** Error when adding guest
**Cause:** Email server (port 3001) not running
**Fix:**
```powershell
npm run server
```

### Issue 2: "MAILERSEND_API_TOKEN not set"
**Symptom:** Server starts but shows config error
**Cause:** Missing environment variables
**Fix:** Check `.env` file has:
```properties
MAILERSEND_API_TOKEN=mlsn.xxx...
MAILERSEND_FROM_EMAIL=dara@partyhause.com
```

### Issue 3: "Address already in use"
**Symptom:** Server won't start on port 3001
**Cause:** Another process using the port
**Fix:**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID)
taskkill /F /PID [PID_NUMBER]

# Restart server
npm run server
```

### Issue 4: Email server not using MailerSend
**Symptom:** Error about "Missing API key" or "Resend"
**Cause:** Old server code still using Resend
**Fix:** Server has been updated to use MailerSend (already fixed)

### Issue 5: No emails in MailerSend dashboard
**Symptom:** No activity in MailerSend dashboard
**Causes:**
1. Email server not running → Start with `npm run server`
2. Wrong API endpoint → Check `email-tracking.ts` line 110
3. API token invalid → Verify in MailerSend dashboard
4. From email not verified → Verify dara@partyhause.com in MailerSend

**Debug Steps:**
```powershell
# 1. Check if server is running
netstat -ano | findstr :3001

# 2. Check browser console for errors
# Open DevTools (F12) → Console tab

# 3. Check email server logs
# Watch the terminal running "npm run server"

# 4. Test MailerSend API directly
node test-mailersend.js
```

---

## 🎯 Email Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (http://localhost:5173)                    │
│  ├─ GuestList.tsx                                   │
│  └─ email-tracking.ts                               │
│      │                                               │
│      │ POST http://localhost:3001/api/send-email    │
│      ▼                                               │
├─────────────────────────────────────────────────────┤
│  Email API Server (http://localhost:3001)           │
│  └─ server/index.js                                 │
│      │                                               │
│      │ Uses MailerSend SDK                          │
│      ▼                                               │
├─────────────────────────────────────────────────────┤
│  MailerSend API (https://api.mailersend.com)        │
│  └─ Processes and delivers email                    │
│      ▼                                               │
├─────────────────────────────────────────────────────┤
│  Recipient Email Inbox                              │
│  └─ Email delivered!                                │
└─────────────────────────────────────────────────────┘
```

**Why Two Servers?**
- **Dev Server (5173):** Serves React app, hot reload
- **Email Server (3001):** Handles email sending with secure API keys

---

## ✅ Verification Checklist

Before testing invitations, verify:

```
□ .env file exists with correct values
□ MAILERSEND_API_TOKEN is set
□ MAILERSEND_FROM_EMAIL is set
□ Email server running (npm run server)
□ Dev server running (npm run dev)
□ Port 3001 is listening
□ Port 5173 is listening
□ No errors in email server terminal
□ No errors in dev server terminal
□ Browser can access http://localhost:5173
□ Browser console shows no errors
```

---

## 🚀 Quick Start Commands

### Start Everything Fresh:
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Start email server (Terminal 1)
npm run server

# In new terminal, start dev server (Terminal 2)
npm run dev
```

### Stop Everything:
```powershell
# Kill all node processes
taskkill /F /IM node.exe
```

### Restart Just Email Server:
```powershell
# Kill and restart email server
taskkill /F /IM node.exe; npm run server
```

---

## 📚 Related Documentation

- **System Status:** `GUEST_INVITE_STATUS.md`
- **Complete Review:** `INVITATION_SYSTEM_REVIEW.md`
- **Testing Guide:** `TESTING_INVITATION_FEATURE.md`
- **MailerSend Test:** `test-mailersend.js`

---

## 🎉 Success Indicators

### Email Sent Successfully:

**Browser Console:**
```
✓ Email sent successfully
Invitation sent! 🎉
```

**Email Server Terminal:**
```
📨 [server] MailerSend response: {...}
```

**MailerSend Dashboard:**
```
Activity → New email sent
Status: Sent/Delivered
```

**Recipient Inbox:**
```
New email from PartyHause
Subject: 🎉 You're Invited to [Event]!
```

---

## 💡 Pro Tips

1. **Keep Email Server Running:** Once started, leave it running while developing
2. **Watch Both Terminals:** Monitor logs for debugging
3. **Check Browser Console:** Most errors show here first
4. **Test Email Button:** Use this for quick testing without adding guests
5. **MailerSend Dashboard:** Monitor all email activity in real-time

---

**Last Updated:** October 19, 2025  
**Status:** ✅ Fixed - Both servers configured and running
