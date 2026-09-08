import { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearAuth } from './auth-storage';
import { apiUrl } from './apiBase';

export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string; name?: string } | null;
  error?: string;
  message?: string;
  /**
   * True when the account exists and the password was correct, but the address
   * has not been confirmed. The caller should offer to resend the link rather
   * than treat this as a credential failure: sending the user to password
   * reset cannot resolve it.
   */
  needsEmailVerification?: boolean;
  /** Set when signup succeeded but no session was established. */
  awaitingVerification?: boolean;
}

/**
 * Error carrying the server's machine-readable `code` alongside its message.
 *
 * The plain `new Error(data.error)` this replaces discarded the code, so a
 * caller could not tell an unconfirmed address (403 EMAIL_NOT_VERIFIED) from a
 * wrong password (401). They need opposite responses: one offers to resend a
 * link, the other offers a password reset.
 */
export class AuthApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiPostAuth<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new AuthApiError(data.error || `HTTP ${res.status}`, res.status, data.code);
  }
  return data as T;
}

async function apiGetAuth<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'GET',
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const handleAuthError = async (_error: any) => {
  clearAuth();
  window.location.href = '/auth/login';
  return true;
};

export const initializeAuthStateListener = () => {
  const token = getStoredToken();
  if (!token) return;
  // Verify token is still valid on init
  apiGetAuth<{ id: string; email: string; name?: string }>('/api/auth/me').catch(() => {
    clearAuth();
  });
};

export const authService = {
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const data = await apiPostAuth<{ user: { id: string; email: string; name?: string }; token: string }>(
        '/api/auth/login', { email, password },
      );
      setStoredToken(data.token);
      setStoredUser(data.user);
      return { success: true, user: data.user };
    } catch (error: any) {
      // An unconfirmed address is not a credential failure. Surfacing it as
      // one sends the user to password reset, which cannot help: the password
      // was correct.
      if (error instanceof AuthApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        return {
          success: false,
          needsEmailVerification: true,
          error: error.message,
        };
      }
      return { success: false, error: error.message };
    }
  },

  /**
   * Create an account. Does NOT sign the user in.
   *
   * The route returns no token until the address is confirmed, so nothing is
   * stored here. Reading `data.token` and calling `setStoredToken` on it, as
   * this did, now writes `undefined` and leaves a half-signed-in state that
   * every later request rejects.
   */
  signUp: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const data = await apiPostAuth<{
        user: { id: string; email: string; name?: string };
        message: string;
      }>('/api/auth/signup', { email, password, name });

      return {
        success: true,
        user: data.user,
        awaitingVerification: true,
        message: data.message ?? 'Check your email for a confirmation link before signing in.',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Re-send the confirmation link. Anonymous, because a user who cannot sign in
   * has no session to authenticate with. The server answers identically whether
   * or not the address is registered, so this cannot confirm an account exists.
   */
  resendVerification: async (email: string): Promise<AuthResponse> => {
    try {
      const data = await apiPostAuth<{ success: boolean; message: string }>(
        '/api/auth/resend-verification', { email },
      );
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      // Requesting a reset link is /forgot-password; /reset-password is the
      // second step and requires { token, email, password }.
      await apiPostAuth('/api/auth/forgot-password', { email });
      return { success: true, message: 'Password reset instructions sent to your email' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  signOut: async (): Promise<AuthResponse> => {
    try {
      await apiPostAuth('/api/auth/logout', {});
    } catch {
      // Ignore — discard token either way
    }
    clearAuth();
    window.location.href = '/auth/login';
    return { success: true, message: 'Successfully signed out' };
  },

  getCurrentUser: async () => {
    return getStoredUser() as any;
  },

  getAccessToken: async (): Promise<string | null> => {
    return getStoredToken();
  },

  /**
   * Complete the email-verification loop using the token + email from the
   * link the API emailed (or logged, in dev) at signup.
   */
  verifyEmail: async (email: string, token: string): Promise<AuthResponse> => {
    try {
      const data = await apiPostAuth<{ success: boolean; message: string }>(
        '/api/auth/verify-email', { email, token },
      );
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
