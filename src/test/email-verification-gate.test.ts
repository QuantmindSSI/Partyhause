/**
 * Tests for the email-confirmation gate.
 *
 * WHY THIS EXISTS
 *   Signup used to return a usable 7-day token before the address was
 *   confirmed, and nothing downstream consulted `email_verified`. Proven
 *   against production: an account on an unroutable address reached
 *   /api/auth/me, /api/events and /api/users/suggested, all 200. The
 *   confirmation email was decorative.
 *
 *   Three separate gates were missing, so three separate things are asserted
 *   here. Fixing only login would have left every already-issued token valid
 *   for up to seven days, because tokens cannot be revoked.
 *
 * These exercise the middleware and token contract directly rather than
 * through HTTP, so they run without a database or a live server.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
  process.env.NODE_ENV = 'test';
  // AUTH_BYPASS must be off, or requireAuth short-circuits to the dev user.
  delete process.env.AUTH_BYPASS;
});

/** Minimal Express double capturing what the middleware answered. */
function makeResponse() {
  const out: { status: number | null; body: unknown } = { status: null, body: null };
  const res = {
    status(code: number) {
      out.status = code;
      return res;
    },
    json(payload: unknown) {
      out.body = payload;
      return res;
    },
  };
  return { res, out };
}

function requestWith(token: string) {
  return { headers: { authorization: `Bearer ${token}` } };
}

async function runRequireAuth(token: string) {
  const { requireAuth } = await import('../../server/middleware/auth');
  const { res, out } = makeResponse();
  const req = requestWith(token) as never;
  let passed = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireAuth(req, res as any, () => {
    passed = true;
  });
  return { passed, ...out };
}

describe('requireAuth email-confirmation gate', () => {
  it('admits a token whose address is confirmed', async () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.test', email_verified: true },
      SECRET,
      { expiresIn: '1h' },
    );
    const r = await runRequireAuth(token);
    expect(r.passed).toBe(true);
    expect(r.status).toBeNull();
  });

  it('rejects a token that explicitly says the address is unconfirmed', async () => {
    const token = jwt.sign(
      { sub: 'u2', email: 'c@d.test', email_verified: false },
      SECRET,
      { expiresIn: '1h' },
    );
    const r = await runRequireAuth(token);
    expect(r.passed).toBe(false);
    expect(r.status).toBe(403);
    expect(r.body).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
  });

  it('rejects a legacy token carrying no claim at all', async () => {
    // This is the population signup used to create: a valid signature, no
    // claim, and an address nobody proved they owned. Absence must not be
    // read as permission.
    const token = jwt.sign({ sub: 'u3', email: 'e@f.test' }, SECRET, { expiresIn: '1h' });
    const r = await runRequireAuth(token);
    expect(r.passed).toBe(false);
    expect(r.status).toBe(403);
  });

  it('answers 403 rather than 401 so the client does not loop on re-login', async () => {
    const token = jwt.sign({ sub: 'u4', email: 'g@h.test' }, SECRET, { expiresIn: '1h' });
    const r = await runRequireAuth(token);
    // 401 would tell the client the credentials are wrong. They are not; the
    // password is fine and the address is unconfirmed, so a re-login loop
    // could never resolve it.
    expect(r.status).not.toBe(401);
    expect(r.status).toBe(403);
  });

  it('still rejects a forged token before ever considering the claim', async () => {
    const forged = jwt.sign(
      { sub: 'u5', email: 'i@j.test', email_verified: true },
      'a-completely-different-signing-key-value',
      { expiresIn: '1h' },
    );
    const r = await runRequireAuth(forged);
    expect(r.passed).toBe(false);
    // Signature failure is an authentication problem, not a confirmation one.
    expect(r.status).toBe(401);
  });

  it('rejects an expired token even when the address was confirmed', async () => {
    const expired = jwt.sign(
      { sub: 'u6', email: 'k@l.test', email_verified: true },
      SECRET,
      { expiresIn: '-1s' },
    );
    const r = await runRequireAuth(expired);
    expect(r.passed).toBe(false);
    expect(r.status).toBe(401);
  });
});
