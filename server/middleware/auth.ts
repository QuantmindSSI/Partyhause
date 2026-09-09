import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { prisma } from '../lib/prisma';
import { getJwtSecret } from '../lib/jwt-secret';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../lib/legal';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    email_verified: boolean;
    token_version: number;
  };
}

type AuthenticationResult =
  | 'authenticated'
  | 'invalid'
  | 'revoked'
  | 'unverified';

function authBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}

function extractToken(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

const BYPASS_USER_EMAIL = 'dev@partyhause.local';
const BYPASS_USER_NAME = 'Dev User';

function bypassUserId(): string {
  return process.env.AUTH_BYPASS_USER_ID || 'dev-user-00000000-0000-0000-0000-000000000001';
}

let bypassUserReady: Promise<void> | null = null;

async function ensureBypassUser(): Promise<void> {
  if (bypassUserReady === null) {
    const id = bypassUserId();
    const username = `dev_${id.replace(/[^a-z0-9_]/gi, '_').slice(0, 26)}`.toLowerCase();
    bypassUserReady = (async () => {
      await prisma.user.upsert({
        where: { id },
        update: {
          account_status: 'active',
          email_verified: true,
        },
        create: {
          id,
          email: BYPASS_USER_EMAIL,
          name: BYPASS_USER_NAME,
          account_status: 'active',
          email_verified: true,
          age_eligible: true,
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
        },
      });
      await prisma.userProfile.upsert({
        where: { id },
        update: {},
        create: { id, username, display_name: BYPASS_USER_NAME },
      });
    })().catch((error: unknown) => {
      bypassUserReady = null;
      throw error;
    });
  }
  await bypassUserReady;
}

/**
 * Verify a bearer JWT and bind it to the current database identity state.
 *
 * A valid signature is not sufficient. The user must still exist, remain
 * active, have a verified address, and carry the same token epoch as the JWT.
 * This database read is what makes logout, password reset, and deletion revoke
 * already-issued stateless tokens.
 */
async function applyVerifiedToken(req: AuthenticatedRequest, token: string): Promise<AuthenticationResult> {
  let payload: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (
      typeof verified === 'string'
      || typeof verified.sub !== 'string'
      || typeof verified.token_version !== 'number'
      || !Number.isInteger(verified.token_version)
      || verified.token_version < 0
    ) {
      return 'invalid';
    }
    payload = verified;
  } catch {
    return 'invalid';
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      email_verified: true,
      token_version: true,
      account_status: true,
    },
  });
  if (
    !user
    || user.account_status !== 'active'
    || user.token_version !== payload.token_version
  ) {
    return 'revoked';
  }
  if (!user.email_verified || payload.email_verified !== true) {
    return 'unverified';
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    email_verified: true,
    token_version: user.token_version,
  };
  return 'authenticated';
}

async function applyBypass(req: AuthenticatedRequest): Promise<void> {
  await ensureBypassUser();
  req.user = {
    id: bypassUserId(),
    email: BYPASS_USER_EMAIL,
    name: BYPASS_USER_NAME,
    email_verified: true,
    token_version: 0,
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);
  try {
    if (token) {
      const result = await applyVerifiedToken(req, token);
      if (result === 'authenticated') {
        next();
        return;
      }
      if (result === 'unverified') {
        res.status(403).json({
          error: 'Email address not confirmed',
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Confirm your email address to continue. Request a new link if it expired.',
        });
        return;
      }
    }

    if (authBypassEnabled()) {
      await applyBypass(req);
      next();
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Missing Authorization header', code: 'AUTH_REQUIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid, expired, or revoked token', code: 'SESSION_REVOKED' });
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    if (await applyVerifiedToken(req, token) === 'authenticated') {
      next();
      return;
    }
    req.user = undefined;
    if (authBypassEnabled()) {
      await applyBypass(req);
    }
    next();
  } catch (error) {
    next(error);
  }
}
