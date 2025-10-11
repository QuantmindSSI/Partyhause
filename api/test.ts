import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: 'PartyHaus API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV || 'development',
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL
  });
}