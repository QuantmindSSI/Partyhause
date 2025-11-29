# Zoho Mail Migration Guide

**Date:** November 24, 2025  
**Purpose:** Migrate from MailerSend to Zoho Mail for all email services  
**Status:** Implementation Ready

---

## Overview

PartyHause is migrating from MailerSend to **Zoho Mail** premium account for all email delivery including:
- Event invitations
- Guest communications
- System notifications
- Batch email sending

---

## Why Zoho Mail?

**Benefits over MailerSend:**
- ✅ Premium account already purchased
- ✅ Full control over email infrastructure
- ✅ Better deliverability with custom domain
- ✅ No per-email costs (flat monthly fee)
- ✅ Advanced features (templates, tracking, automation)
- ✅ SMTP + API access
- ✅ Dedicated IP address (premium)
- ✅ Better sender reputation management

---

## Zoho Mail Setup

### 1. Get Your Credentials

Log into your Zoho Mail premium account and obtain:

1. **SMTP Settings:**
   - Host: `smtp.zoho.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: Your full Zoho email (e.g., `dara@partyhause.com`)
   - Password: Your Zoho password or App-Specific Password

2. **API Credentials (Optional):**
   - Go to: https://api-console.zoho.com
   - Create a Server-based Application
   - Note Client ID and Client Secret
   - Generate refresh token

### 2. Generate App-Specific Password (Recommended)

For better security, create an app-specific password:

1. Go to Zoho Account Settings
2. Navigate to Security > App-Specific Passwords
3. Create new password for "PartyHause Application"
4. Use this password instead of your main password

### 3. Verify Domain (If Not Already Done)

Ensure your domain (`partyhause.com`) is verified in Zoho:

1. Add domain to Zoho Mail
2. Add required DNS records (SPF, DKIM, DMARC)
3. Verify domain ownership
4. Wait for propagation (24-48 hours)

**SPF Record:**
```
v=spf1 include:zoho.com ~all
```

**DKIM Record:**
```
(Provided by Zoho in domain settings)
```

**DMARC Record:**
```
v=DMARC1; p=none; rua=mailto:dmarc@partyhause.com
```

---

## Implementation Steps

### Step 1: Install Nodemailer

Zoho Mail works with standard SMTP, so we'll use Nodemailer:

```bash
npm install nodemailer @types/nodemailer
```

### Step 2: Update Environment Variables

Update `.env` file:

```bash
# Remove old MailerSend config
# MAILERSEND_API_TOKEN=...
# MAILERSEND_FROM_EMAIL=...

# Add Zoho Mail SMTP config
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_SECURE=true
ZOHO_SMTP_USER=dara@partyhause.com
ZOHO_SMTP_PASS=your-app-specific-password
ZOHO_FROM_EMAIL=dara@partyhause.com
ZOHO_FROM_NAME=PartyHause

# Optionally, if using Zoho API
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REFRESH_TOKEN=your-refresh-token
```

### Step 3: Update Netlify Environment Variables

Add to Netlify Dashboard (Settings > Environment Variables):

```
ZOHO_SMTP_HOST = smtp.zoho.com
ZOHO_SMTP_PORT = 465
ZOHO_SMTP_SECURE = true
ZOHO_SMTP_USER = dara@partyhause.com
ZOHO_SMTP_PASS = [your-app-specific-password]
ZOHO_FROM_EMAIL = dara@partyhause.com
ZOHO_FROM_NAME = PartyHause
```

Set for all contexts: Production, Preview, Development

### Step 4: Create Zoho Email Service

Create `api/zoho-email.ts` with Nodemailer implementation

### Step 5: Update Email API Endpoint

Modify `api/send-email.ts` to use Zoho instead of MailerSend

### Step 6: Update Mobile Email Service

No changes needed - mobile uses the API endpoint

### Step 7: Update Documentation

Update all references from MailerSend to Zoho Mail

---

## Testing Checklist

### ✅ Unit Tests
- [ ] Email validation
- [ ] HTML sanitization
- [ ] Template rendering
- [ ] Metadata handling

### ✅ Integration Tests
- [ ] Send single email
- [ ] Send batch emails
- [ ] Handle errors gracefully
- [ ] Verify SMTP connection
- [ ] Test rate limiting

### ✅ End-to-End Tests
- [ ] Send invitation from mobile app
- [ ] Send invitation from web app
- [ ] RSVP email delivery
- [ ] Reminder email delivery
- [ ] Welcome email delivery

### ✅ Production Verification
- [ ] Emails arrive in inbox (not spam)
- [ ] HTML renders correctly
- [ ] Links work correctly
- [ ] Images load properly
- [ ] Unsubscribe links work

---

## Rollback Plan

If issues occur:

1. **Immediate Rollback:**
   ```bash
   # Revert environment variables to MailerSend
   git revert [commit-hash]
   ```

2. **Partial Rollback:**
   - Add feature flag to switch between providers
   - Route non-critical emails to Zoho
   - Keep critical invitations on MailerSend

3. **Gradual Migration:**
   - Start with 10% traffic to Zoho
   - Monitor delivery rates
   - Gradually increase to 100%

---

## Monitoring & Metrics

Track these metrics post-migration:

1. **Delivery Rate:** Should be >98%
2. **Bounce Rate:** Should be <2%
3. **Spam Rate:** Should be <0.1%
4. **Open Rate:** Should be >20%
5. **Click Rate:** Should be >5%
6. **Response Time:** Should be <3 seconds

Use Zoho Mail Analytics dashboard to monitor.

---

## Best Practices

### 1. Email Sending Limits

Zoho Premium limits (adjust based on your plan):
- **Hourly:** 100-500 emails
- **Daily:** 1,000-10,000 emails
- **Monthly:** 30,000-300,000 emails

Implement rate limiting in code to respect these limits.

### 2. Error Handling

```typescript
try {
  await sendEmail(options);
} catch (error) {
  if (error.code === 'EAUTH') {
    // Authentication failed - check credentials
  } else if (error.code === 'ETIMEDOUT') {
    // Connection timeout - retry
  } else if (error.code === 'ECONNREFUSED') {
    // SMTP server refused connection
  }
  // Log error and implement retry logic
}
```

### 3. Retry Logic

Implement exponential backoff for failed sends:
- 1st retry: After 5 seconds
- 2nd retry: After 30 seconds
- 3rd retry: After 2 minutes
- 4th retry: After 10 minutes
- Give up after 4 retries

### 4. Email Queue

For batch sends, use a queue system:
- Send max 10 emails per batch
- Wait 1 second between batches
- Track failed emails for retry

---

## Security Considerations

1. **Never commit credentials** to git
2. **Use app-specific passwords** instead of main password
3. **Rotate credentials** every 90 days
4. **Enable 2FA** on Zoho account
5. **Monitor for suspicious activity**
6. **Use HTTPS** for all API calls
7. **Sanitize all email content** to prevent XSS
8. **Validate email addresses** before sending

---

## Support & Troubleshooting

### Common Issues

**Issue: Emails going to spam**
- Solution: Verify SPF, DKIM, DMARC records
- Warm up your IP address gradually
- Avoid spam trigger words in subject/body
- Use plain text version alongside HTML

**Issue: SMTP connection timeout**
- Solution: Check firewall settings
- Verify port 465/587 is not blocked
- Try alternative ports (587 with STARTTLS)

**Issue: Authentication failed**
- Solution: Verify username/password
- Ensure app-specific password is correct
- Check if 2FA is interfering

**Issue: Rate limit exceeded**
- Solution: Implement queue system
- Add delays between sends
- Upgrade Zoho plan if needed

### Getting Help

1. **Zoho Support:**
   - Email: support@zoho.com
   - Phone: Available in premium plans
   - Help Center: https://help.zoho.com/portal/en/home

2. **Developer Resources:**
   - API Docs: https://www.zoho.com/mail/help/api/
   - SMTP Guide: https://www.zoho.com/mail/help/zoho-smtp.html
   - Community: https://help.zoho.com/portal/en/community

---

## Migration Timeline

**Phase 1: Development & Testing** (Week 1)
- [ ] Set up Zoho credentials
- [ ] Implement new email service
- [ ] Create comprehensive tests
- [ ] Test in development environment

**Phase 2: Staging Deployment** (Week 1)
- [ ] Deploy to staging/preview
- [ ] Run full test suite
- [ ] Verify deliverability
- [ ] Fix any issues

**Phase 3: Production Rollout** (Week 2)
- [ ] Deploy to production
- [ ] Monitor metrics closely
- [ ] Be ready for immediate rollback
- [ ] Communicate with users

**Phase 4: Optimization** (Week 3-4)
- [ ] Fine-tune delivery rates
- [ ] Optimize email templates
- [ ] Implement advanced features
- [ ] Document lessons learned

---

## Success Criteria

Migration is successful when:

✅ All emails deliver successfully  
✅ Delivery rate >98%  
✅ Emails land in inbox, not spam  
✅ HTML renders correctly across all clients  
✅ No increase in bounce rate  
✅ Users report no issues  
✅ System performance maintained  
✅ Monitoring shows healthy metrics  

---

## Next Steps

1. Review this guide with team
2. Obtain Zoho credentials
3. Implement changes in feature branch
4. Run comprehensive tests
5. Deploy to staging
6. Monitor and optimize
7. Deploy to production
8. Update documentation

**Ready to begin implementation!** 🚀
