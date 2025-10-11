// Plain ESM JS health endpoint to avoid TypeScript compile/runtime issues.
export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const present = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log('email-health (js) env:', present);
    return res.status(200).json({ ok: true, env: present });
  } catch (err) {
    console.error('email-health (js) error:', err);
    return res.status(500).json({ ok: false, error: 'health check failed' });
  }
}
