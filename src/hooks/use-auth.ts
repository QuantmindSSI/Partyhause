import { useEffect } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { usePartyStore } from '@/store/usePartyStore';
import { authService } from '@/lib/auth';
import { getStoredToken, getStoredUser, setStoredUser, clearAuth, isSupabaseConfigured } from '@/lib/supabase';
import { isMsalConfigured, msalGetAccount, msalLogin, msalLogout } from '@/lib/msal';

interface NormalizedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

function accountToUser(account: AccountInfo | null) {
  if (!account) return null;
  const idClaims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
  const name =
    (account.name as string | undefined) ||
    (typeof idClaims.name === 'string' ? idClaims.name : undefined) ||
    (typeof idClaims.preferred_username === 'string'
      ? idClaims.preferred_username
      : undefined) ||
    account.username ||
    'User';
  const email =
    (typeof idClaims.email === 'string' ? idClaims.email : undefined) ||
    (typeof idClaims.preferred_username === 'string'
      ? idClaims.preferred_username
      : undefined) ||
    account.username ||
    '';
  return {
    id: account.homeAccountId,
    email,
    name,
    user_metadata: {
      name,
      email,
      provider: 'msal',
      sub: account.localAccountId,
    },
  };
}

export const useAuth = () => {
  const isLoading = usePartyStore((s) => s.isLoading);

  useEffect(() => {
    let mounted = true;

    if (isMsalConfigured) {
      // msalGetAccount lazily loads @azure/msal-browser on first use.
      msalGetAccount()
        .then((account) => {
          if (!mounted) return;
          if (account) {
            const normalizedUser = accountToUser(account);
            if (normalizedUser) {
              usePartyStore.getState().setUser(normalizedUser);
            }
          }
        })
        .catch((err) => {
          console.warn('MSAL account restore failed:', err);
        })
        .finally(() => {
          if (mounted) usePartyStore.getState().setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }

    // Check for existing session from stored token
    const checkSession = async () => {
      if (!mounted) return;

      const token = getStoredToken();
      const storedUser = getStoredUser();
      if (token && storedUser) {
        usePartyStore.getState().setUser(storedUser);
      }
      if (mounted) {
        usePartyStore.getState().setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isMsalConfigured) {
      usePartyStore.getState().setLoading(true);
      await msalLogin();
      return { user: null, error: null };
    }
    try {
      usePartyStore.getState().setLoading(true);
      const result = await authService.signIn(email, password);
      if (result.success && result.user) {
        const normalizedUser: NormalizedUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };
        await usePartyStore.getState().setUser(normalizedUser);
      }
      return { user: result.user, error: result.error ? new Error(result.error) : null };
    } catch (error) {
      usePartyStore.getState().setLoading(false);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (isMsalConfigured) {
      usePartyStore.getState().setLoading(true);
      await msalLogin();
      return { user: null, error: null };
    }
    try {
      usePartyStore.getState().setLoading(true);
      const result = await authService.signUp(email, password, name);
      if (result.success && result.user) {
        const normalizedUser: NormalizedUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };
        await usePartyStore.getState().setUser(normalizedUser);
      }
      return { user: result.user, error: result.error ? new Error(result.error) : null };
    } catch (error) {
      usePartyStore.getState().setLoading(false);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    if (isMsalConfigured) {
      try {
        usePartyStore.getState().setLoading(true);
        usePartyStore.getState().logout();
        await msalLogout();
      } catch (error) {
        console.error('MSAL sign out failed:', error);
      } finally {
        usePartyStore.getState().setLoading(false);
      }
      return;
    }
    try {
      usePartyStore.getState().setLoading(true);
      clearAuth();
      usePartyStore.getState().logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      usePartyStore.getState().setLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    isLoading,
  };
};

export const useUser = () => {
  const user = usePartyStore((s) => s.user);
  const isLoading = usePartyStore((s) => s.isLoading);
  return { user, isLoading };
};

export const useRequireAuth = () => {
  const { user, isLoading } = useUser();
  const isAuthorized = !!user;
  return { isAuthorized, isLoading };
};
