import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import sanitizeHtml from 'sanitize-html';
import { createClient } from '@supabase/supabase-js';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  guestId?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
  from?: string;
}

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

    console.log('api/send-email - env RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
    console.log('api/send-email - env RESEND_FROM_EMAIL present:', !!process.env.RESEND_FROM_EMAIL);
    console.log('api/send-email - incoming body:', JSON.stringify({ to, subject, html, guestId, eventId, metadata }));

    // Server-side Supabase admin client for updating email_logs
    const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
      auth: { persistSession: false }
    });

    // Check for required fields. Allow templateBody via metadata as alternative to html.
    const templateBodyFromMeta = metadata?.templateBody || null;
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
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

      // Ensure a verified FROM address is configured and always use it.
      if (!process.env.RESEND_FROM_EMAIL) {
  console.error('RESEND_FROM_EMAIL environment variable must be set to a verified sending address (e.g. dara@partyhause.com)');
          return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
        }

        const emailFrom = `PartyHause <${process.env.RESEND_FROM_EMAIL}>`;

    // Sanitize the HTML content before sending
    const sanitizedHtml = sanitizeHtml(contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'table', 'tr', 'td']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'style']
      }
    });

    // Determine 'from' header; allow client override if explicitly enabled
    let effectiveFrom = emailFrom;
    if (from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      effectiveFrom = String(from);
      console.log('api/send-email - Using overridden from header from request:', effectiveFrom);
    } else {
      // Always log the app display name followed by the configured sender address
      console.log('api/send-email - Using configured from header: PartyHause <' + String(process.env.RESEND_FROM_EMAIL) + '>');
    }

    const sendPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      metadata?: Record<string, string>;
    } = {
      from: effectiveFrom,
      to: [to], // Ensure to is an array
      subject,
      html: sanitizedHtml,
    };

    // Attach metadata when provided so webhook events can be correlated
    const meta: Record<string, string> = {};
    if (guestId) meta.guestId = String(guestId);
    if (eventId) meta.eventId = String(eventId);
    if (metadata && typeof metadata === 'object') {
      Object.entries(metadata).forEach(([k, v]) => { meta[k] = String(v); });
    }
  if (Object.keys(meta).length > 0) sendPayload.metadata = meta;

    const data: unknown = await resend.emails.send(sendPayload);
    // Avoid throwing if the SDK response contains circular refs or non-serializable values
    try {
      const serial = typeof data === 'string' ? data : JSON.stringify(data);
      console.log('api/send-email - Resend response:', serial);
    } catch (e) {
      console.log('api/send-email - Resend response (non-serializable):', String(data));
    }

    // Normalize resend id (some SDK versions return data.id or data.data.id)
    const extractResendId = (d: unknown): string | null => {
      if (d && typeof d === 'object') {
        const obj = d as Record<string, unknown>;
        const nested = obj['data'];
        if (nested && typeof nested === 'object') {
          const nestedObj = nested as Record<string, unknown>;
          if (typeof nestedObj['id'] === 'string') return nestedObj['id'] as string;
        }
        if (typeof obj['id'] === 'string') return obj['id'] as string;
      }
      return null;
    };

    const resendId = extractResendId(data);

    // If we have an emailLogId from metadata, update the email_logs record with template info and resend id
    const emailLogId = metadata?.emailLogId;
    if (emailLogId) {
      try {
        await supabaseAdmin
          .from('email_logs')
          .update({
            template_id: metadata?.templateId || null,
            template_body: metadata?.templateBody ? sanitizeHtml(String(metadata.templateBody)) : null,
            resend_email_id: resendId,
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
        id: resendId,
        message: 'Email sent successfully'
      }
    });

  } catch (error: unknown) {
    // Ensure we always return JSON and avoid re-throwing non-serializable errors
    console.error('Email sending failed:', error);
    const errAny = error as any;
    const name = errAny?.name as string | undefined;
    const message = (typeof errAny?.message === 'string' && errAny.message) || String(errAny) || 'unknown error';

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