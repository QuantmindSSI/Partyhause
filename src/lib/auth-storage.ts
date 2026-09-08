/**
 * Browser-side persistence for the authenticated session.
 *
 * This is the web app's half of the auth contract. The server issues an HS256
 * JWT from `POST /api/auth/login` and `POST /api/auth/reset-password`; this
 * module is the only place that decides where that token lives and how it is
 * read back. `src/lib/api-client.ts` and `src/lib/auth.ts` both go through
 * here, so there is exactly one answer to "am I holding a session".
 *
 * This module used to also export a hand-written object mimicking a database
 * client SDK, so that call sites written before the API existed would keep
 * compiling. That stub is gone. It was a liability rather than a convenience:
 * `from().select().order()` resolved to `{ data: [] }`, an empty result
 * indistinguishable from a real empty table, so a caller that reached for the
 * database got silence instead of an error.
 *
 * The two storage keys below are a compatibility surface and must not change.
 * `packages/core/src/http/adapters.ts:73-74` writes the same two strings for
 * the mobile client, and any user with an existing session in localStorage is
 * silently signed out the moment a key is renamed.
 */

const TOKEN_KEY = 'partyhause_auth_token';
const USER_KEY = 'partyhause_auth_user';

/**
 * The subset of the server's user record that is worth caching client-side.
 *
 * Deliberately narrower than the `/api/auth/me` response. Anything that can go
 * stale (profile counts, verification state, display name changes made on
 * another device) is fetched, not cached, because a cached copy that disagrees
 * with the server is worse than no copy.
 */
export interface StoredUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Reads the bearer token.
 *
 * @returns The raw JWT, or `null` when no session is stored. Does not validate
 *   the token: an expired JWT is returned as a string and rejected by the API
 *   on use. Callers that need liveness must ask the server.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Writes or clears the bearer token.
 *
 * @param token The raw JWT to persist. Passing `null` or an empty string
 *   removes the key rather than storing a falsy value, because
 *   `localStorage.setItem(k, null)` persists the four-character string
 *   `"null"`, which then reads back as a truthy token and is sent as
 *   `Authorization: Bearer null`.
 */
export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Reads the cached user record.
 *
 * @returns The stored user, or `null` when absent or unparseable. Corrupt JSON
 *   yields `null` instead of throwing: a bad cache entry must degrade to
 *   "signed out" rather than crash the render that asked for it.
 */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<StoredUser>;
    if (typeof candidate.id !== 'string' || typeof candidate.email !== 'string') {
      return null;
    }
    return {
      id: candidate.id,
      email: candidate.email,
      name: typeof candidate.name === 'string' ? candidate.name : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Writes or clears the cached user record.
 *
 * @param user The record to persist. Passing `null` removes the key.
 */
export function setStoredUser(user: StoredUser | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Discards the whole stored session.
 *
 * Both keys are removed together and unconditionally. Removing only the token
 * leaves `getStoredUser()` answering truthfully while every request 401s,
 * which presents as a signed-in shell that cannot load anything.
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
