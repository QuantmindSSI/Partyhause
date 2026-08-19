import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
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
    const { Resend } = require('resend');
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
    console.log('\n=== EMAIL VERIFICATION LINK (dev mode) ===');
    console.log(verifyLink);
    console.log('==========================================\n');

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
router.post('/signup', async (req, res) => {
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
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Invalid verification link' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    if (!user.verification_token || !user.verification_token_expires) {
      return res.status(400).json({ error: 'No pending verification. Request a new link.' });
    }

    if (new Date() > user.verification_token_expires) {
      return res.status(400).json({ error: 'Verification link has expired. Request a new link.' });
    }

    const valid = await bcrypt.compare(token, user.verification_token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification link' });
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
router.post('/login', async (req, res) => {
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
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
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
    console.log('\n=== PASSWORD RESET LINK (dev mode) ===');
    console.log(resetLink);
    console.log('========================================\n');

    // Try to send email if Resend is configured
    const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    // Real Resend keys all start with "re_" — only skip obvious placeholders
    // (the previous `!includes('re_')` check rejected every real key).
    if (
      RESEND_API_KEY &&
      !RESEND_API_KEY.includes('placeholder') &&
      !RESEND_API_KEY.includes('your_resend')
    ) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'PartyHause <noreply@partyhause.com>',
          to: email,
          subject: 'Reset your PartyHause password',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        });
      } catch (emailErr) {
        console.warn('Failed to send reset email:', emailErr);
      }
    }

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.reset_token || !user.reset_token_expires) {
      return res.status(404).json({ error: 'Invalid or expired reset link' });
    }

    if (new Date() > user.reset_token_expires) {
      return res.status(400).json({ error: 'Reset link has expired' });
    }

    const valid = await bcrypt.compare(token, user.reset_token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid reset link' });
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
