# 🎉 Testing the Invitation Sending Feature

## Prerequisites

Before testing, ensure:
- ✅ Web app is running (`npm run dev`)
- ✅ You're logged into the app
- ✅ You have at least one event created
- ✅ MailerSend API is configured in `.env`

## Test Method 1: Web UI (Recommended)

### Step-by-Step Guide

1. **Start the Development Server**
   ```powershell
   npm run dev
   ```

2. **Login to Your Account**
   - Navigate to `http://localhost:5173`
   - Login with your credentials (dara@partyhause.com)

3. **Navigate to Event Details**
   - Go to "My Events"
   - Click on any event (or create a new one)
   - You should see the "Guest List" section

4. **Add a Guest**
   - In the "Add Guest" form, enter:
     - **Name:** Test Guest
     - **Email:** dara@partyhause.com (trial account limitation)
   - Click "Add Guest" button

5. **Observe the Flow**
   - ✅ Guest should be added to the list
   - ✅ Toast notification should show success
   - ✅ Email should be sent automatically
   - ✅ Check your inbox at dara@partyhause.com

6. **Verify in Database (Optional)**
   - Go to Supabase Dashboard
   - Check `guests` table for new entry
   - Check `email_logs` table for email record
   - Verify `status` is 'sent' and `sent_at` is populated

---

## Test Method 2: Automated Script

### Setup

1. **Install Dependencies**
   ```powershell
   npm install @supabase/supabase-js dotenv
   ```

2. **Configure Test User**
   Edit `test-invitation-flow.js` and update:
   ```javascript
   testUser: {
     email: 'dara@partyhause.com',
     password: 'YOUR_ACTUAL_PASSWORD_HERE' // ⚠️ Add your password
   }
   ```

3. **Run the Test**
   ```powershell
   node test-invitation-flow.js
   ```

### Expected Output

```
╔══════════════════════════════════════════════════╗
║   PartyHause Invitation Flow Test Suite         ║
║   Testing: User → Event → Guest → Email         ║
╚══════════════════════════════════════════════════╝

━━━ Step 1: User Authentication ━━━

✓ Authenticated as: dara@partyhause.com
→ User ID: "uuid-here"

━━━ Step 2: Event Setup ━━━

✓ Event created successfully
→ Event: {
  "id": "event-uuid",
  "name": "Invitation Test Event",
  "date": "2025-10-26T..."
}

━━━ Step 3: Add Guest ━━━

✓ Guest ready
→ Guest: {
  "id": "guest-uuid",
  "name": "John Doe",
  "email": "dara@partyhause.com"
}

━━━ Step 4: Send Invitation Email ━━━

ℹ Invitation URL: http://localhost:5173/event/{event-id}/guest/{guest-id}
ℹ Creating email log entry...
✓ Email log created: log-uuid
ℹ Sending email via API...
✓ Email sent successfully!
→ MailerSend Response: {
  "success": true,
  "data": {
    "id": "mailersend-message-id"
  }
}
✓ Database records updated

━━━ Step 5: Verify Email Tracking ━━━

✓ Email log retrieved
→ Email Log: {
  "id": "log-uuid",
  "status": "sent",
  "sent_at": "2025-10-19T...",
  "message_id": "mailersend-message-id",
  "recipient": "dara@partyhause.com",
  "subject": "🎉 You're Invited to Invitation Test Event!"
}

━━━ ✨ Test Results ✨ ━━━

✓ All tests passed!

Test Summary:
  ✓ User Authentication: PASSED
  ✓ Event Setup: PASSED
  ✓ Guest Addition: PASSED
  ✓ Email Sending: PASSED
  ✓ Email Tracking: PASSED
```

---

## Test Method 3: API Test (Advanced)

### Using cURL

```powershell
# 1. Test email API directly
curl -X POST http://localhost:5173/api/email `
  -H "Content-Type: application/json" `
  -d '{
    "to": "dara@partyhause.com",
    "subject": "Test Invitation",
    "html": "<h1>Hello!</h1><p>This is a test invitation.</p>",
    "metadata": {
      "test": true
    }
  }'
```

### Using the Test Email Button

1. Open the web app
2. Navigate to any event's guest list
3. Look for "Test Email" button
4. Click it to send a test invitation to your admin email

---

## What to Check

### ✅ Success Indicators

1. **In the Web UI:**
   - Guest appears in the guest list
   - Green success toast notification
   - No error messages

2. **In Your Email Inbox:**
   - Email received from PartyHause
   - Subject: "🎉 You're Invited to [Event Name]!"
   - Beautiful HTML formatting
   - Working RSVP button/link

3. **In Supabase Dashboard:**
   - New row in `guests` table
   - `email_sent_at` timestamp populated
   - New row in `email_logs` table
   - `status` = 'sent'
   - `sent_at` timestamp populated
   - `resend_email_id` (MailerSend message ID) present

4. **In MailerSend Dashboard:**
   - New email activity
   - Status: Sent/Delivered
   - Recipient: dara@partyhause.com

### ❌ Failure Indicators

1. **Email Not Received:**
   - Check spam folder
   - Verify MAILERSEND_API_TOKEN is correct
   - Check MailerSend dashboard for errors
   - Verify trial account limitation (can only send to dara@partyhause.com)

2. **Error in UI:**
   - Check browser console for errors
   - Verify API endpoint is accessible
   - Check network tab for failed requests

3. **Database Issues:**
   - Check if `email_logs` table exists
   - Verify RLS policies allow inserts
   - Check Supabase logs for errors

---

## Troubleshooting

### Problem: "Email API request failed"

**Solution:**
1. Check if dev server is running
2. Verify `.env` has MAILERSEND_API_TOKEN
3. Check `/api/email.ts` endpoint is accessible

### Problem: "Guest added but email not sent"

**Solution:**
This is expected behavior! The system uses graceful degradation:
- Guest is added to database first
- Email is sent second
- If email fails, guest still exists (you can resend later)

### Problem: "Cannot send to this email address"

**Solution:**
MailerSend trial accounts can only send to the verified domain email (dara@partyhause.com). Either:
- Use dara@partyhause.com as recipient
- Upgrade to paid MailerSend account
- Verify additional email addresses in MailerSend dashboard

### Problem: "email_logs insert failed"

**Solution:**
1. Verify `email_logs` table exists in Supabase
2. Check RLS policies allow authenticated users to insert
3. Verify all required fields are provided

---

## Expected Email Content

The invitation email should look like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          🎉
      You're Invited!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi Test Guest,

You've been invited to an amazing event! 
We'd love for you to join us for an 
unforgettable experience.

╔══════════════════════════════════╗
║  Invitation Test Event           ║
╠══════════════════════════════════╣
║ 📅 Saturday, October 26, 2025    ║
║ 🕐 7:00 PM                        ║
║ 📍 Test Venue, 123 Test St       ║
╚══════════════════════════════════╝

        [ ✨ RSVP Now ✨ ]

Click the button above to confirm your 
attendance and get all the event details.
We can't wait to see you there!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        PartyHause 🎊
Making events memorable, one 
invitation at a time.
```

---

## Database Schema Reference

### `guests` Table
```sql
- id: UUID
- event_id: UUID (foreign key)
- name: TEXT
- email: TEXT
- is_checked_in: BOOLEAN
- email_sent_at: TIMESTAMP  ← Updated when email sent
- created_at: TIMESTAMP
```

### `email_logs` Table
```sql
- id: UUID
- event_id: UUID (foreign key)
- guest_id: UUID (foreign key)
- template_id: UUID (optional)
- template_body: TEXT
- email_type: TEXT (invitation, reminder, etc.)
- recipient_email: TEXT
- subject: TEXT
- status: TEXT (pending → sent → delivered)
- resend_email_id: TEXT (MailerSend message ID)
- sent_at: TIMESTAMP
- error_message: TEXT
- created_at: TIMESTAMP
```

---

## Next Steps After Testing

Once you've verified the invitation system works:

1. **Upgrade MailerSend Account** (if needed)
   - Remove trial limitation
   - Send to any email address
   - Higher rate limits

2. **Implement Webhook** (optional)
   - Track email opens
   - Track link clicks
   - Update delivery status

3. **Add Mobile Support**
   - Implement email sending in mobile app
   - Feature parity with web

4. **Enhance Templates**
   - Add custom template builder
   - Implement preview functionality
   - A/B testing support

---

## Support

If you encounter issues:
1. Check the INVITATION_SYSTEM_REVIEW.md for detailed documentation
2. Review Supabase logs for database errors
3. Check MailerSend dashboard for delivery status
4. Verify all environment variables are set correctly
