# Gmail Filter & Forwarding Configuration
# PartyHause Email Management

# This file contains Gmail filter configurations that can be imported
# or set up manually to organize PartyHause support emails.

## OPTION 1: Manual Gmail Filter Setup

### Filter 1: Support Emails
```
Matches: to:(support@partyhause.com)
Do this:
  - Apply label: "PartyHause/Support"
  - Star it
  - Mark as important
  - Categorize as: Primary
  - Never send it to Spam
```

### Filter 2: Privacy Requests (HIGH PRIORITY)
```
Matches: to:(privacy@partyhause.com)
Do this:
  - Apply label: "PartyHause/Privacy-URGENT"
  - Star it
  - Mark as important
  - Categorize as: Primary
  - Never send it to Spam
  - Forward to: [backup email if team member]
  - Mark as read: No (ensure you see it)
```

### Filter 3: Legal Inquiries
```
Matches: to:(legal@partyhause.com)
Do this:
  - Apply label: "PartyHause/Legal"
  - Star it
  - Mark as important
  - Categorize as: Primary
  - Never send it to Spam
```

### Filter 4: Bug Reports
```
Matches: subject:("bug" OR "error" OR "crash" OR "broken" OR "not working") to:(support@partyhause.com)
Do this:
  - Apply label: "PartyHause/Support/Bugs"
  - Star it
  - Mark as important
```

### Filter 5: Feature Requests
```
Matches: subject:("feature" OR "suggestion" OR "request" OR "would be nice" OR "can you add") to:(support@partyhause.com)
Do this:
  - Apply label: "PartyHause/Support/Features"
  - Mark as important
```

### Filter 6: Account Issues
```
Matches: subject:("login" OR "password" OR "can't access" OR "locked out" OR "account") to:(support@partyhause.com)
Do this:
  - Apply label: "PartyHause/Support/Account"
  - Star it
  - Mark as important
```

### Filter 7: GDPR/CCPA Keywords
```
Matches: subject:("GDPR" OR "CCPA" OR "data request" OR "delete my data" OR "right to be forgotten") to:(privacy@partyhause.com)
Do this:
  - Apply label: "PartyHause/Privacy-URGENT/Legal-Request"
  - Star it
  - Mark as important
  - Mark as read: No
```

---

## OPTION 2: Import Gmail Filters (XML Format)

Save this as `partyhause-gmail-filters.xml` and import via Gmail Settings > Filters and Blocked Addresses > Import filters

```xml
<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns='http://www.w3.org/2005/Atom' xmlns:apps='http://schemas.google.com/apps/2006'>
  <title>Mail Filters</title>
  
  <!-- Filter 1: Support Emails -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='to' value='support@partyhause.com'/>
    <apps:property name='label' value='PartyHause/Support'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
    <apps:property name='shouldNeverSpam' value='true'/>
  </entry>
  
  <!-- Filter 2: Privacy Requests -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='to' value='privacy@partyhause.com'/>
    <apps:property name='label' value='PartyHause/Privacy-URGENT'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
    <apps:property name='shouldNeverSpam' value='true'/>
  </entry>
  
  <!-- Filter 3: Legal Inquiries -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='to' value='legal@partyhause.com'/>
    <apps:property name='label' value='PartyHause/Legal'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
    <apps:property name='shouldNeverSpam' value='true'/>
  </entry>
  
  <!-- Filter 4: Bug Reports -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='hasTheWord' value='to:(support@partyhause.com) subject:(bug OR error OR crash OR broken OR "not working")'/>
    <apps:property name='label' value='PartyHause/Support/Bugs'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
  </entry>
  
  <!-- Filter 5: Feature Requests -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='hasTheWord' value='to:(support@partyhause.com) subject:(feature OR suggestion OR request OR "would be nice" OR "can you add")'/>
    <apps:property name='label' value='PartyHause/Support/Features'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
  </entry>
  
  <!-- Filter 6: Account Issues -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='hasTheWord' value='to:(support@partyhause.com) subject:(login OR password OR "can\'t access" OR "locked out" OR account)'/>
    <apps:property name='label' value='PartyHause/Support/Account'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
  </entry>
  
  <!-- Filter 7: GDPR/CCPA -->
  <entry>
    <category term='filter'></category>
    <title>Mail Filter</title>
    <apps:property name='hasTheWord' value='to:(privacy@partyhause.com) subject:(GDPR OR CCPA OR "data request" OR "delete my data" OR "right to be forgotten")'/>
    <apps:property name='label' value='PartyHause/Privacy-URGENT/Legal-Request'/>
    <apps:property name='shouldStar' value='true'/>
    <apps:property name='shouldMarkAsImportant' value='true'/>
  </entry>
</feed>
```

---

## OPTION 3: Google Apps Script (Advanced Automation)

For advanced users: Create automated responses and ticket tracking

### Setup:
1. Go to Gmail
2. Click Settings (gear icon) > See all settings
3. Click "Filters and Blocked Addresses"
4. Or use Google Apps Script for more control

### Script Example (Tools > Script Editor in Google Sheets):

```javascript
/**
 * PartyHause Email Automation Script
 * Automatically labels, categorizes, and tracks support emails
 */

function processPartyHauseEmails() {
  // Process Support Emails
  const supportThreads = GmailApp.search('to:support@partyhause.com is:unread');
  
  supportThreads.forEach(thread => {
    const messages = thread.getMessages();
    const firstMessage = messages[0];
    const subject = firstMessage.getSubject().toLowerCase();
    
    // Apply labels based on content
    if (subject.includes('bug') || subject.includes('error') || subject.includes('crash')) {
      thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Support/Bugs'));
    } else if (subject.includes('feature') || subject.includes('suggestion')) {
      thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Support/Features'));
    } else if (subject.includes('login') || subject.includes('account')) {
      thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Support/Account'));
    } else {
      thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Support'));
    }
    
    thread.markImportant();
  });
  
  // Process Privacy Emails (HIGH PRIORITY)
  const privacyThreads = GmailApp.search('to:privacy@partyhause.com is:unread');
  
  privacyThreads.forEach(thread => {
    thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Privacy-URGENT'));
    thread.markImportant();
    thread.star();
    
    // Send notification for privacy requests
    const subject = thread.getFirstMessageSubject();
    sendSlackNotification(`New Privacy Request: ${subject}`);
  });
  
  // Process Legal Emails
  const legalThreads = GmailApp.search('to:legal@partyhause.com is:unread');
  
  legalThreads.forEach(thread => {
    thread.addLabel(GmailApp.getUserLabelByName('PartyHause/Legal'));
    thread.markImportant();
    thread.star();
  });
}

// Optional: Send Slack notification for urgent emails
function sendSlackNotification(message) {
  const webhookUrl = 'YOUR_SLACK_WEBHOOK_URL';
  
  const payload = {
    text: message,
    username: 'PartyHause Email Bot',
    icon_emoji: ':email:'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (e) {
    Logger.log('Error sending Slack notification: ' + e);
  }
}

// Run this script every 15 minutes
// Set up trigger: Edit > Current project's triggers > Add Trigger
// Choose: processPartyHauseEmails, Time-driven, Minutes timer, Every 15 minutes
```

---

## Label Structure

Create these labels in Gmail before setting up filters:

```
PartyHause/
├── Support/
│   ├── Bugs
│   ├── Features
│   ├── Account
│   └── General
├── Privacy-URGENT/
│   └── Legal-Request
└── Legal/
```

### How to Create Labels:
1. Gmail Settings > Labels
2. Click "Create new label"
3. Name: "PartyHause"
4. Click "Create"
5. Create sub-labels:
   - Name: "Support" → "Nest label under: PartyHause"
   - Name: "Bugs" → "Nest label under: PartyHause/Support"
   - (Repeat for all labels)

---

## Mobile Notifications Setup

### iPhone/iPad (iOS):
1. Install Gmail app
2. Settings > Notifications
3. Enable notifications for Gmail
4. In Gmail app:
   - Settings > [Your Account]
   - Notifications > All
   - Enable priority inbox notifications
   - Custom notification sound for "PartyHause/Privacy-URGENT"

### Android:
1. Install Gmail app
2. Settings > Apps > Gmail > Notifications
3. Enable all notifications
4. In Gmail app:
   - Settings > [Your Account]
   - Notifications > All
   - Label notifications:
     - Enable for "PartyHause/Privacy-URGENT" (High priority)
     - Enable for "PartyHause/Support"

---

## Forwarding Rules (If Using Multiple Team Members)

### Setup Email Forwarding in Gmail:
1. Settings > Forwarding and POP/IMAP
2. Add forwarding address
3. Verify the address
4. Choose "Forward a copy" option

### Forward Privacy Emails to Legal Team:
```
Filter: to:(privacy@partyhause.com)
Action: Forward to legal-team@yourcompany.com
Also: Keep PartyHause copy
```

### Forward Critical Bugs to Development:
```
Filter: to:(support@partyhause.com) subject:(crash OR "critical bug" OR "app won't open")
Action: Forward to dev-team@yourcompany.com
Also: Keep PartyHause copy
```

---

## Vacation Responder / Auto-Reply

### Setup:
1. Gmail Settings > General
2. Scroll to "Vacation responder"
3. Set:
   - First day: [Date you're away]
   - Last day: [Date you return]
   - Subject: "Auto-Reply: We've received your message"
   - Message: [Use template from EMAIL_TEMPLATES.md]
4. Check "Only send a response to people in my Contacts" (optional)
5. Save Changes

### Recommended Auto-Reply:
```
Thank you for contacting PartyHause!

We've received your message and will respond within 24-48 hours during business hours (Monday-Friday, 9am-5pm PT).

For urgent issues, please include "URGENT" in the subject line.

Need immediate help? Check our support page: https://www.partyhause.com/support.html

Best regards,
The PartyHause Team
```

---

## Priority Inbox Configuration

Enable Priority Inbox to see important emails first:

1. Gmail Settings > Inbox
2. Inbox type: Priority Inbox
3. Configure sections:
   - Section 1: Important (PartyHause/Privacy-URGENT)
   - Section 2: Starred
   - Section 3: Everything else
4. Save Changes

---

## Email Response Tracking

### Option 1: Shared Google Sheet
Create a sheet to track responses:

```
| Date | Email Address | Subject | Category | Status | Assigned To | Response Time | Resolved Date |
|------|---------------|---------|----------|--------|-------------|---------------|---------------|
```

### Option 2: Use Gmail Stars
- ⭐ Yellow star: New, needs response
- 🟢 Green: Bug report, needs investigation
- 🔴 Red: Privacy request, urgent
- 🔵 Blue: Feature request
- 🟣 Purple: Resolved, awaiting confirmation

### Option 3: Help Desk Software
- Zendesk
- Freshdesk
- Help Scout
(See EMAIL_SETUP_GUIDE.md for details)

---

## Testing Your Setup

### Test Checklist:

1. **Send test emails** to all three addresses:
   ```bash
   support@partyhause.com
   privacy@partyhause.com
   legal@partyhause.com
   ```

2. **Verify filters work:**
   - Check correct labels are applied
   - Confirm emails are starred
   - Verify marked as important

3. **Test mobile notifications:**
   - Send email to privacy@partyhause.com
   - Confirm push notification received
   - Check notification shows correct priority

4. **Test auto-reply:**
   - Enable vacation responder
   - Send test email
   - Verify auto-reply received

5. **Test "Send As":**
   - Reply to test email
   - Verify reply comes from @partyhause.com
   - Check signature appears correctly

---

## Troubleshooting

### Filters not working?
- Check filter is enabled (not paused)
- Verify "to:" address matches exactly
- Test with "Test Search" in filter creation

### Not receiving emails?
- Check spam folder
- Verify forwarding is set up correctly
- Check domain DNS records (MX, SPF)

### Mobile notifications not working?
- Enable app notifications in device settings
- Check Gmail notification settings
- Verify label notifications are enabled

---

## Quick Setup Command List

```bash
# 1. Create Gmail labels
PartyHause/Support
PartyHause/Support/Bugs
PartyHause/Support/Features
PartyHause/Support/Account
PartyHause/Privacy-URGENT
PartyHause/Privacy-URGENT/Legal-Request
PartyHause/Legal

# 2. Set up filters (use manual steps or XML import above)

# 3. Configure "Send As" for:
support@partyhause.com
privacy@partyhause.com
legal@partyhause.com

# 4. Enable vacation responder (optional)

# 5. Install Gmail mobile app and enable notifications

# 6. Test everything
```

---

## Maintenance Schedule

**Daily:**
- Check all three inboxes
- Respond to privacy@ within 6 hours
- Respond to support@ within 24 hours

**Weekly:**
- Review open tickets
- Clean up resolved conversations
- Update canned responses if needed

**Monthly:**
- Review response time metrics
- Update filters if needed
- Archive old conversations

---

Done! Your email filtering and forwarding is now configured for professional PartyHause support. 🎉
