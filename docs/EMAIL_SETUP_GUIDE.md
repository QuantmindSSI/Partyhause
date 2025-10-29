# PartyHause Email Configuration Guide

This guide covers setting up the required email addresses for your App Store submission and customer support.

## 📧 Required Email Addresses

For App Store compliance and professional operation, you need:

1. **support@partyhause.com** - General support and inquiries
2. **privacy@partyhause.com** - Privacy requests, GDPR/CCPA compliance
3. **legal@partyhause.com** - Legal matters, partnerships, business inquiries

---

## 🎯 Setup Options

### Option 1: Single Email with Aliases (Recommended for Solo/Small Team)

**Best for**: Solo developers or small teams  
**Cost**: Free (if using Gmail) or included with domain hosting  
**Complexity**: Low

#### How it works:
- Use one main email address (e.g., `hello@partyhause.com`)
- Set up aliases or forwarding for support@, privacy@, and legal@
- All emails arrive in one inbox with labels/filters

#### Setup Steps:

##### Using Gmail Workspace (Recommended)
1. **Sign up for Google Workspace** ($6/month per user)
   - Go to: https://workspace.google.com
   - Add your domain: partyhause.com
   - Verify domain ownership

2. **Create Email Aliases**
   - Go to Admin Console > Users
   - Select your main user
   - Click "User information" > "Email aliases"
   - Add aliases:
     - support@partyhause.com
     - privacy@partyhause.com
     - legal@partyhause.com

3. **Set Up Filters (Optional but Recommended)**
   - In Gmail, click Settings > Filters and Blocked Addresses
   - Create filters to auto-label emails:
     - To: support@partyhause.com → Label: "Support"
     - To: privacy@partyhause.com → Label: "Privacy" (mark important)
     - To: legal@partyhause.com → Label: "Legal"

##### Using Domain Hosting Email Forwarding (Free)
If you have domain hosting (Vercel, Namecheap, GoDaddy, etc.):

1. **Log into your domain registrar/host**
2. **Find Email Forwarding settings**
3. **Create forwards**:
   - support@partyhause.com → your-personal-email@gmail.com
   - privacy@partyhause.com → your-personal-email@gmail.com
   - legal@partyhause.com → your-personal-email@gmail.com

4. **Set Up Gmail to Send As** (so replies come from @partyhause.com):
   - Gmail Settings > Accounts and Import
   - "Send mail as" > Add another email address
   - Add each @partyhause.com address
   - Verify ownership via confirmation email

---

### Option 2: Separate Email Accounts (Professional Team Setup)

**Best for**: Teams with dedicated support staff  
**Cost**: $18-30/month (3 users on Google Workspace)  
**Complexity**: Medium

#### Setup Steps:

1. **Create Google Workspace accounts**:
   - support@partyhause.com (primary support person)
   - privacy@partyhause.com (can forward to legal/compliance team)
   - legal@partyhause.com (founder or legal team)

2. **Set up email clients**:
   - Gmail web interface
   - Or use dedicated email client (Spark, Superhuman, etc.)

3. **Create shared labels** (optional):
   - "Urgent"
   - "Bug Reports"
   - "Feature Requests"
   - "GDPR Requests"

---

### Option 3: Customer Support Platform (Scalable)

**Best for**: Growing teams needing ticketing system  
**Cost**: $15-49/month  
**Complexity**: Medium-High

#### Recommended Tools:

1. **Zendesk** (https://zendesk.com)
   - Full ticketing system
   - Multiple email addresses
   - Automated responses
   - Team collaboration
   - ~$49/month

2. **Freshdesk** (https://freshdesk.com)
   - Similar to Zendesk
   - Free tier available
   - Better for small teams
   - ~$15/month for pro features

3. **Help Scout** (https://helpscout.com)
   - Clean, simple interface
   - Email-based support
   - ~$25/month

#### How it works:
- Create support@partyhause.com in the platform
- Forward privacy@ and legal@ to the same platform
- Use tags/departments to route emails
- Get analytics on response times

---

## 🚀 Quick Start: Recommended Setup for Solo Launch

### Step 1: Choose Your Approach

**For MVP/Launch (Easiest & Free)**:
- Use domain email forwarding → your personal Gmail
- Set up "Send As" in Gmail
- Add filters for organization

**For Professional Setup ($6/month)**:
- Get Google Workspace
- Create aliases
- Use Gmail interface

### Step 2: Configure Domain Email Forwarding (Free Option)

#### If using Vercel for hosting:

```bash
# In your vercel.json, add email forwarding
{
  "version": 2,
  "buildCommand": "npm run build",
  "rewrites": [
    {
      "source": "/.well-known/mail-config",
      "destination": "/api/mail-config"
    }
  ]
}
```

Then set up forwarding in your domain registrar (where you bought partyhause.com):

#### Namecheap Example:
1. Log in to Namecheap
2. Domain List > Manage > Email Forwarding
3. Add forwarders:
   - `support` → `your-email@gmail.com`
   - `privacy` → `your-email@gmail.com`
   - `legal` → `your-email@gmail.com`

#### GoDaddy Example:
1. My Products > Email > Manage
2. Email Forwarding > Create Forward
3. Add each address

#### Cloudflare Example (if using Cloudflare):
1. Email > Email Routing
2. Enable Email Routing
3. Add destination addresses
4. Create forwarding rules

### Step 3: Set Up Gmail "Send As"

1. Open Gmail
2. Settings (gear icon) > See all settings
3. Accounts and Import tab
4. "Send mail as" section > Add another email address
5. Enter:
   - Name: PartyHause Support
   - Email: support@partyhause.com
   - Leave "Treat as an alias" checked
6. Click "Next Step"
7. Verify via email confirmation
8. Repeat for privacy@ and legal@

### Step 4: Create Gmail Filters

```
Filter 1: Support Emails
- To: support@partyhause.com
- Apply label: [Support]
- Star it
- Mark as important

Filter 2: Privacy Requests
- To: privacy@partyhause.com
- Apply label: [Privacy - URGENT]
- Star it
- Mark as important
- Play notification sound

Filter 3: Legal Emails
- To: legal@partyhause.com
- Apply label: [Legal]
- Mark as important
```

---

## 📋 Email Response Templates

### Support Response Template

```
Subject: Re: [Original Subject]

Hi [Name],

Thank you for reaching out to PartyHause!

[Answer their question]

If you have any other questions, feel free to reply to this email.

Best regards,
The PartyHause Team

---
PartyHause - Create Unforgettable Events
🌐 https://www.partyhause.com
📧 support@partyhause.com
```

### Privacy Request Response Template

```
Subject: Privacy Request Received - Reference #[Date-Timestamp]

Hi [Name],

We've received your privacy request regarding [data access/deletion/export].

Reference Number: #[Date-Timestamp]

We take privacy seriously and will process your request within:
- Data Access Requests: 30 days
- Data Deletion Requests: 30 days
- GDPR/CCPA Requests: As required by law

You'll receive a follow-up email once your request has been processed.

If you have any questions, please reply to this email with your reference number.

Best regards,
PartyHause Privacy Team

---
PartyHause
📧 privacy@partyhause.com
🔒 Privacy Policy: https://www.partyhause.com/privacy.html
```

### Auto-Reply Template (Optional)

Set up auto-replies for non-business hours:

```
Subject: Auto-Reply: We've received your message

Thank you for contacting PartyHause!

We've received your message and will respond within 24-48 hours during business hours (Monday-Friday, 9am-5pm PT).

For urgent issues, please include "URGENT" in the subject line.

Common questions? Check our support page: https://www.partyhause.com/support.html

Best regards,
The PartyHause Team
```

---

## 🔒 Security Best Practices

1. **Enable 2-Factor Authentication**
   - Required for all email accounts
   - Use authenticator app (Google Authenticator, Authy)

2. **Use Strong Passwords**
   - Minimum 16 characters
   - Use password manager (1Password, LastPass, Bitwarden)

3. **Email Encryption**
   - Gmail uses TLS by default
   - For sensitive data, consider PGP encryption

4. **Privacy Request Verification**
   - Verify identity before processing data requests
   - Ask for account email confirmation
   - May request additional verification for deletion requests

5. **Regular Monitoring**
   - Check all inboxes daily
   - Set up mobile notifications for privacy@ emails
   - Weekly review of open support tickets

---

## 📊 Email Management Tips

### Response Time Goals
- **Support**: 24-48 hours
- **Privacy**: 24 hours acknowledgment, 30 days completion
- **Legal**: 48-72 hours

### Canned Responses
Create templates for common questions:
- How to create an event
- How to invite guests
- RSVP not working
- Account deletion
- Privacy concerns
- Bug reports

### Email Signature

```
---
[Your Name]
PartyHause Team

🎉 Create Unforgettable Events
🌐 https://www.partyhause.com
📧 support@partyhause.com

Follow us:
Twitter: @partyhause (when available)
Instagram: @partyhause (when available)
```

---

## ✅ Email Setup Checklist

- [ ] Choose email setup option (aliases, separate accounts, or platform)
- [ ] Configure domain email forwarding OR set up Google Workspace
- [ ] Set up Gmail "Send As" for all three addresses
- [ ] Create Gmail filters for organization
- [ ] Enable 2FA on all accounts
- [ ] Set up email signatures
- [ ] Create canned response templates
- [ ] Test all email addresses (send test emails)
- [ ] Verify emails arrive and can be replied to
- [ ] Update App Store Connect with support email
- [ ] Update all legal pages with correct emails
- [ ] Set up mobile notifications
- [ ] Document email credentials securely (password manager)

---

## 🧪 Testing Your Email Setup

### Test Checklist:

1. **Send Test Emails**
   ```bash
   # From another email account, send to:
   - support@partyhause.com
   - privacy@partyhause.com
   - legal@partyhause.com
   ```

2. **Verify Receipt**
   - Check all emails arrive
   - Check filters/labels work
   - Check they appear in correct inbox

3. **Test Replies**
   - Reply to each test email
   - Verify reply comes from @partyhause.com address
   - Verify recipient receives reply

4. **Test Auto-Replies** (if configured)
   - Send email outside business hours
   - Verify auto-reply is sent

5. **Mobile Notifications**
   - Install Gmail app on phone
   - Verify push notifications work
   - Test priority notifications for privacy@

---

## 💰 Cost Comparison

| Option | Monthly Cost | Setup Time | Best For |
|--------|--------------|------------|----------|
| Domain Forwarding + Gmail | $0 | 30 min | Solo MVP launch |
| Google Workspace (1 user, aliases) | $6 | 1 hour | Solo professional |
| Google Workspace (3 users) | $18 | 2 hours | Small team |
| Zendesk/Support Platform | $15-49 | 3-4 hours | Growing team |

---

## 🆘 Troubleshooting

### Emails not arriving?
1. Check spam folder
2. Verify domain DNS records (MX, SPF, DKIM)
3. Check forwarding rules are active
4. Test with different sender (Gmail, Outlook, etc.)

### Can't send from @partyhause.com?
1. Verify "Send As" is set up in Gmail
2. Check you clicked confirmation link in verification email
3. Ensure domain allows sending (SPF records)

### Emails marked as spam?
1. Set up SPF record in DNS
2. Set up DKIM record
3. Set up DMARC record
4. Use authenticated email service (Google Workspace)

---

## 📚 Additional Resources

- [Google Workspace Setup Guide](https://support.google.com/a/answer/53929)
- [Gmail Send As Configuration](https://support.google.com/mail/answer/22370)
- [Email Forwarding Best Practices](https://support.google.com/domains/answer/3251241)
- [GDPR Email Compliance](https://gdpr.eu/email-encryption/)

---

## 🎯 Recommended Quick Setup (15 Minutes)

For fastest launch:

1. **Set up domain email forwarding** (5 min)
   - Log into domain registrar
   - Add three forwarders → your Gmail

2. **Configure Gmail Send As** (5 min)
   - Add all three @partyhause.com addresses
   - Verify via confirmation emails

3. **Create basic filters** (3 min)
   - Filter by "To:" address
   - Apply labels and stars

4. **Test** (2 min)
   - Send test email
   - Reply from each address

**Done!** ✅ You now have professional @partyhause.com email addresses for App Store submission.

---

Need help? The support@ address should be monitored daily. The privacy@ address requires responses within 30 days per GDPR/CCPA requirements.
