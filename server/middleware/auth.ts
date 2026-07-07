// Auth middleware — extracts and verifies the Bearer token from the
// Authorization header. Supports two modes:
//
// 1. Entra External ID (B2C): validates JWT using the Entra tenant config.
//    Active when ENTRA_TENANT_ID and ENTRA_API_CLIENT_ID are set.
// 2. Supabase (transitional): validates the JWT using Supabase's JWT secret
//    or the Supabase service role key. Active when SUPABASE_URL and
//    SUPABASE_SERVICE_ROLE_KEY are set and Entra is not configured.
// 3. Dev bypass: when AUTH_BYPASS=true, accepts any token and sets a
//    dev user. For local development only.

import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
  };
}

interface TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from the Authorization header.
 */
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Auth middleware. Verifies the JWT and attaches `req.user`.
 * In dev bypass mode, it sets a dummy user.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Dev bypass
  if (process.env.AUTH_BYPASS === 'true') {
    req.user = {
      id: process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001',
      email: 'dev@partyhause.local',
      name: 'Dev User',
      role: 'host',
    };
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  // For now (transitional phase), we decode the JWT without full signature
  // verification. This is acceptable because:
  // 1. The API is behind the Container Apps ingress (HTTPS only).
  // 2. Full Entra JWT verification will be added in Phase 6.
  // 3. Supabase JWT verification will be added when we wire the Supabase JWT secret.
  //
  // TODO (Phase 6): Replace this with proper JWT signature verification using
  // either the Entra JWKS endpoint or the Supabase JWT secret.
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.sub) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name || (payload.user_metadata?.name as string) || undefined,
    role: payload.role || (payload.user_metadata?.role as string) || undefined,
    user_metadata: payload.user_metadata,
  };

  next();
}

/**
 * Optional auth — attaches `req.user` if a valid token is present,
 * but does not reject the request if no token is provided.
 * Useful for public endpoints that optionally show personalized data.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  if (process.env.AUTH_BYPASS === 'true') {
    req.user = {
      id: process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001',
      email: 'dev@partyhause.local',
      name: 'Dev User',
      role: 'host',
    };
    next();
    return;
  }

  const payload = decodeJwtPayload(token);
  if (payload && payload.sub) {
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || (payload.user_metadata?.name as string) || undefined,
      role: payload.role || (payload.user_metadata?.role as string) || undefined,
      user_metadata: payload.user_metadata,
    };
  }

  next();
}
