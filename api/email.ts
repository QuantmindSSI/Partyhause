import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from './email-service.js';

interface EmailPayload {
  to?: string | string[];
  subject?: string;
  html?: string;
  guestId?: string | number;
  eventId?: string | number;
  metadata?: Record<string, unknown> | undefined;
}

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

    const emailMetadata: Record<string, any> = {};
    if (guestId) emailMetadata.guestId = String(guestId);
    if (eventId) emailMetadata.eventId = String(eventId);
    if (metadata && typeof metadata === 'object') {
      for (const [k, v] of Object.entries(metadata)) {
        if (v != null) emailMetadata[k] = v;
      }
    }

    const result = await sendEmail({
      to,
      subject,
      html,
      metadata: emailMetadata,
    });

    if (!result.success) {
      const message = result.error || 'Failed to send email';
      if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('unauthorized')) {
        return res.status(401).json({ success: false, error: 'Email provider authentication failed' });
      }
      if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
        return res.status(400).json({ success: false, error: message });
      }
      return res.status(500).json({ success: false, error: `Failed to send email: ${message}` });
    }

    return res.status(200).json({ success: true, data: { id: result.messageId } });
  } catch (error: unknown) {
    console.error('Email error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: `Failed to send email: ${message}` });
  }
}
