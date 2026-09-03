/**
 * Authentication resource.
 *
 * This is the piece the mobile app never had. `AuthScreen.tsx` called
 * `supabase.auth.signInWithPassword`, a method that does not exist on the
 * Supabase stub, so there was no sign-in path at all. Session persistence is
 * handled here so both platforms store the token identically.
 */

import type { Transport } from '../http/transport';
import type { ApiResponse } from '../http/transport';
import { STORAGE_KEYS } from '../http/adapters';
import type { AuthSession, AuthUser, CurrentUser, SignUpResult } from '../types';

export interface AuthResource {
  signIn(email: string, password: string): Promise<ApiResponse<AuthSession>>;
  /**
   * Create an account. Does NOT sign the user in: the route returns no token
   * until the address is confirmed, so nothing is persisted and the caller
   * must show a "check your email" state.
   */
  signUp(email: string, password: string, name?: string): Promise<ApiResponse<SignUpResult>>;
  signOut(): Promise<void>;
  me(): Promise<ApiResponse<CurrentUser>>;
  forgotPassword(email: string): Promise<ApiResponse<{ success: boolean }>>;
  resetPassword(token: string, password: string): Promise<ApiResponse<{ success: boolean }>>;
  verifyEmail(token: string): Promise<ApiResponse<{ success: boolean; message: string }>>;
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
  await transport.storage.setItem(STORAGE_KEYS.token, session.token);
  await transport.storage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
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

      async signUp(email, password, name) {
        // Signup does NOT establish a session. The route deliberately returns
        // no token: the address must be confirmed first, and it previously
        // handed out a 7-day credential to an address nobody controlled.
        // Nothing is persisted here, so callers must route to a
        // "check your email" state rather than into the app.
        return transport.request<SignUpResult>('/api/auth/signup', {
          method: 'POST',
          body: name ? { email, password, name } : { email, password },
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
      // Best effort server-side; the local session is cleared regardless so a
      // network failure can never strand a user in a signed-in state.
      await transport.request('/api/auth/logout', { method: 'POST' });
      await transport.storage.removeItem(STORAGE_KEYS.token);
      await transport.storage.removeItem(STORAGE_KEYS.user);
    },

    me() {
      return transport.request<CurrentUser>('/api/auth/me', { method: 'GET' });
    },

    forgotPassword(email) {
      return transport.request<{ success: boolean }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
        anonymous: true,
      });
    },

    resetPassword(token, password) {
      return transport.request<{ success: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        anonymous: true,
      });
    },

    verifyEmail(token) {
      return transport.request<{ success: boolean; message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: { token },
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
