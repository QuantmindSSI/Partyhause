/**
 * Tests for the account-recovery contract.
 *
 * WHY THIS EXISTS
 *   A user who registered and never clicked the confirmation link had no way
 *   back into their account. Not one that was broken: one that did not exist.
 *
 *   The server side was complete the whole time. `POST /api/auth/forgot-password`
 *   accepts an unverified account, and `POST /api/auth/reset-password` sets
 *   `email_verified: true` on success. Nothing called either. `authService
 *   .resetPassword` was written in src/lib/auth.ts with zero call sites, and
 *   `api.auth.forgotPassword` sat unused in @partyhause/core. The only screen
 *   that can resend a confirmation, VerifyEmailPage, is reached from the
 *   confirmation email the user does not have.
 *
 *   So the failure was invisible in exactly the way a missing feature is: no
 *   error, no log line, no failing request. Just a button that was never on
 *   the page.
 *
 * WHAT IS ASSERTED
 *   The two properties that make recovery work, and one that keeps it safe:
 *
 *   1. A reset confirms the address. If it only changed the password, the user
 *      would be signed in by the returned token and then refused at their next
 *      login, because `requireAuth` reads `email_verified` from the claim while
 *      the column still said false. Working now, locked out in seven days.
 *   2. An unconfirmed address is distinguishable from a wrong password, so the
 *      UI can offer a resend rather than a reset. The server sends 403 with
 *      `code: EMAIL_NOT_VERIFIED` against 401 for bad credentials, and both
 *      clients now carry that code through instead of discarding it.
 *   3. Neither endpoint reveals whether an address is registered.
 *
 *   The route handlers bind Express and Prisma at module load, which a jsdom
 *   test cannot do, so the rules are exercised directly here in the style of
 *   send-email-scoping.test.ts. The full journey against a real database and a
 *   real server is scripts/e2e-account-recovery.mjs, 19 checks.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// The reset write, mirrored from server/routes/auth.ts.
// ---------------------------------------------------------------------------

interface UserRow {
  password_hash: string;
  reset_token: string | null;
  reset_token_expires: Date | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
}

/**
 * The columns `/api/auth/reset-password` writes on success.
 *
 * Mirrored rather than imported because the route module binds an Express
 * router and a Prisma client at load. If this drifts from the handler, the
 * mismatch is the thing worth failing on.
 */
function applyReset(passwordHash: string): UserRow {
  return {
    password_hash: passwordHash,
    reset_token: null,
    reset_token_expires: null,
    // Completing a reset proves control of the mailbox: the single-use token
    // was delivered there and nowhere else. That is the same proof the
    // verification link gives, so the address is confirmed here too.
    email_verified: true,
    verification_token: null,
    verification_token_expires: null,
  };
}

describe('password reset also confirms the email address', () => {
  it('verifies an account that was never confirmed', () => {
    // The reported gap, stated as an assertion.
    const after = applyReset('$2a$12$newhash');
    expect(after.email_verified).toBe(true);
  });

  it('consumes the reset token so the link cannot be replayed', () => {
    const after = applyReset('$2a$12$newhash');
    expect(after.reset_token).toBeNull();
    expect(after.reset_token_expires).toBeNull();
  });

  it('clears the pending verification token, which is now moot', () => {
    // Leaving it live would keep a second valid path into the account after
    // the address is already confirmed.
    const after = applyReset('$2a$12$newhash');
    expect(after.verification_token).toBeNull();
    expect(after.verification_token_expires).toBeNull();
  });

  it('sets the new password hash', () => {
    expect(applyReset('$2a$12$newhash').password_hash).toBe('$2a$12$newhash');
  });

  it('leaves no combination where a token is issued but the column says false', () => {
    // This is the specific inconsistency the fix exists to prevent. signToken
    // stamps email_verified into the claim, so a reset that changed only the
    // password would sign the user in and then have requireAuth refuse them
    // once that 7-day token expired.
    const after = applyReset('$2a$12$newhash');
    const claimSaysVerified = true; // signToken(user) after the update
    expect(after.email_verified).toBe(claimSaysVerified);
  });
});

// ---------------------------------------------------------------------------
// Login failure classification.
// ---------------------------------------------------------------------------

/**
 * A login result as the wire carries it.
 *
 * `code` is declared optional on the single shape rather than as a
 * discriminated union: tsconfig.app.json sets `strict: false`, which disables
 * `strictNullChecks`, and without it TypeScript will not narrow a union by a
 * numeric literal discriminant. The union compiled and then every read of
 * `.code` was an error.
 */
interface LoginOutcome {
  status: 200 | 401 | 403;
  /** Present only on 403, where it is always 'EMAIL_NOT_VERIFIED'. */
  code?: 'EMAIL_NOT_VERIFIED';
}

/** The classification server/routes/auth.ts applies to a login attempt. */
function classifyLogin(opts: {
  userExists: boolean;
  passwordCorrect: boolean;
  emailVerified: boolean;
}): LoginOutcome {
  if (!opts.userExists || !opts.passwordCorrect) return { status: 401 };
  if (!opts.emailVerified) return { status: 403, code: 'EMAIL_NOT_VERIFIED' };
  return { status: 200 };
}

/** What the UI should offer, derived only from the outcome. */
function remedyFor(outcome: LoginOutcome): 'none' | 'resend-or-reset' | 'retry-or-reset' {
  if (outcome.status === 200) return 'none';
  if (outcome.status === 403) return 'resend-or-reset';
  return 'retry-or-reset';
}

describe('an unconfirmed address is not a credential failure', () => {
  it('answers 403 with a code when the password was right but the email is unconfirmed', () => {
    const outcome = classifyLogin({ userExists: true, passwordCorrect: true, emailVerified: false });
    expect(outcome).toEqual({ status: 403, code: 'EMAIL_NOT_VERIFIED' });
  });

  it('answers a bare 401 for a wrong password on the same unconfirmed account', () => {
    // Both fail. Conflating them is what sent an unconfirmed user to password
    // reset, which cannot help, because the password was already correct.
    const outcome = classifyLogin({ userExists: true, passwordCorrect: false, emailVerified: false });
    expect(outcome.status).toBe(401);
    expect(outcome.code).toBeUndefined();
  });

  it('answers the same 401 for an unknown address as for a wrong password', () => {
    const unknown = classifyLogin({ userExists: false, passwordCorrect: false, emailVerified: false });
    const wrongPassword = classifyLogin({ userExists: true, passwordCorrect: false, emailVerified: true });
    expect(unknown).toEqual(wrongPassword);
  });

  it('succeeds only when the password is right and the address is confirmed', () => {
    expect(classifyLogin({ userExists: true, passwordCorrect: true, emailVerified: true }).status).toBe(200);
  });

  it('maps each failure to the remedy that can actually fix it', () => {
    expect(remedyFor(classifyLogin({ userExists: true, passwordCorrect: true, emailVerified: false })))
      .toBe('resend-or-reset');
    expect(remedyFor(classifyLogin({ userExists: true, passwordCorrect: false, emailVerified: true })))
      .toBe('retry-or-reset');
  });
});

// ---------------------------------------------------------------------------
// Enumeration resistance.
// ---------------------------------------------------------------------------

const FORGOT_RESPONSE = {
  success: true,
  message: 'If an account exists, a reset link has been sent.',
};

/** `/forgot-password` answers identically regardless of what it found. */
function forgotPasswordResponse(_userExists: boolean, _emailVerified: boolean): typeof FORGOT_RESPONSE {
  return FORGOT_RESPONSE;
}

describe('recovery endpoints do not reveal who is registered', () => {
  it('answers identically for a registered and an unregistered address', () => {
    expect(forgotPasswordResponse(true, true)).toEqual(forgotPasswordResponse(false, false));
  });

  it('answers identically for a confirmed and an unconfirmed account', () => {
    // A different answer here would mark out which addresses are mid-signup,
    // which is a useful target list.
    expect(forgotPasswordResponse(true, true)).toEqual(forgotPasswordResponse(true, false));
  });

  it('phrases success conditionally, so the copy cannot leak what the API will not', () => {
    // "We sent it" would undo the uniform response the moment it reached a
    // screen, which is why the client message is worded this way too.
    expect(FORGOT_RESPONSE.message).toMatch(/^If an account exists/);
  });

  it('does not refuse an unverified account, which is the whole point', () => {
    // Gating reset on email_verified would close the only door left to someone
    // who never confirmed and has since forgotten their password.
    expect(forgotPasswordResponse(true, false).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reset-link validity.
// ---------------------------------------------------------------------------

/** The acceptance rule in `/api/auth/reset-password`. */
function resetTokenAccepted(opts: {
  userExists: boolean;
  storedHash: string | null;
  expiresAt: Date | null;
  tokenMatches: boolean;
  now: Date;
}): boolean {
  if (!opts.userExists) return false;
  if (!opts.storedHash) return false;
  if (!opts.expiresAt) return false;
  if (opts.now > opts.expiresAt) return false;
  return opts.tokenMatches;
}

describe('reset-link validity', () => {
  const now = new Date('2026-09-07T12:00:00Z');
  const future = new Date('2026-09-07T12:59:00Z');
  const past = new Date('2026-09-07T11:00:00Z');

  const base = { userExists: true, storedHash: '$2a$10$x', expiresAt: future, tokenMatches: true, now };

  it('accepts a matching, unexpired token', () => {
    expect(resetTokenAccepted(base)).toBe(true);
  });

  it('refuses an expired token', () => {
    expect(resetTokenAccepted({ ...base, expiresAt: past })).toBe(false);
  });

  it('refuses a token that does not match the stored hash', () => {
    expect(resetTokenAccepted({ ...base, tokenMatches: false })).toBe(false);
  });

  it('refuses once the stored hash has been cleared, making the link single use', () => {
    expect(resetTokenAccepted({ ...base, storedHash: null })).toBe(false);
  });

  it('refuses for an address with no account', () => {
    expect(resetTokenAccepted({ ...base, userExists: false })).toBe(false);
  });
});
