import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { to, subject, html, guestId, eventId, metadata } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

  const emailFrom = `PartyHause <${process.env.RESEND_FROM_EMAIL}>`;
    const sendPayload: any = {
      from: emailFrom,
      to: [to],
      subject,
      html
    };

    const meta: Record<string, string> = {};
    if (guestId) meta.guestId = String(guestId);
    if (eventId) meta.eventId = String(eventId);
    if (metadata && typeof metadata === 'object') Object.entries(metadata).forEach(([k, v]) => { meta[k] = String(v); });
    if (Object.keys(meta).length > 0) sendPayload.metadata = meta;

    const data = await resend.emails.send(sendPayload);

    console.log('Email sent:', data);
    const resendId = data?.data?.id || null;
    return res.status(200).json({ success: true, data: { id: resendId, raw: data } });

  } catch (error: any) {
    console.error('Email error:', error);
    return res.status(500).json({ error: error.message });
  }
}