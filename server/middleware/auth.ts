import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (authBypassEnabled()) {
    req.user = {
      id: process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001',
      email: 'dev@partyhause.local',
      name: 'Dev User',
    };
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  if (authBypassEnabled()) {
    req.user = {
      id: process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001',
      email: 'dev@partyhause.local',
      name: 'Dev User',
    };
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    // Token invalid — continue without user
  }

  next();
}
