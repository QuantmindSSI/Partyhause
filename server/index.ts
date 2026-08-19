// server/index.ts — PartyHause API server (Express + Prisma)
//
// Replaces the old server/index.js which only had /api/health and /api/send-email.
// All data routes are now mounted from server/routes/*.ts using Prisma + Azure PostgreSQL.

import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import guestsRouter from './routes/guests';
import timelineRouter from './routes/timeline';
import pollsRouter from './routes/polls';
import inviteTemplatesRouter from './routes/invite-templates';
import eventTemplatesRouter from './routes/event-templates';
import emailWebhookRouter from './routes/email-webhook';
import connectionsRouter from './routes/connections';
import partycrewRouter from './routes/partycrew';
import usersRouter from './routes/users';
import feedRouter from './routes/feed';
import invitesRouter from './routes/invites';
import costSplitRouter from './routes/cost-split';
import aiRouter from './routes/ai';
import emailLogsRouter from './routes/email-logs';
import storageRouter from './routes/storage';
import realtimeRouter from './routes/realtime';
import notificationsRouter from './routes/notifications';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Resend credentials
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL;
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'PartyHause';

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!resendClient && RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

// CORS
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
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
app.use(
  express.json({
    limit: '10mb',
    // Preserve the raw body so webhook signature verification (svix HMAC in
    // routes/email-webhook.ts) can hash the exact bytes that were signed.
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'PartyHause API server is running',
    email: RESEND_API_KEY ? 'configured' : 'missing-credentials',
    database: process.env.DATABASE_URL || process.env.POSTGRES_HOST ? 'configured' : 'missing',
  });
});

// Email sending (kept from original server/index.js)
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, metadata } = req.body;

    if (!RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_API_KEY not set' });
    }
    if (!RESEND_FROM_EMAIL) {
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

    let fromEmail = RESEND_FROM_EMAIL;
    let fromName = RESEND_FROM_NAME;

    if (req.body?.from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      fromEmail = req.body.from;
    }

    const resend = getResend();
    if (!resend) {
      return res.status(500).json({ success: false, error: 'Email client not initialized' });
    }

    const toList = Array.isArray(to) ? to : [to];
    const payload: Record<string, unknown> = {
      from: `${fromName} <${fromEmail}>`,
      to: toList,
      subject,
      html,
    };
    if (metadata && typeof metadata === 'object') {
      payload.metadata = Object.fromEntries(
        Object.entries(metadata)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      );
    }

    const { data, error } = await resend.emails.send(payload as any);
    if (error) throw error;

    res.json({ success: true, data: { id: data?.id || null } });
  } catch (error: any) {
    console.error('Email sending failed:', error?.stack || error);
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

// ===== API Routes =====
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/invite-templates', inviteTemplatesRouter);
app.use('/api/event-templates', eventTemplatesRouter);
app.use('/api/email-webhook', emailWebhookRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/partycrew', partycrewRouter);
app.use('/api/users', usersRouter);
app.use('/api/feed', feedRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/cost-split', costSplitRouter);
app.use('/api/ai', aiRouter);
app.use('/api/email-logs', emailLogsRouter);
app.use('/api/storage', storageRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/notifications', notificationsRouter);

// Serve built static files from dist/ when present (local preview / combined mode)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  // Browser auto-requests /favicon.ico; serve the 32x32 PNG as fallback
  app.get('/favicon.ico', (_req, res) => {
    res.sendFile(path.join(distPath, 'icons', 'favicon-32x32.png'));
  });

  app.use(express.static(distPath));

  // SPA fallback for client-side routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err?.message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`PartyHause API server running at http://localhost:${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : '(any)'}`);
}).on('error', (err: any) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
  process.exit(1);
});
