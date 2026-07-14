// Supabase has been fully replaced by the Express API + JWT auth.
// This file provides backward-compatible exports so existing imports still work.
// The `supabase` export is a minimal stub; no Supabase SDK is needed.

const TOKEN_KEY = 'partyhause_auth_token';
const USER_KEY = 'partyhause_auth_user';

export const isSupabaseConfigured = false;

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): { id: string; email: string; name?: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: { id: string; email: string; name?: string } | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Backward-compatible stub — no Supabase SDK at all
export const supabase = {
  auth: {
    getSession: async () => {
      const token = getStoredToken();
      const user = getStoredUser();
      if (!token || !user) return { data: { session: null } };
      return {
        data: {
          session: {
            access_token: token,
            user,
          },
        },
      };
    },
    getUser: async () => {
      const user = getStoredUser();
      return { data: { user } };
    },
    signOut: async () => {
      clearAuth();
      return { error: null };
    },
    signInWithPassword: async () => {
      return { data: { user: null }, error: new Error('Use authService.signIn() instead') };
    },
    signUp: async () => {
      return { data: { user: null }, error: new Error('Use authService.signUp() instead') };
    },
    resetPasswordForEmail: async () => {
      return { error: new Error('Use authService.resetPassword() instead') };
    },
    verifyOtp: async () => {
      return { error: new Error('Use authService.verifyEmail() instead') };
    },
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    updateUser: async () => {
      return { data: { user: null }, error: null };
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: new Error('Direct DB queries disabled — use API') }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      or: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      in: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: new Error('Direct DB queries disabled — use API') }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Direct DB queries disabled — use API') }),
        }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('RPC disabled — use API') }),
  }),
};
