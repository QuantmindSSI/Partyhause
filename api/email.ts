import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
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
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

    // Initialize Resend inside handler to avoid module-level failures and make errors local to the request
    const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Safe logging: some SDK responses can be non-serializable
    try {
      console.log('Email sent:', typeof data === 'string' ? data : JSON.stringify(data));
    } catch (e) {
      console.log('Email sent (non-serializable response)');
    }

    const resendId = (data && typeof data === 'object' && (data as any).data && (data as any).data.id) ? (data as any).data.id : null;
    return res.status(200).json({ success: true, data: { id: resendId } });

  } catch (error: unknown) {
    // Always return JSON to clients and avoid exposing stack traces
    console.error('Email error:', error);
    const err: any = error;
    const message = (err && (err.message || String(err))) || 'unknown error';
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