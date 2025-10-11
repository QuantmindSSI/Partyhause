// Minimal ESM JS endpoint to verify runtime and presence of critical env vars.
// This file is intentionally plain JS (no TypeScript) and minimal to avoid runtime
// failures caused by TypeScript-only syntax or build issues.
export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const env = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
    };

    return res.status(200).json({ ok: true, env });
  } catch (err) {
    console.error('email-health-debug error:', err);
    return res.status(500).json({ ok: false, error: 'debug health failed' });
  }
}
