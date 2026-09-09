/**
 * Authentication resource.
 *
 * Session persistence lives here rather than in each caller, so both platforms
 * write the same two keys with the same shapes. Sign-in and sign-out are the
 * only two operations permitted to touch stored credentials.
 */

import type { Transport } from '../http/transport';
import type { ApiResponse } from '../http/transport';
import { STORAGE_KEYS } from '../http/adapters';
import type { AuthSession, AuthUser, CurrentUser, SignUpResult } from '../types';
import type { SignupConsent } from '../legal';

export interface AuthResource {
  signIn(email: string, password: string): Promise<ApiResponse<AuthSession>>;
  /**
   * Create an account. Does NOT sign the user in: the route returns no token
   * until the address is confirmed, so nothing is persisted and the caller
   * must show a "check your email" state.
   */
  signUp(
    email: string,
    password: string,
    name: string,
    consent: SignupConsent,
  ): Promise<ApiResponse<SignUpResult>>;
  signOut(): Promise<void>;
  /** Remove local credentials without making a network request. */
  clearSession(): Promise<void>;
  /** Clear the local session only when the current token still matches. */
  clearSessionIfToken(token: string): Promise<boolean>;
  me(): Promise<ApiResponse<CurrentUser>>;
  forgotPassword(email: string): Promise<ApiResponse<{ success: boolean; message: string }>>;
  /**
   * Second step of the reset. The address is part of the contract, not just the
   * token: the route looks the user up by email and then bcrypt-compares the
   * token against that row's hash, so a body without it is rejected outright.
   */
  resetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>>;
  /** Same shape as resetPassword, and for the same reason. */
  verifyEmail(email: string, token: string): Promise<ApiResponse<{ success: boolean; message: string }>>;
  /**
   * Re-send the confirmation link. Anonymous and takes the address explicitly,
   * because a user who cannot sign in has no session to authenticate with.
   * Answers the same whether or not the address is registered.
   */
  resendVerification(email: string): Promise<ApiResponse<{ success: boolean; message: string }>>;
  /** Token from storage, or null. */
  getToken(): Promise<string | null>;
  /** Cached user from storage, or null when absent or corrupt. */
  getCachedUser(): Promise<AuthUser | null>;
  isAuthenticated(): Promise<boolean>;
}

/**
 * Persist a successful session.
 *
 * Both keys are written together. Writing only the token is what previously
 * left the web app in a loop where a rehydrated store claimed the user was
 * signed in while every request 401'd.
 */
async function persist(transport: Transport, session: AuthSession): Promise<void> {
  try {
    // Write the token last. It is the session commit marker used by every gate.
    await transport.storage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
    await transport.storage.setItem(STORAGE_KEYS.token, session.token);
  } catch (error) {
    try {
      await clearPersistedSession(transport);
    } catch (cleanupError) {
      console.error('Failed to roll back partially persisted auth credentials', cleanupError);
    }
    throw error;
  }
}

async function clearPersistedSession(transport: Transport): Promise<void> {
  await Promise.all([
    transport.storage.removeItem(STORAGE_KEYS.token),
    transport.storage.removeItem(STORAGE_KEYS.user),
  ]);
}

export function createAuthResource(transport: Transport): AuthResource {
  return {
    async signIn(email, password) {
      const result = await transport.request<AuthSession>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      });
      if (result.data?.token) await persist(transport, result.data);
      return result;
    },

    async signUp(email, password, name, consent) {
      // Signup does NOT establish a session. The route deliberately returns
      // no token: the address must be confirmed first, and it previously
      // handed out a 7-day credential to an address nobody controlled.
      // Nothing is persisted here, so callers must route to a
      // "check your email" state rather than into the app.
      return transport.request<SignUpResult>('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          name,
          ageEligible: consent.ageEligible,
          termsVersion: consent.termsVersion,
          privacyVersion: consent.privacyVersion,
        },
        anonymous: true,
      });
    },

    async resendVerification(email) {
      // Anonymous: a user who cannot sign in still needs to reach this.
      return transport.request<{ success: boolean; message: string }>(
        '/api/auth/resend-verification',
        { method: 'POST', body: { email }, anonymous: true },
      );
    },

    async signOut() {
      // Give the server the current bearer token before removing it locally so
      // logout can increment the account's token epoch and revoke every device.
      try {
        await transport.request('/api/auth/logout', { method: 'POST' });
      } finally {
        await clearPersistedSession(transport);
      }
    },

    clearSession() {
      return clearPersistedSession(transport);
    },

    async clearSessionIfToken(token) {
      if (transport.storage.clearSessionIfToken) {
        return transport.storage.clearSessionIfToken(token);
      }
      if (await transport.storage.getItem(STORAGE_KEYS.token) !== token) return false;
      await clearPersistedSession(transport);
      return true;
    },

    me() {
      return transport.request<CurrentUser>('/api/auth/me', { method: 'GET' });
    },

    forgotPassword(email) {
      return transport.request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
        anonymous: true,
      });
    },

    resetPassword(email, token, password) {
      return transport.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: { email, token, password },
        anonymous: true,
      });
    },

    verifyEmail(email, token) {
      return transport.request<{ success: boolean; message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: { email, token },
        anonymous: true,
      });
    },

    getToken() {
      return transport.storage.getItem(STORAGE_KEYS.token);
    },

    async getCachedUser() {
      const raw = await transport.storage.getItem(STORAGE_KEYS.user);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as AuthUser;
      } catch {
        // Corrupt entry is equivalent to no entry; drop it so it cannot recur.
        await transport.storage.removeItem(STORAGE_KEYS.user);
        return null;
      }
    },

    async isAuthenticated() {
      const token = await transport.storage.getItem(STORAGE_KEYS.token);
      return Boolean(token);
    },
  };
}
