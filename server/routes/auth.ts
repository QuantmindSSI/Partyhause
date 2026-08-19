import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Credential endpoints are the brute-force surface: 20 attempts / 15 min
// per IP across login/signup/forgot/reset/verify. Generous for humans
// (mistyped passwords), hostile to scripts.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});
// Read lazily (not at module load): imports are hoisted above
// dotenv.config() in server/index.ts, so a module-load constant ignores
// .env-provided secrets. MUST match middleware/auth.ts getJwtSecret().
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'partyhause-dev-jwt-secret-change-in-production';
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

function signToken(user: { id: string; email: string; name?: string | null }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Send a transactional auth email via Resend. Returns true when the email
 * was handed to Resend, false when Resend is unconfigured or the send
 * failed. Callers must treat false as non-fatal: auth flows always print
 * the actionable link to the server log so local development works with no
 * email provider at all.
 */
async function sendAuthEmail(to: string, subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (
    !RESEND_API_KEY ||
    RESEND_API_KEY.includes('placeholder') ||
    RESEND_API_KEY.includes('your_resend')
  ) {
    return false;
  }
  try {
    // Top-level ESM import: `require()` does not exist under tsx/ESM and
    // previously threw here on every call, silently disabling all email.
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PartyHause <noreply@partyhause.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (emailErr) {
    console.warn(`Failed to send "${subject}" email:`, emailErr);
    return false;
  }
}

/**
 * Development aid: print an auth link to the server log so flows work with
 * no email provider. NEVER runs in production — raw tokens in production
 * logs would let anyone with log access take over the flow.
 */
function logAuthLinkInDev(label: string, link: string): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  console.log(`\n=== ${label} (dev mode) ===`);
  console.log(link);
  console.log('='.repeat(label.length + 16) + '\n');
}

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a fresh verification token for the user, persist its bcrypt hash,
 * and send (or log, in dev) the verification link. Failures are contained:
 * signup must never fail because the verification email could not be sent.
 */
async function issueVerificationEmail(user: { id: string; email: string }): Promise<void> {
  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verification_token: tokenHash,
        verification_token_expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const verifyLink = `${APP_URL}/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    logAuthLinkInDev('EMAIL VERIFICATION LINK', verifyLink);

    await sendAuthEmail(
      user.email,
      'Verify your PartyHause email',
      `<p>Welcome to PartyHause! Click <a href="${verifyLink}">here</a> to verify your email address. This link expires in 24 hours.</p>`,
    );
  } catch (err) {
    console.warn('Failed to issue verification email:', err);
  }
}

// POST /api/auth/signup
router.post('/signup', credentialLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password_hash,
      },
    });

    // Auto-create user_profile
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await prisma.userProfile.create({
      data: {
        id: user.id,
        username,
        display_name: name || username,
      },
    });

    const token = signToken(user);

    // Fire the verification email after the account exists. Non-blocking
    // for the response only in effect: we await so serverless-style runtimes
    // don't drop the work, but failures inside are contained and logged.
    await issueVerificationEmail({ id: user.id, email: user.email });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, email_verified: false },
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-email — completes the email-verification loop.
// Unauthenticated by necessity (the user clicks a link from their inbox),
// so every failure mode returns ONE uniform response: distinct unknown-email /
// already-verified / expired / mismatch answers let anyone probe which
// addresses have accounts and their verification state.
const VERIFY_FAILURE = {
  error: 'Invalid or expired verification link. Request a new one, or simply log in if you already verified.',
} as const;

router.post('/verify-email', credentialLimiter, async (req, res) => {
  try {
    const { email, token } = req.body;

    if (typeof email !== 'string' || typeof token !== 'string' || !email || !token) {
      return res.status(400).json(VERIFY_FAILURE);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      user.email_verified ||
      !user.verification_token ||
      !user.verification_token_expires ||
      new Date() > user.verification_token_expires
    ) {
      return res.status(400).json(VERIFY_FAILURE);
    }

    const valid = await bcrypt.compare(token, user.verification_token);
    if (!valid) {
      return res.status(400).json(VERIFY_FAILURE);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      },
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/resend-verification — re-issues the verification link for
// the signed-in user. Idempotent for already-verified accounts.
router.post('/resend-verification', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    await issueVerificationEmail({ id: user.id, email: user.email });
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', credentialLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, created_at: true, email_verified: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
    });

    res.json({ ...user, profile });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', credentialLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Uniform response whether or not the account exists — a distinct
    // "no account" answer lets anyone enumerate registered addresses.
    const uniformResponse = { success: true, message: 'If an account exists, a reset link has been sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json(uniformResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetTokenHash,
        reset_token_expires: resetExpires,
      },
    });

    const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    logAuthLinkInDev('PASSWORD RESET LINK', resetLink);

    await sendAuthEmail(
      email,
      'Reset your PartyHause password',
      `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    );

    res.json(uniformResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', credentialLimiter, async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Uniform failure response — see /verify-email for the enumeration rationale.
    const RESET_FAILURE = { error: 'Invalid or expired reset link. Request a new one.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      !user.reset_token ||
      !user.reset_token_expires ||
      new Date() > user.reset_token_expires
    ) {
      return res.status(400).json(RESET_FAILURE);
    }

    const valid = await bcrypt.compare(token, user.reset_token);
    if (!valid) {
      return res.status(400).json(RESET_FAILURE);
    }

    const password_hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    const authToken = signToken(user);

    res.json({ success: true, message: 'Password reset successfully', token: authToken });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — no-op for JWT, client discards token
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;
