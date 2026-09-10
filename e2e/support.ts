/**
 * Shared helpers for the browser end-to-end flow.
 *
 * Two things here are worth understanding before changing them.
 *
 * The verification and reset links are read from the API's stdout, not from a
 * mailbox. `server/routes/auth.ts` prints them only when NODE_ENV is not
 * 'production', which is exactly why the suite requires the API to be started
 * with NODE_ENV=test. There is no mail provider in local development, so this
 * is the only way to obtain a real token, and it is the same mechanism the
 * database-backed scripts in scripts/e2e-*.mjs already rely on.
 *
 * The consent versions are imported from src/lib/legal.ts rather than written
 * as literals. The signup route compares them for exact equality against its
 * own constants, so a literal here would let a version bump pass a test that
 * exists to prove client and server agree.
 */

import { readFileSync } from 'node:fs';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../src/lib/legal';

export const API_LOG = process.env.E2E_API_LOG ?? '/tmp/e2e-api.log';
export const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:3001';

export const CONSENT = {
  ageEligible: true as const,
  termsVersion: CURRENT_TERMS_VERSION,
  privacyVersion: CURRENT_PRIVACY_VERSION,
};

/** A run-unique suffix so repeated runs never collide on the email unique index. */
export const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export function emailFor(local: string): string {
  return `${local}.${RUN_ID}@e2e.local`;
}

/**
 * Pull the most recent auth link for one address out of the API log.
 *
 * @param kind Which link to look for. 'verify-email' confirms an address;
 *   'reset-password' begins recovery.
 * @param email The address the link was issued to. Matching on it matters:
 *   the log accumulates across the whole run and the newest link for a
 *   different account would otherwise be returned.
 * @returns The token, never the whole URL, because every caller needs the token.
 * @throws If no matching link has been printed, which almost always means the
 *   API was started without NODE_ENV=test.
 */
export function tokenFromApiLog(kind: 'verify-email' | 'reset-password', email: string): string {
  const log = readFileSync(API_LOG, 'utf8');
  const encoded = encodeURIComponent(email);
  const pattern = new RegExp(
    `/auth/${kind}\\?token=([a-f0-9]+)&email=(?:${encoded}|${email})`,
    'gi',
  );

  let token: string | null = null;
  for (let match = pattern.exec(log); match !== null; match = pattern.exec(log)) {
    token = match[1];
  }

  if (!token) {
    throw new Error(
      `No ${kind} link for ${email} in ${API_LOG}.\n`
      + 'The API prints auth links only when NODE_ENV is not "production". '
      + 'Start it with NODE_ENV=test, as e2e/README.md describes.',
    );
  }
  return token;
}

/** Wait for the API log to contain a link for this address, then return its token. */
export async function waitForToken(
  kind: 'verify-email' | 'reset-password',
  email: string,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      return tokenFromApiLog(kind, email);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export interface Session {
  token: string;
  user: { id: string; email: string; name?: string };
}

/**
 * Create a confirmed account straight through the API.
 *
 * Used for the supporting cast only. The account under test goes through the
 * real signup form in the browser, because that is what the suite is for; a
 * committee member who exists only to receive an invitation does not need
 * three page loads to come into being.
 */
export async function createVerifiedUser(
  request: APIRequestContext,
  email: string,
  password: string,
  name: string,
): Promise<Session> {
  const signup = await request.post(`${API_BASE}/api/auth/signup`, {
    data: { email, password, name, ...CONSENT },
  });
  expect(signup.status(), `signup for ${email}`).toBe(201);

  const token = await waitForToken('verify-email', email);
  const verify = await request.post(`${API_BASE}/api/auth/verify-email`, {
    data: { token, email },
  });
  expect(verify.status(), `verify ${email}`).toBe(200);

  const login = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  expect(login.status(), `login ${email}`).toBe(200);
  const body = await login.json();
  return { token: body.token, user: body.user };
}

/**
 * Put a session into the browser before the app boots.
 *
 * Writes BOTH auth keys. `src/hooks/use-auth.ts` hydrates only when the token
 * and the cached user are both present, so writing one produces a valid
 * credential the app renders as signed out. That invariant is the subject of
 * src/test/auth-session-roundtrip.test.tsx and it applies here too.
 *
 * `role` is a third thing, and it has to be written in BOTH places. The role
 * decides which dashboard renders and therefore whether the create-event
 * control exists at all.
 *
 * Writing it only into zustand's `party-store` is not enough, and this is the
 * defect the suite found. `src/hooks/use-auth.ts:78-82` re-runs
 * `setUser(getStoredUser())` on every mount, reading `partyhause_auth_user`,
 * and `usePartyStore.setUser` coerces a missing role to `'user'`. So a role
 * present only in `party-store` is overwritten on the next page load, and the
 * seeded creator lands on the attendee dashboard with no "New Event" button.
 * That is the same demotion a real host hit by pressing reload.
 *
 * @param role Which dashboard to land on. Omit for the default attendee view.
 */
export async function seedSession(
  page: Page,
  session: Session,
  role?: 'user' | 'creator' | 'vendor',
): Promise<void> {
  const cachedUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    ...(role ? { role } : {}),
  };

  const partyStore = role
    ? JSON.stringify({
        state: {
          user: { ...cachedUser, role },
          isAuthenticated: true,
          currentPage: 'dashboard',
          events: [],
          currentEvent: null,
        },
        version: 0,
      })
    : null;

  await page.context().addInitScript(
    ([token, user, store]) => {
      localStorage.setItem('partyhause_auth_token', token);
      localStorage.setItem('partyhause_auth_user', user);
      if (store) localStorage.setItem('party-store', store);
    },
    [session.token, JSON.stringify(cachedUser), partyStore] as [string, string, string | null],
  );
}

/** Authorization header for direct API assertions inside a browser test. */
export function auth(session: Session): Record<string, string> {
  return { Authorization: `Bearer ${session.token}` };
}
