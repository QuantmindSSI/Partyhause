import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { type PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { getJwtSecret } from '../lib/jwt-secret';
import { sendEmail } from '../lib/email';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../lib/legal';

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
// getJwtSecret is imported from ../lib/jwt-secret, which is the single source
// of truth shared with middleware/auth.ts. It reads lazily (imports are hoisted
// above dotenv.config() in server/index.ts) and refuses the committed
// development key in production.
const DEFAULT_EXPIRES_IN = '7d';

/**
 * Resolve the token lifetime from the environment.
 *
 * jsonwebtoken accepts either a number of seconds or an ms-style duration
 * string such as "7d" or "12h". Environment variables are untyped strings, so
 * validate the shape here rather than casting: an unparseable value otherwise
 * passes the type checker and throws inside jwt.sign on the first login.
 *
 * @returns A validated lifetime, falling back to {@link DEFAULT_EXPIRES_IN}.
 */
function resolveExpiresIn(): SignOptions['expiresIn'] {
  const raw = process.env.JWT_EXPIRES_IN?.trim();
  if (!raw) return DEFAULT_EXPIRES_IN;
  if (/^\d+$/.test(raw)) return Number(raw);
  if (/^\d+(\.\d+)?(ms|s|m|h|d|w|y)$/i.test(raw)) {
    return raw as SignOptions['expiresIn'];
  }
  console.warn(
    `[auth] JWT_EXPIRES_IN="${raw}" is not a valid duration; using ${DEFAULT_EXPIRES_IN}.`,
  );
  return DEFAULT_EXPIRES_IN;
}

const JWT_EXPIRES_IN = resolveExpiresIn();
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize an email at every account lookup and write boundary. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized) ? normalized : null;
}

function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
}

export interface SignupAccountInput {
  email: string;
  name: string;
  displayName: string;
  passwordHash: string;
  ageEligible: true;
  termsVersion: string;
  privacyVersion: string;
}

/**
 * Derive a profile username from the complete 128-bit UUID value.
 *
 * Base-36 keeps the full UUID entropy while satisfying the profile constraint
 * of 3-30 alphanumeric/underscore characters. Two usernames collide only when
 * their source UUIDs are identical.
 */
export function usernameFromUuid(userId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('usernameFromUuid: userId must be a UUID');
  }
  const hex = userId.replace(/-/g, '');
  const username = `u_${BigInt(`0x${hex}`).toString(36)}`;
  if (username.length < 3 || username.length > 30) {
    throw new Error('usernameFromUuid: derived username violates the 3-30 character constraint');
  }
  return username;
}

/**
 * Create the identity and its required profile in one database transaction.
 * A profile failure rejects the transaction, so signup cannot leave an
 * identity row that can never complete account setup.
 */
export async function createSignupAccount(
  database: Pick<PrismaClient, '$transaction'>,
  input: SignupAccountInput,
  userId = crypto.randomUUID(),
) {
  const username = usernameFromUuid(userId);
  return database.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: userId,
        email: input.email,
        name: input.name,
        password_hash: input.passwordHash,
        age_eligible: input.ageEligible,
        terms_version: input.termsVersion,
        privacy_version: input.privacyVersion,
      },
    });

    await tx.userProfile.create({
      data: {
        id: user.id,
        username,
        display_name: input.displayName,
      },
    });
    return user;
  });
}

/** True when Prisma reports a unique conflict on the email field. */
export function isDuplicateEmailError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || (error as { code?: unknown }).code !== 'P2002') {
    return false;
  }

  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  if (target === undefined || target === null) {
    return true;
  }
  const fields = Array.isArray(target) ? target : [target];
  return fields.some((field) => String(field).toLowerCase().includes('email'));
}

/**
 * Mint a session token.
 *
 * `token_version` binds the token to the current database session epoch.
 * Middleware checks both it and the account state on every authenticated call.
 */
export function signToken(user: {
  id: string;
  email: string;
  name?: string | null;
  token_version: number;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      email_verified: true,
      token_version: user.token_version,
    },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Send a transactional auth email through the shared transport
 * (Azure Communication Services, with Resend as fallback).
 *
 * @returns true when a provider accepted the message.
 *
 * A false result is non-fatal for signup: auth flows also print the actionable
 * link to the server log outside production. It is NOT silent, though. Every
 * failure is logged at error level with the provider's own message, because
 * the previous behaviour hid a completely dead email pipeline behind a warning
 * nobody read, which left password reset unreachable.
 */
async function sendAuthEmail(to: string, subject: string, html: string): Promise<boolean> {
  const result = await sendEmail({ to, subject, html });
  if (result.ok) return true;
  console.error(
    `[auth] email "${subject}" was rejected by ${result.provider}`,
  );
  return false;
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
 * Body of the address-confirmation email.
 *
 * The previous version was a single unstyled `<p>` containing the word "here"
 * as the only link. That is the exact shape spam filters score against, and it
 * gives the reader nothing to judge legitimacy by. Confirmation is now a
 * blocking step for access, so this email failing to arrive or failing to be
 * trusted means the account is unusable.
 *
 * Deliberate choices:
 *   - the destination is shown in full as text, so the reader can see where the
 *     link goes without hovering, and can paste it if the button is stripped
 *   - table-based layout with inline styles, because Gmail and Outlook discard
 *     <style> blocks and most flexbox
 *   - states the expiry in words, and says what happens if they did not sign up
 *
 * @param verifyLink Absolute URL carrying the single-use token.
 */
function verificationEmailHtml(verifyLink: string): string {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f6f6f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2330;">
        <tr><td style="font-size:20px;font-weight:700;padding-bottom:8px;">Confirm your email address</td></tr>
        <tr><td style="font-size:15px;line-height:22px;color:#454b5c;padding-bottom:24px;">
          Thanks for creating a PartyHause account. Confirm this address to finish setting it up and sign in.
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${verifyLink}" style="display:inline-block;background:#C02A16;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;">Confirm email address</a>
        </td></tr>
        <tr><td style="font-size:13px;line-height:20px;color:#6b7280;padding-bottom:8px;">
          If the button does not work, paste this into your browser:
        </td></tr>
        <tr><td style="font-size:12px;line-height:18px;color:#972317;word-break:break-all;padding-bottom:24px;">${verifyLink}</td></tr>
        <tr><td style="font-size:13px;line-height:20px;color:#6b7280;border-top:1px solid #e6e8ee;padding-top:16px;">
          This link expires in 24 hours. If you did not create a PartyHause account, you can ignore this email and nothing will happen.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a fresh verification token for the user, persist its bcrypt hash,
 * and send (or log, in dev) the verification link. Failures are contained:
 * signup must never fail because the verification email could not be sent.
 */
async function issueVerificationEmail(user: { id: string; email: string }): Promise<boolean> {
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

    return await sendAuthEmail(
      user.email,
      'Confirm your PartyHause email address',
      verificationEmailHtml(verifyLink),
    );
  } catch (err) {
    const errorType = err instanceof Error ? err.name : 'UnknownError';
    console.warn(`Failed to issue verification email: ${errorType}`);
    return false;
  }
}

// POST /api/auth/signup
router.post('/signup', credentialLimiter, async (req, res) => {
  try {
    const { email, password, name, ageEligible, termsVersion, privacyVersion } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'A valid email and password are required' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length > 100)) {
      return res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    }

    if (
      ageEligible !== true
      || termsVersion !== CURRENT_TERMS_VERSION
      || privacyVersion !== CURRENT_PRIVACY_VERSION
    ) {
      return res.status(400).json({
        code: 'LEGAL_CONSENT_REQUIRED',
        error: 'Current age eligibility, Terms, and Privacy consent are required',
        legal: {
          termsVersion: CURRENT_TERMS_VERSION,
          privacyVersion: CURRENT_PRIVACY_VERSION,
        },
      });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const accountName = typeof name === 'string' && name.trim()
      ? name.trim()
      : normalizedEmail.split('@')[0];
    const user = await createSignupAccount(prisma, {
      email: normalizedEmail,
      name: accountName,
      displayName: accountName,
      passwordHash,
      ageEligible: true,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
    });

    // createSignupAccount resolves only after its transaction commits. Issue
    // verification after that boundary, and await it so serverless-style
    // runtimes do not drop the work. Delivery failures remain contained and
    // logged by the helper.
    const verificationAccepted = await issueVerificationEmail({ id: user.id, email: user.email });

    // Deliberately NO token. Signup used to return one immediately, so an
    // address nobody controlled reached every authenticated route with a
    // 7-day credential and the confirmation link was decorative. Access now
    // starts at login, which refuses unconfirmed accounts.
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, email_verified: false },
      verificationDelivery: verificationAccepted ? 'accepted' : 'unavailable',
      message: verificationAccepted
        ? 'Account created. Check your email for a confirmation link before signing in.'
        : 'Account created, but the confirmation email was not accepted. Use Resend Confirmation to try again.',
    });
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
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
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof token !== 'string' || !token) {
      return res.status(400).json(VERIFY_FAILURE);
    }

    const user = await findUserByEmail(normalizedEmail);
    if (
      !user ||
      user.email_verified ||
      user.account_status !== 'active' ||
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

/**
 * POST /api/auth/resend-verification
 *
 * Anonymous by design. This used to sit behind `requireAuth`, which was
 * survivable only while signup handed out a token. Now that an unconfirmed
 * account cannot obtain one, requiring a session here would make it the one
 * endpoint a locked-out user needs and cannot reach.
 *
 * Answers identically whether or not the address exists, so it cannot be used
 * to enumerate registered accounts. `credentialLimiter` bounds how often it
 * can generate mail for an address the caller does not own.
 */
router.post('/resend-verification', credentialLimiter, async (req, res) => {
  const genericResponse = {
    success: true,
    message: 'If that address needs confirming and delivery succeeds, a new link will arrive shortly.',
  };

  try {
    const { email } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const user = await findUserByEmail(normalizedEmail);

    // No account, or already confirmed: same answer either way. Saying
    // "already verified" would confirm the address is registered.
    if (!user || user.email_verified || user.account_status !== 'active') {
      return res.json(genericResponse);
    }

    await issueVerificationEmail({ id: user.id, email: user.email });
    res.json(genericResponse);
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', credentialLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string' || !password || password.length > 128) {
      return res.status(400).json({ error: 'A valid email and password are required' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({
        code: 'ACCOUNT_UNAVAILABLE',
        error: 'This account is unavailable',
      });
    }

    // Confirmed address required. Distinct from the 401 above on purpose: the
    // credentials were correct, so telling the client "invalid email or
    // password" would send the user round a password-reset loop that cannot
    // help. The code lets the client offer "resend confirmation" instead.
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email address not confirmed',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Confirm your email address to sign in. We can send a new link.',
      });
    }

    const token = signToken(user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, email_verified: true },
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
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        email_verified: true,
        account_status: true,
      },
    });

    if (!user || user.account_status !== 'active') {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      email_verified: user.email_verified,
      profile,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', credentialLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    // Uniform response whether or not the account exists — a distinct
    // "no account" answer lets anyone enumerate registered addresses.
    const uniformResponse = {
      success: true,
      message: 'If an active account exists and delivery succeeds, reset instructions will arrive shortly.',
    };

    const user = await findUserByEmail(normalizedEmail);
    if (!user || user.account_status !== 'active') {
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

    const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    logAuthLinkInDev('PASSWORD RESET LINK', resetLink);

    await sendAuthEmail(
      user.email,
      'Reset your PartyHause password',
      `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    );

    return res.json(uniformResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', credentialLimiter, async (req, res) => {
  try {
    const { token, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (typeof token !== 'string' || !token || !normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'Token, email, and password are required' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    }

    // Uniform failure response — see /verify-email for the enumeration rationale.
    const RESET_FAILURE = { error: 'Invalid or expired reset link. Request a new one.' };

    const user = await findUserByEmail(normalizedEmail);
    if (
      !user ||
      user.account_status !== 'active' ||
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
    const resetUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token: null,
        reset_token_expires: null,
        // Completing a reset proves control of the mailbox: the single-use
        // token was delivered there and nowhere else. That is the same proof
        // the verification link provides, so the address is confirmed here
        // too.
        //
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
        token_version: { increment: 1 },
      },
    });

    // Signed from the UPDATED row, so the token carries the incremented
    // token_version. Signing from `user`, which was read before the update,
    // would mint a token one epoch behind and requireAuth would reject it
    // immediately: the reset would appear to succeed and every subsequent
    // request would 401.
    //
    // The increment above is what revokes sessions, and it revokes every
    // other one. That is the behaviour a reset should have: the person who
    // just proved control of the mailbox stays signed in here, and any
    // session an attacker was holding dies. Issuing nothing at all would
    // revoke the attacker too, but it would also sign out the legitimate
    // user at the exact moment they finished proving who they were.
    const authToken = signToken(resetUser);

    // `user` is returned alongside the token, matching the login response.
    // The web client stores the token and the cached user under two separate
    // keys and hydrates only when BOTH are present (src/hooks/use-auth.ts),
    // so a token-only response is a valid session the app renders as signed
    // out.
    res.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        id: resetUser.id,
        email: resetUser.email,
        name: resetUser.name,
        email_verified: true,
      },
      token: authToken,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - incrementing the epoch revokes every outstanding JWT.
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { token_version: { increment: 1 } },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
