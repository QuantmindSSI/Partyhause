import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getJwtSecret } from '../lib/jwt-secret';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    /** True only when the token carries a confirmed-address claim. */
    email_verified?: boolean;
    [key: string]: unknown;
  };
}

// getJwtSecret is imported from ../lib/jwt-secret. It reads lazily (this module
// is hoisted above dotenv.config() in server/index.ts) and throws in production
// rather than falling back to the committed development key.

// AUTH_BYPASS is a local-development escape hatch only, never honored in
// production builds.
function authBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  /**
   * Whether the address was confirmed when this token was minted.
   *
   * Absent on tokens issued before verification was enforced. Those are
   * treated as unverified rather than trusted, because signup used to hand out
   * a token immediately: an absent claim is exactly the population that could
   * never confirm. They expire within the 7-day token lifetime, after which
   * this branch goes cold.
   */
  email_verified?: boolean;
  [key: string]: unknown;
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

const BYPASS_USER_EMAIL = 'dev@partyhause.local';
const BYPASS_USER_NAME = 'Dev User';

function bypassUserId(): string {
  return process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001';
}

// The bypass identity must exist as real rows: connections, notifications,
// events, etc. all carry foreign keys to users/user_profiles, so a synthetic
// req.user with no backing row turns every authenticated WRITE into a P2003
// foreign-key 500 on a fresh database. Materialize it once per process
// (idempotent upserts); on failure, log once and continue — reads still work
// and the log explains any subsequent FK failures instead of them being
// mysterious.
let bypassUserReady: Promise<void> | null = null;

function ensureBypassUser(): Promise<void> {
  if (bypassUserReady === null) {
    const id = bypassUserId();
    // Username derived from the id: a fixed literal would collide (unique
    // constraint P2002) when AUTH_BYPASS_USER_ID changes against a dev DB
    // that already has the old bypass profile row.
    const username = `dev-${id.replace(/[^a-z0-9_]/gi, '_').slice(0, 40)}`.toLowerCase();
    bypassUserReady = (async () => {
      await prisma.user.upsert({
        where: { id },
        update: {},
        create: { id, email: BYPASS_USER_EMAIL, name: BYPASS_USER_NAME },
      });
      await prisma.userProfile.upsert({
        where: { id },
        update: {},
        create: { id, username, display_name: BYPASS_USER_NAME },
      });
    })().catch((err: unknown) => {
      console.warn(
        '[auth] AUTH_BYPASS user could not be materialized; will retry on the next request:',
        err instanceof Error ? err.message : err,
      );
      // Reset the cache so a transient failure (DB briefly down) is retried
      // by the next request instead of being latched until process restart.
      bypassUserReady = null;
    });
  }
  return bypassUserReady;
}

// Try to authenticate the request from its Bearer token. Returns true and
// sets req.user when the token verifies; returns false otherwise.
function applyVerifiedToken(req: AuthenticatedRequest): boolean {
  const token = extractToken(req);
  if (!token) return false;
  try {
      const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        email_verified: payload.email_verified === true,
      };
      return true;
  } catch {
    return false;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // A valid real session always wins. AUTH_BYPASS is a fallback for
  // credential-less local requests — it must not clobber genuine logins,
  // otherwise writes are attributed to the synthetic dev user instead of
  // the signed-in account.
  if (applyVerifiedToken(req)) {
    // A confirmed address is required, enforced here rather than only at
    // login so tokens minted before this change cannot walk past it. Those
    // carry no `email_verified` claim and are treated as unconfirmed; the
    // holder signs in again and receives one that does.
    //
    // Nothing is stranded by this. The only action an unconfirmed user needs
    // is resending their link, and POST /api/auth/resend-verification is
    // anonymous, so it never reaches this middleware.
    //
    // 403 with a code, not 401: the credentials are valid, so a 401 would send
    // the client into a re-login loop that cannot resolve anything.
    if (req.user?.email_verified !== true) {
      res.status(403).json({
        error: 'Email address not confirmed',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Confirm your email address to continue. Request a new link if it expired.',
      });
      return;
    }
    next();
    return;
  }

  if (authBypassEnabled()) {
    req.user = {
      id: bypassUserId(),
      email: BYPASS_USER_EMAIL,
      name: BYPASS_USER_NAME,
      // The synthetic dev user counts as confirmed; it can never complete a
      // real verification flow, and blocking it would break local work.
      email_verified: true,
    };
    void ensureBypassUser().then(() => next());
    return;
  }

  if (!extractToken(req)) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  res.status(401).json({ error: 'Invalid or expired token' });
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    // No credentials at all: stay anonymous even under AUTH_BYPASS —
    // optional-auth routes are expected to serve anonymous traffic.
    next();
    return;
  }

  if (applyVerifiedToken(req)) {
    next();
    return;
  }

  if (authBypassEnabled()) {
    req.user = {
      id: bypassUserId(),
      email: BYPASS_USER_EMAIL,
      name: BYPASS_USER_NAME,
      // The synthetic dev user counts as confirmed; it can never complete a
      // real verification flow, and blocking it would break local work.
      email_verified: true,
    };
    void ensureBypassUser().then(() => next());
    return;
  }

  // Token invalid — continue without user
  next();
}
