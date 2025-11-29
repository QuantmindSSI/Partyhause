import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendZohoEmail, type ZohoEmailOptions } from './zoho-email.js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';
import sanitizeHtml from 'sanitize-html';
import { createClient } from '@supabase/supabase-js';

interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  guestId?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
  from?: string;
}

type EmailMetadata = Record<string, unknown> & {
  templateBody?: unknown;
  emailLogId?: unknown;
  templateId?: unknown;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
  // Validate request body
  const { to, subject, html, guestId, eventId, metadata, from } = req.body as SendEmailRequest;
  const metadataRecord: EmailMetadata | undefined =
    metadata && typeof metadata === 'object' ? (metadata as EmailMetadata) : undefined;

  console.log('api/send-email - Using Zoho Mail SMTP');
  console.log('api/send-email - env ZOHO_SMTP_USER present:', !!process.env.ZOHO_SMTP_USER);
  console.log('api/send-email - env ZOHO_FROM_EMAIL present:', !!process.env.ZOHO_FROM_EMAIL);
    console.log('api/send-email - incoming body:', JSON.stringify({ to, subject, html, guestId, eventId, metadata }));

    // Server-side Supabase admin client for updating email_logs
    const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
      auth: { persistSession: false }
    });

    // Check for required fields. Allow templateBody via metadata as alternative to html.
  const templateBodyFromMeta = metadataRecord?.templateBody ?? null;
    const contentHtml = templateBodyFromMeta || html;

    if (!to || !subject || !contentHtml) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Check if Zoho credentials are available
    if (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS) {
      console.error('Zoho Mail credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error: Zoho credentials missing'
      });
    }

      // Ensure a verified FROM address is configured
      if (!process.env.ZOHO_FROM_EMAIL) {
  console.error('ZOHO_FROM_EMAIL environment variable must be set to a verified sending address (e.g. dara@partyhause.com)');
          return res.status(500).json({ success: false, error: 'Server configuration error: ZOHO_FROM_EMAIL not set' });
        }

    // Sanitize the HTML content before sending
    const sanitizedHtml = sanitizeHtml(contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'table', 'tr', 'td']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'style']
      }
    });

    // Determine 'from' header; allow client override if explicitly enabled
    let effectiveFromEmail = process.env.ZOHO_FROM_EMAIL || '';
    let effectiveFromName = process.env.ZOHO_FROM_NAME || 'PartyHause';
    
    if (from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      effectiveFromEmail = String(from);
      console.log('api/send-email - Using overridden from header from request:', effectiveFromEmail);
    } else {
      console.log('api/send-email - Using configured from header:', effectiveFromName, '<' + effectiveFromEmail + '>');
    }

    // Prepare metadata for Zoho email
    const emailMetadata: Record<string, any> = {};
    if (guestId) emailMetadata.guestId = String(guestId);
    if (eventId) emailMetadata.eventId = String(eventId);
    if (metadataRecord) {
      Object.entries(metadataRecord).forEach(([k, v]) => {
        if (v != null) {
          emailMetadata[k] = v;
        }
      });
    }

    // Send email via Zoho Mail
    const zohoOptions: ZohoEmailOptions = {
      to: to,
      subject: subject,
      html: sanitizedHtml,
      from: {
        email: effectiveFromEmail,
        name: effectiveFromName,
      },
      metadata: emailMetadata,
    };

    const result = await sendZohoEmail(zohoOptions);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email via Zoho');
    }

    console.log('api/send-email - Zoho Mail response:', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    const messageId = result.messageId;

    // If we have an emailLogId from metadata, update the email_logs record with template info and resend id
    const emailLogIdRaw = metadataRecord?.emailLogId;
    const emailLogId = typeof emailLogIdRaw === 'string' || typeof emailLogIdRaw === 'number'
      ? String(emailLogIdRaw)
      : undefined;
    if (emailLogId) {
      try {
        await supabaseAdmin
          .from('email_logs')
          .update({
            template_id: metadata?.templateId || null,
            template_body: metadata?.templateBody ? sanitizeHtml(String(metadata.templateBody)) : null,
            resend_email_id: messageId, // Using MailerSend message_id
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailLogId);
      } catch (e) {
        console.warn('Failed to update email_log with template info', e);
      }
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        id: messageId,
        message: 'Email sent successfully'
      }
    });

  } catch (error: unknown) {
    // Ensure we always return JSON and avoid re-throwing non-serializable errors
    console.error('Email sending failed:', error);
    let name: string | undefined;
    let message = 'unknown error';

    if (error instanceof Error) {
      name = error.name;
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      const potential = (error as { message?: unknown; name?: unknown }).message;
      const potentialName = (error as { message?: unknown; name?: unknown }).name;
      if (typeof potentialName === 'string') {
        name = potentialName;
      }
      if (typeof potential === 'string') {
        message = potential;
      } else {
        message = String(potential);
      }
    } else {
      message = String(error);
    }

    // Handle typed-like errors when possible
    if (name === 'validation_error') {
      return res.status(400).json({ success: false, error: `Email validation failed: ${message}` });
    }

    if (name === 'api_key_invalid') {
      return res.status(401).json({ success: false, error: 'Invalid API key configuration' });
    }

    return res.status(500).json({ success: false, error: `Failed to send email: ${message}` });
  }
}