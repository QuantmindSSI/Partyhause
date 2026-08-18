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

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
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
      select: { id: true, email: true, name: true, created_at: true },
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
