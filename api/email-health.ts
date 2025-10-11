import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lightweight health endpoint to verify presence of critical env vars used by the email
// handlers. THIS ENDPOINT DOES NOT RETURN SECRET VALUES — only booleans indicating
// whether the variable is set. Deploy to production and call /api/email-health to
// verify configuration without exposing keys.

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const present = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    return res.status(200).json({ ok: true, env: present });
  } catch (err) {
    console.error('email-health error:', err);
    return res.status(500).json({ ok: false, error: 'health check failed' });
  }
}
