import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface EmailPayload {
  to?: string | string[];
  subject?: string;
  html?: string;
  guestId?: string | number;
  eventId?: string | number;
  metadata?: Record<string, unknown> | undefined;
}

type ResendResponseShape = {
  data?: { id?: string | null } | null;
  error?: { message?: string } | null;
};

interface ResendSendEmailRequest {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  metadata?: Record<string, string>;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || '';

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
  const { to, subject, html, guestId, eventId, metadata } = (req.body ?? {}) as EmailPayload;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (!RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

    // Initialize Resend inside handler to avoid module-level failures and make errors local to the request
    const resend = new Resend(RESEND_API_KEY);

    const emailFrom = `PartyHause <${RESEND_FROM_EMAIL}>`;
    const meta: Record<string, string> = {};
    if (guestId) meta.guestId = String(guestId);
    if (eventId) meta.eventId = String(eventId);
    if (metadata && typeof metadata === 'object') {
      Object.entries(metadata).forEach(([key, value]) => {
        meta[key] = String(value);
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    const sendPayload: ResendSendEmailRequest = {
      from: emailFrom,
      to: recipients,
      subject,
      html,
      ...(Object.keys(meta).length > 0 ? { metadata: meta } : {}),
    };

    const data = await resend.emails.send(sendPayload);

    // Safe logging: some SDK responses can be non-serializable
    try {
      console.log('Email sent:', typeof data === 'string' ? data : JSON.stringify(data));
    } catch (e) {
      console.log('Email sent (non-serializable response)');
    }

    const responseObject = (data ?? {}) as ResendResponseShape;
    const resendId = typeof responseObject.data?.id === 'string' ? responseObject.data.id : null;
    return res.status(200).json({ success: true, data: { id: resendId } });

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