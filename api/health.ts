import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasMailerSendToken = !!(process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN);
  const hasMailerSendEmail = !!(process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL);

  return res.status(200).json({
    status: 'ok',
    message: 'Email API server is running',
    timestamp: new Date().toISOString(),
    config: {
      mailerSendConfigured: hasMailerSendToken && hasMailerSendEmail,
      hasToken: hasMailerSendToken,
      hasFromEmail: hasMailerSendEmail
    }
  });
}
