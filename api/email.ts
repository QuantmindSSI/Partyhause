import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

interface EmailPayload {
  to?: string | string[];
  subject?: string;
  html?: string;
  guestId?: string | number;
  eventId?: string | number;
  metadata?: Record<string, unknown> | undefined;
}

type MailerSendResponseShape = {
  body?: { message_id?: string | null } | null;
  status?: number;
};

const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN || '';
const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
  const { to, subject, html } = (req.body ?? {}) as EmailPayload;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN is not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (!MAILERSEND_FROM_EMAIL) {
      console.error('MAILERSEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: MAILERSEND_FROM_EMAIL not set' });
    }

    // Initialize MailerSend inside handler to avoid module-level failures and make errors local to the request
    const mailerSend = new MailerSend({
      apiKey: MAILERSEND_API_TOKEN,
    });

    const sentFrom = new Sender(MAILERSEND_FROM_EMAIL, "PartyHause");
    
    const recipients = Array.isArray(to) ? to.map(email => new Recipient(email, email)) : [new Recipient(to, to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    const data = await mailerSend.email.send(emailParams);

    // Safe logging: some SDK responses can be non-serializable
    try {
      console.log('Email sent:', typeof data === 'string' ? data : JSON.stringify(data));
    } catch (e) {
      console.log('Email sent (non-serializable response)');
    }

    const responseObject = (data ?? {}) as MailerSendResponseShape;
    const messageId = typeof responseObject.body?.message_id === 'string' ? responseObject.body.message_id : null;
    return res.status(200).json({ success: true, data: { id: messageId } });

  } catch (error: unknown) {
    // Always return JSON to clients and avoid exposing stack traces
    console.error('Email error:', error);
    let message = 'unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      const potential = (error as { message?: unknown }).message;
      if (typeof potential === 'string') {
        message = potential;
      }
    } else {
      message = String(error);
    }
    // Map some known error types to statuses
    if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('unauthorized')) {
      return res.status(401).json({ success: false, error: 'Email provider authentication failed' });
    }
    if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
      return res.status(400).json({ success: false, error: message });
    }
    return res.status(500).json({ success: false, error: `Failed to send email: ${message}` });
  }
}