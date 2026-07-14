// Supabase has been replaced by the Express API + JWT auth.
// This file provides backward-compatible stubs for the mobile app.

export type CoreSupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: any } }>;
    getUser: () => Promise<{ data: { user: any } }>;
    signOut: () => Promise<{ error: any }>;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
  };
};

export const initSupabaseClient = (
  _url: string,
  _key: string,
  _options?: any
): CoreSupabaseClient => {
  console.warn('Supabase client is deprecated. Use the Express API instead.');
  return {
    auth: {
      getSession: async () => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('partyhause_auth_token') : null;
        const user = typeof localStorage !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('partyhause_auth_user') || 'null'); } catch { return null; } })() : null;
        return { data: { session: token && user ? { access_token: token, user } : null } };
      },
      getUser: async () => {
        const user = typeof localStorage !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('partyhause_auth_user') || 'null'); } catch { return null; } })() : null;
        return { data: { user } };
      },
      signOut: async () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('partyhause_auth_token');
          localStorage.removeItem('partyhause_auth_user');
        }
        return { error: null };
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
};
