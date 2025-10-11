// Minimal ESM JS endpoint to verify runtime and presence of critical env vars.
// This file is intentionally plain JS (no TypeScript) and minimal to avoid runtime
// failures caused by TypeScript-only syntax or build issues.
import { RESEND_API_KEY, RESEND_FROM_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';

export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const env = {
      RESEND_API_KEY: !!RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!RESEND_FROM_EMAIL,
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
    };

    return res.status(200).json({ ok: true, env });
  } catch (err) {
    console.error('email-health-debug error:', err);
    return res.status(500).json({ ok: false, error: 'debug health failed' });
  }
}
