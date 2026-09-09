// server/index.ts — PartyHause API server (Express + Prisma)
//
// Replaces the old server/index.js which only had /api/health and /api/send-email.
// All data routes are now mounted from server/routes/*.ts using Prisma + Azure PostgreSQL.

import express from 'express';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import sanitizeHtml from 'sanitize-html';
import { assertJwtSecretConfigured } from './lib/jwt-secret';
import { assertInvitationTokenSecretConfigured } from './lib/invitation-token';
import { sendEmail, emailTransportStatus } from './lib/email';
import { prisma } from './lib/prisma';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth';
import { getEventAccess, canReadEvent, canInviteGuests } from './lib/event-access';
import { startRetentionSweeper } from './lib/retention';

/** Upper bound on a single send. Bulk invitations page through this. */
const MAX_EMAIL_RECIPIENTS = 100;

/**
 * Tags permitted in a caller-composed invitation body.
 *
 * Table-based layout only, because that is what Gmail and Outlook render. No
 * script, no iframe, no object, no form: an invitation is a document, not an
 * application, and the body arrives from a client we do not control.
 */
const EMAIL_ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'hr', 'i',
  'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'u', 'ul',
];

/**
 * Any inline style value that does not invoke `url()` or `expression()`.
 *
 * `url()` is the tracking-pixel and data:-payload vector; `expression()` is
 * legacy IE script execution. Everything else is layout, which email clients
 * need because they ignore stylesheets.
 */
const SAFE_STYLE_VALUE = [/^(?!.*(?:url\s*\(|expression\s*\())[^;{}]*$/i];

/**
 * Inline CSS permitted in an invitation body, by property.
 *
 * sanitize-html keys `allowedStyles` by tag and then by CSS property name. An
 * earlier version used '*' as the property key, which matches no property, so
 * every style was silently stripped and the layout collapsed. The test suite
 * caught it. Properties are therefore enumerated explicitly.
 */
const EMAIL_ALLOWED_STYLES: sanitizeHtml.IOptions['allowedStyles'] = {
  '*': {
    color: SAFE_STYLE_VALUE,
    'background-color': SAFE_STYLE_VALUE,
    background: SAFE_STYLE_VALUE,
    'font-family': SAFE_STYLE_VALUE,
    'font-size': SAFE_STYLE_VALUE,
    'font-weight': SAFE_STYLE_VALUE,
    'font-style': SAFE_STYLE_VALUE,
    'line-height': SAFE_STYLE_VALUE,
    'letter-spacing': SAFE_STYLE_VALUE,
    'text-align': SAFE_STYLE_VALUE,
    'text-decoration': SAFE_STYLE_VALUE,
    'text-transform': SAFE_STYLE_VALUE,
    padding: SAFE_STYLE_VALUE,
    'padding-top': SAFE_STYLE_VALUE,
    'padding-right': SAFE_STYLE_VALUE,
    'padding-bottom': SAFE_STYLE_VALUE,
    'padding-left': SAFE_STYLE_VALUE,
    margin: SAFE_STYLE_VALUE,
    'margin-top': SAFE_STYLE_VALUE,
    'margin-right': SAFE_STYLE_VALUE,
    'margin-bottom': SAFE_STYLE_VALUE,
    'margin-left': SAFE_STYLE_VALUE,
    border: SAFE_STYLE_VALUE,
    'border-top': SAFE_STYLE_VALUE,
    'border-bottom': SAFE_STYLE_VALUE,
    'border-color': SAFE_STYLE_VALUE,
    'border-radius': SAFE_STYLE_VALUE,
    'border-collapse': SAFE_STYLE_VALUE,
    width: SAFE_STYLE_VALUE,
    'max-width': SAFE_STYLE_VALUE,
    'min-width': SAFE_STYLE_VALUE,
    height: SAFE_STYLE_VALUE,
    display: SAFE_STYLE_VALUE,
    'vertical-align': SAFE_STYLE_VALUE,
  },
};

const EMAIL_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel', 'style'],
  img: ['src', 'alt', 'width', 'height', 'style'],
  table: ['width', 'cellpadding', 'cellspacing', 'border', 'align', 'style', 'role'],
  td: ['colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'style'],
  th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'style'],
  tr: ['align', 'valign', 'style'],
  '*': ['style', 'class'],
};
import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import guestsRouter from './routes/guests';
import timelineRouter from './routes/timeline';
import pollsRouter from './routes/polls';
import partyboardRouter from './routes/partyboard';
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
import mvpRouter, { mvpInputErrorHandler } from './routes/mvp';
import rsvpRouter, { rsvpInputErrorHandler } from './routes/rsvp';
import accountRouter, { accountInputErrorHandler, accountService } from './routes/account';

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

/**
 * Dedicated bound on outbound mail.
 *
 * /api/send-email is registered before apiLimiter so that a mail send cannot be
 * starved by ordinary API traffic, which also meant it previously had no limit
 * at all. Keyed on the authenticated user rather than IP: the cost being
 * controlled is provider spend and domain reputation, both of which follow the
 * account, not the network path.
 *
 * 20 sends per 5 minutes at up to 100 recipients each is 2,000 invitations,
 * comfortably above any real event and far below anything useful for abuse.
 */
const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    // `req.ip` alone is an IPv6 bypass: a caller holding a /64 has 2^64
    // addresses and each one is a fresh bucket, so the limit never binds.
    // `ipKeyGenerator` collapses an IPv6 address to its /64 prefix, which is
    // the unit actually allocated to a subscriber, and passes IPv4 through
    // unchanged.
    //
    // express-rate-limit v8 raises ERR_ERL_KEY_GEN_IPV6 for the naive form,
    // but only when NODE_ENV is not 'production'. The deployed API therefore
    // started cleanly while the bypass was live, and nothing surfaced it until
    // the server was finally run locally.
    (req as AuthenticatedRequest).user?.id ?? ipKeyGenerator(req.ip ?? '') ?? 'unknown',
  message: { error: 'Too many email sends. Try again shortly.' },
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
app.post('/api/send-email', emailLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  const { to, subject, html, event_id: eventId } = req.body ?? {};

  const recipients = (Array.isArray(to) ? to : [to]).filter(
    (r: unknown): r is string => typeof r === 'string' && r.trim() !== '',
  );

  if (recipients.length === 0) {
    return res.status(400).json({ success: false, error: 'Recipient "to" is required' });
  }
  if (recipients.length > MAX_EMAIL_RECIPIENTS) {
    return res.status(400).json({
      success: false,
      error: `A single send is limited to ${MAX_EMAIL_RECIPIENTS} recipients`,
    });
  }
  if (typeof subject !== 'string' || subject.trim() === '') {
    return res.status(400).json({ success: false, error: 'Subject is required' });
  }
  if (typeof html !== 'string' || html.trim() === '') {
    return res.status(400).json({ success: false, error: 'HTML body is required' });
  }
  if (typeof eventId !== 'string' || eventId.trim() === '') {
    return res.status(400).json({ success: false, error: '"event_id" is required' });
  }

  // The caller must be allowed to invite for this event. Host or a co-host
  // holding the invite permission; anyone else is refused before a provider is
  // ever contacted.
  const access = await getEventAccess(eventId, req.user!.id);
  if (!canReadEvent(access)) {
    // 404 rather than 403: a caller with no relationship to this event should
    // not learn whether the id exists.
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  if (!canInviteGuests(access)) {
    return res.status(403).json({ success: false, error: 'You cannot send invitations for this event' });
  }

  // Every recipient must already be a guest of that event. This is the control
  // that turns an open relay into a scoped command: the caller chooses which of
  // their own guests to mail, never an arbitrary address.
  const normalised = recipients.map((r) => r.trim().toLowerCase());
  const guests = await prisma.guest.findMany({
    where: { event_id: eventId, email: { in: normalised, mode: 'insensitive' } },
    select: { email: true },
  });
  const known = new Set(guests.map((g) => g.email.toLowerCase()));
  const strangers = normalised.filter((r) => !known.has(r));
  if (strangers.length > 0) {
    return res.status(403).json({
      success: false,
      error: 'Every recipient must be a guest of this event',
      // Echo only the count. Listing them back would confirm which addresses
      // are absent from a guest list the caller may be probing.
      rejected_count: strangers.length,
    });
  }

  // Bodies are composed client-side, so they are untrusted input that ends up
  // rendered in someone else's mail client. Strip anything that is not layout.
  const safeHtml = sanitizeHtml(html, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: EMAIL_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedStyles: EMAIL_ALLOWED_STYLES,
  });

  const result = await sendEmail({ to: recipients, subject, html: safeHtml });

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
// RSVP is anonymous and carries its own tighter limiter. Mount it before the
// umbrella limiter so every response, including a 429, retains no-store and
// no-referrer privacy headers.
app.use('/api/rsvp', rsvpInputErrorHandler);
app.use('/api/rsvp', rsvpRouter);
app.use('/api', apiLimiter);
app.use('/api/auth', authRouter);
app.use('/api/mvp/account', accountInputErrorHandler);
app.use('/api/mvp/account', accountRouter);
app.use('/api/mvp', mvpInputErrorHandler);
app.use('/api/mvp', mvpRouter);
app.use('/api/events', eventsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/partyboard', partyboardRouter);
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
  app.use('/join/:token', (_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    response.set('Referrer-Policy', 'no-referrer');
    response.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  app.use(/^\/(privacy|terms|support)\.html$/, (_request, response, next) => {
    response.set('Cache-Control', 'no-cache, no-store, max-age=0');
    response.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    response.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    response.set('Referrer-Policy', 'no-referrer');
    response.set('X-Content-Type-Options', 'nosniff');
    response.set('X-Frame-Options', 'DENY');
    next();
  });

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
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : undefined;
  res.status(500).json({ error: 'Internal server error', message });
});

// Fail closed before binding the listener. Authentication and invitation
// credentials are security boundaries, so an unsafe production secret must
// make the Container Apps revision visibly fail instead of serving traffic.
try {
  assertJwtSecretConfigured();
  assertInvitationTokenSecretConfigured();
  startRetentionSweeper(prisma, () => accountService.retryInterruptedDeletions());
} catch (err) {
  console.error('FATAL: refusing to start with unsafe secret configuration.');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`PartyHause API server running at http://localhost:${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : '(any)'}`);
}).on('error', (err: NodeJS.ErrnoException) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
  process.exit(1);
});
