import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
  };
}

// Read lazily at verification time: this module is imported (and hoisted)
// BEFORE server/index.ts runs dotenv.config(), so a module-load-time constant
// silently ignored any JWT_SECRET provided via .env and fell back to the dev
// default.
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'partyhause-dev-jwt-secret-change-in-production';
}

// AUTH_BYPASS is a local-development escape hatch only — never honored in
// production builds.
function authBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
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
    next();
    return;
  }

  if (authBypassEnabled()) {
    req.user = {
      id: bypassUserId(),
      email: BYPASS_USER_EMAIL,
      name: BYPASS_USER_NAME,
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
    };
    void ensureBypassUser().then(() => next());
    return;
  }

  // Token invalid — continue without user
  next();
}
