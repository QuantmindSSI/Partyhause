import { useEffect } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { usePartyStore, type User } from '@/store/usePartyStore';
import { authService, type SignupConsent } from '@/lib/auth';
import { getStoredToken, getStoredUser, setStoredUser, clearAuth } from '@/lib/auth-storage';
import { isMsalConfigured, msalGetAccount, msalLogin, msalLogout } from '@/lib/msal';

// Previously a local `NormalizedUser` interface duplicated the store's `User`
// but typed `role` as a bare `string`. That widened the union and made every
// `setUser` call a type error, which went unnoticed because the type checker
// was never actually run over this project in CI. Use the store's type
// directly so the two cannot drift again.
type NormalizedUser = User;

function accountToUser(account: AccountInfo | null): NormalizedUser | null {
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
  // `user_metadata` carries only `name` and `role`. The previous literal also
  // set `email`, `provider` and `sub`; `email` is already a top-level field and
  // nothing in the codebase reads the other two, so they are dropped rather
  // than widening the store's contract for unused data.
  return {
    id: account.homeAccountId,
    email,
    name,
    user_metadata: { name },
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
      // `needsEmailVerification` is forwarded, not dropped.
      //
      // authService.signIn goes to deliberate trouble to separate 403
      // EMAIL_NOT_VERIFIED from a 401 bad password, because the two need
      // opposite remedies: one wants a resend, the other a reset. This hook
      // returned only `{ user, error }`, so the distinction died here and
      // AuthScreen showed the same alert for both. An unconfirmed user was
      // told their sign-in failed with no indication of why or what to do.
      usePartyStore.getState().setLoading(false);
      return {
        user: result.user,
        error: result.error ? new Error(result.error) : null,
        needsEmailVerification: result.needsEmailVerification === true,
      };
    } catch (error) {
      usePartyStore.getState().setLoading(false);
      return { user: null, error, needsEmailVerification: false };
    }
  };

  /**
   * Request a password-reset link.
   *
   * Also the recovery path for an account whose address was never confirmed.
   * `POST /api/auth/reset-password` sets `email_verified: true` on success,
   * because completing a reset proves control of the mailbox in exactly the
   * way the verification link does. A user who signed up, never clicked
   * confirm, and has since forgotten their password gets out through here.
   *
   * The response is uniform whether or not the address is registered, so this
   * cannot be used to enumerate accounts.
   */
  const requestPasswordReset = async (email: string) => {
    const result = await authService.resetPassword(email);
    return { success: result.success, error: result.error ?? null };
  };

  /** Re-send the confirmation email. Anonymous: a locked-out user has no session. */
  const resendVerification = async (email: string) => {
    const result = await authService.resendVerification(email);
    return { success: result.success, error: result.error ?? null };
  };

  const signUp = async (email: string, password: string, name: string, consent: SignupConsent) => {
    if (isMsalConfigured) {
      usePartyStore.getState().setLoading(true);
      await msalLogin();
      return { user: null, error: null };
    }
    try {
      usePartyStore.getState().setLoading(true);
      const result = await authService.signUp(email, password, name, consent);
      // Signup returns an identity but no token. Keep the web store anonymous
      // until a later login proves the email address has been confirmed.
      usePartyStore.getState().setLoading(false);
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
      await authService.signOut();
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
    requestPasswordReset,
    resendVerification,
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
