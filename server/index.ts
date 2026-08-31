// server/index.ts — PartyHause API server (Express + Prisma)
//
// Replaces the old server/index.js which only had /api/health and /api/send-email.
// All data routes are now mounted from server/routes/*.ts using Prisma + Azure PostgreSQL.

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import { assertJwtSecretConfigured } from './lib/jwt-secret';
import { sendEmail, emailTransportStatus } from './lib/email';
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

const DEFAULT_PORT = 3001;

/**
 * Resolve the listening port from the environment.
 *
 * PORT arrives as an untyped string (Container Apps sets it), so
 * `process.env.PORT || 3001` produced a `string | 3001` union that
 * `app.listen` does not accept. Parse and range-check instead, so a malformed
 * value falls back loudly rather than binding somewhere unexpected.
 *
 * @returns A valid TCP port in 1..65535, defaulting to {@link DEFAULT_PORT}.
 */
function resolvePort(): number {
  const raw = process.env.PORT?.trim();
  if (!raw) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.warn(`[server] PORT="${raw}" is not a valid port; using ${DEFAULT_PORT}.`);
    return DEFAULT_PORT;
  }
  return parsed;
}

const port = resolvePort();

// Behind Azure Container Apps ingress there is exactly one trusted proxy hop;
// required so the rate limiters key on the real client IP, not the ingress.
app.set('trust proxy', 1);

// Umbrella limit for the whole API surface: generous enough that legitimate
// clients never see it (dashboard polling + page-load bursts are well under
// 60/min), hostile to scripted hammering of authenticated DB routes. The
// expensive endpoints keep their own stricter limiters (credential endpoints
// in routes/auth.ts, LLM endpoints in routes/ai.ts).
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

// Email transport lives in ./lib/email. Provider selection, credential
// resolution and client caching all happen there, so this file no longer
// constructs a provider client of its own.

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
// Behind Azure Container Apps ingress: exactly one trusted proxy hop, so
// req.ip reflects the client (required for per-IP rate limiting) without
// letting clients spoof arbitrary X-Forwarded-For chains.
app.set('trust proxy', 1);

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
    email: emailTransportStatus(),
    database: process.env.DATABASE_URL || process.env.POSTGRES_HOST ? 'configured' : 'missing',
  });
});

// Transactional email. Routed through server/lib/email.ts, which prefers Azure
// Communication Services and falls back to Resend. The sender address is fixed
// by the verified domain, so the previous ALLOW_FROM_OVERRIDE path is gone:
// an arbitrary caller-supplied From is spoofing, and ACS rejects unverified
// senders regardless.
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body ?? {};

  if (!to || (Array.isArray(to) && to.length === 0)) {
    return res.status(400).json({ success: false, error: 'Recipient "to" is required' });
  }
  if (typeof subject !== 'string' || subject.trim() === '') {
    return res.status(400).json({ success: false, error: 'Subject is required' });
  }
  if (typeof html !== 'string' || html.trim() === '') {
    return res.status(400).json({ success: false, error: 'HTML body is required' });
  }

  const result = await sendEmail({ to, subject, html });

  if (!result.ok) {
    // 502: the request was well formed, an upstream provider refused it.
    console.error(`[email] /api/send-email failed via ${result.provider}: ${result.error}`);
    return res.status(502).json({ success: false, provider: result.provider, error: result.error });
  }

  res.json({
    success: true,
    provider: result.provider,
    status: result.status,
    data: { id: result.id },
  });
});

// ===== API Routes =====
app.use('/api', apiLimiter);
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

// Fail closed before binding the listener. A missing or default JWT_SECRET in
// production means every token is forgeable by anyone who can read this
// repository, so refusing to start is the only safe outcome. Crashing here is
// visible in Container Apps revision health; serving traffic would not be.
try {
  assertJwtSecretConfigured();
} catch (err) {
  console.error('FATAL: refusing to start with an unsafe JWT signing key.');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

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
