import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Resend credentials from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL;
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'PartyHause';

// Initialize Resend client (lazily so missing creds don't crash startup)
let resendClient = null;
function getResend() {
  if (!resendClient && RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

// CORS - driven by CORS_ALLOWED_ORIGINS env var (comma-separated, or * for any origin)
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Allow same-origin / server-to-server / curl requests (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
      return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PartyHause API server is running',
    email: RESEND_API_KEY ? 'configured' : 'missing-credentials',
  });
});

app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📨 [server] /api/send-email called from', req.headers.origin || req.ip);
    console.log('📨 [server] request body:', JSON.stringify(req.body));
    console.log('📨 [server] env RESEND_API_KEY present:', !!RESEND_API_KEY);
    console.log('📨 [server] env RESEND_FROM_EMAIL present:', !!RESEND_FROM_EMAIL);

    const { to, subject, html, metadata } = req.body;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY must be set');
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_API_KEY not set' });
    }

    if (!RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

    // Determine 'from' header. Allow override from request only when explicitly enabled via env.
    let fromEmail = RESEND_FROM_EMAIL;
    let fromName = RESEND_FROM_NAME;

    if (req.body && req.body.from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      fromEmail = req.body.from;
      console.log('📨 [server] Using overridden from header from request:', fromEmail);
    } else {
      console.log('📨 [server] Using configured from header:', fromName, '<' + String(fromEmail) + '>');
    }

    const resend = getResend();
    const toList = Array.isArray(to) ? to : [to];

    const payload = {
      from: `${fromName} <${fromEmail}>`,
      to: toList,
      subject,
      html,
    };
    if (metadata && typeof metadata === 'object') {
      payload.metadata = Object.fromEntries(
        Object.entries(metadata)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      );
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      throw error;
    }

    const messageId = data?.id || null;
    console.log('📨 [server] Resend response:', { messageId });

    res.json({ success: true, data: { id: messageId } });
  } catch (error) {
    console.error('Email sending failed:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, error: (error && error.message) || String(error) });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`PartyHause API server running at http://localhost:${port}`);
  console.log(`Server is listening on all network interfaces`);
  console.log(`CORS allowed origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : '(any - no CORS_ALLOWED_ORIGINS set)'}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
  process.exit(1);
});
