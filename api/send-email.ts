import { VercelRequest, VercelResponse } from '@vercel/node';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { MAILERSEND_API_TOKEN, MAILERSEND_FROM_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';
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

  console.log('api/send-email - env MAILERSEND_API_TOKEN present:', !!MAILERSEND_API_TOKEN);
  console.log('api/send-email - env MAILERSEND_FROM_EMAIL present:', !!MAILERSEND_FROM_EMAIL);
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

    // Check if API key is available
    if (!MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

      // Ensure a verified FROM address is configured and always use it.
      if (!MAILERSEND_FROM_EMAIL) {
  console.error('MAILERSEND_FROM_EMAIL environment variable must be set to a verified sending address (e.g. dara@partyhause.com)');
          return res.status(500).json({ success: false, error: 'Server configuration error: MAILERSEND_FROM_EMAIL not set' });
        }

        // Initialize MailerSend inside handler to avoid module-level failures
        const mailerSend = new MailerSend({
          apiKey: MAILERSEND_API_TOKEN,
        });

    // Sanitize the HTML content before sending
    const sanitizedHtml = sanitizeHtml(contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'table', 'tr', 'td']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'style']
      }
    });

    // Determine 'from' header; allow client override if explicitly enabled
    let effectiveFromEmail = MAILERSEND_FROM_EMAIL;
    if (from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      effectiveFromEmail = String(from);
      console.log('api/send-email - Using overridden from header from request:', effectiveFromEmail);
    } else {
      // Always log the app display name followed by the configured sender address
      console.log('api/send-email - Using configured from header: PartyHause <' + String(MAILERSEND_FROM_EMAIL) + '>');
    }

    const sentFrom = new Sender(effectiveFromEmail, "PartyHause");
    const recipients = [new Recipient(to, to)]; // MailerSend expects array of Recipient objects

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(sanitizedHtml);

    // Attach metadata when provided so webhook events can be correlated
    const meta: Record<string, string> = {};
    if (guestId) meta.guestId = String(guestId);
    if (eventId) meta.eventId = String(eventId);
    if (metadataRecord) {
      Object.entries(metadataRecord).forEach(([k, v]) => {
        if (v != null) {
          meta[k] = String(v);
        }
      });
    }
    // Note: MailerSend doesn't support metadata in the same way as Resend
    // You may need to use tags or variables instead

    const data: unknown = await mailerSend.email.send(emailParams);
    // Avoid throwing if the SDK response contains circular refs or non-serializable values
    try {
      const serial = typeof data === 'string' ? data : JSON.stringify(data);
      console.log('api/send-email - MailerSend response:', serial);
    } catch (e) {
      console.log('api/send-email - MailerSend response (non-serializable):', String(data));
    }

    // Normalize MailerSend message id (MailerSend returns different structure than Resend)
    const extractMailerSendId = (d: unknown): string | null => {
      if (d && typeof d === 'object') {
        const obj = d as Record<string, unknown>;
        const body = obj['body'];
        if (body && typeof body === 'object') {
          const bodyObj = body as Record<string, unknown>;
          if (typeof bodyObj['message_id'] === 'string') return bodyObj['message_id'] as string;
        }
        if (typeof obj['message_id'] === 'string') return obj['message_id'] as string;
      }
      return null;
    };

    const messageId = extractMailerSendId(data);

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