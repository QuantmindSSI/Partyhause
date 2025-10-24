# Supabase SMTP Configuration with Resend

## Problem
- `AuthApiError: Invalid Refresh Token` affecting user sessions
- Need custom SMTP for email confirmations through Resend
- Ensure reliable email delivery for authentication emails

## Solution: Custom SMTP with Resend

### 1. Supabase Dashboard SMTP Settings

Navigate to: **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**

```yaml
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: [YOUR_RESEND_API_KEY]
SMTP Admin Email: admin@yourpartyhaus.com
SMTP Sender Name: PartyHaus
SMTP Sender Email: noreply@yourpartyhaus.com
Enable TLS: Yes
```

### 2. Required Environment Variables

Add to your Supabase project environment variables:

```bash
# SMTP Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key_here
SMTP_ADMIN_EMAIL=admin@yourpartyhaus.com
SMTP_SENDER_NAME=PartyHaus
SMTP_SENDER_EMAIL=noreply@yourpartyhaus.com

# Resend API Configuration
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourpartyhaus.com
```

### 3. Authentication Email Templates

Configure custom email templates in Supabase:

#### Email Confirmation Template:
```html
<h2>Welcome to PartyHaus!</h2>
<p>Hi there,</p>
<p>Thanks for signing up! Please confirm your email address by clicking the link below:</p>
<a href="{{ .ConfirmationURL }}" style="background-color: #6C63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Confirm Email</a>
<p>If you didn't create this account, you can safely ignore this email.</p>
<p>Best regards,<br>The PartyHaus Team</p>
```

#### Password Reset Template:
```html
<h2>Reset Your PartyHaus Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password. Click the link below to set a new password:</p>
<a href="{{ .ConfirmationURL }}" style="background-color: #6C63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br>The PartyHaus Team</p>
```

### 4. Domain Configuration

#### A. Verify Domain with Resend:
1. Go to Resend Dashboard → Domains
2. Add your domain: `yourpartyhaus.com`
3. Add required DNS records:
   - **MX Record**: `feedback-smtp.resend.com`
   - **TXT Record**: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM Records**: (provided by Resend)

#### B. Update Supabase Site URL:
```bash
# In Supabase Dashboard → Settings → API
Site URL: https://yourpartyhaus.com
Additional redirect URLs: 
- https://yourpartyhaus.com/auth/callback
- http://localhost:5173/auth/callback (for development)
```

### 5. Authentication Configuration

Update your Supabase auth settings:

```sql
-- Enable email confirmations
UPDATE auth.config SET 
  enable_signup = true,
  enable_confirmations = true,
  confirm_email_change = true,
  secure_email_change = true;
```

### 6. Fix Session Management

Add this to your authentication service to handle refresh token errors:

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

export const handleAuthError = async (error: any) => {
  if (error.message?.includes('Invalid Refresh Token')) {
    // Clear local session and redirect to login
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  }
};

// Add session refresh handler
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.clear();
  }
});
```

### 7. Test Email Configuration

Use this test script to verify SMTP setup:

```bash
# Test email sending
curl -X POST "https://your-project-id.supabase.co/auth/v1/recover" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{"email": "test@yourpartyhaus.com"}'
```

### 8. Monitoring & Troubleshooting

#### Check Email Delivery:
- **Resend Dashboard**: Monitor email delivery status
- **Supabase Logs**: Check authentication logs
- **Browser Network Tab**: Monitor auth API calls

#### Common Issues:
- **Domain not verified**: Emails go to spam
- **API key incorrect**: SMTP authentication fails  
- **Port blocked**: Use port 587 or 465
- **Rate limits**: Resend has sending limits

### 9. Production Checklist

- [ ] Domain verified with Resend
- [ ] DNS records configured
- [ ] SMTP settings saved in Supabase
- [ ] Email templates customized
- [ ] Site URL updated
- [ ] Session management improved
- [ ] Test emails working
- [ ] Production email delivery tested

## Benefits

✅ **Reliable email delivery** through Resend
✅ **Custom branding** in authentication emails  
✅ **Better deliverability** with verified domain
✅ **Detailed analytics** from Resend dashboard
✅ **Consistent email experience** across the app