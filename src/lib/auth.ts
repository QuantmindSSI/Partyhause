import { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearAuth, supabase } from './supabase';
import { apiUrl } from './apiBase';

export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string; name?: string } | null;
  error?: string;
  message?: string;
}

const TOKEN_KEY = 'partyhause_auth_token';

async function apiPostAuth<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
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
      return { success: false, error: error.message };
    }
  },

  signUp: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const data = await apiPostAuth<{ user: { id: string; email: string; name?: string }; token: string }>(
        '/api/auth/signup', { email, password, name },
      );
      setStoredToken(data.token);
      setStoredUser(data.user);
      return { success: true, user: data.user, message: 'Account created successfully!' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      await apiPostAuth('/api/auth/reset-password', { email });
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

  verifyEmail: async (_token: string): Promise<AuthResponse> => {
    return { success: true, message: 'Email verification coming soon' };
  },
};
