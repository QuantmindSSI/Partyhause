import { supabase, isSupabaseConfigured } from './supabase';
import { sendEmail, emailTemplates } from './email';
import {
  isMsalConfigured,
  msalLogin,
  msalLogout,
  msalGetAccount,
  msalGetToken,
} from './msal';

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  error?: string;
  message?: string;
}

// Handle authentication errors, especially refresh token issues
export const handleAuthError = async (error: any) => {
  console.error('Auth error:', error);

  if (isMsalConfigured) {
    // MSAL handles its own token lifecycle; no refresh-token cleanup needed.
    return false;
  }

  if (error.message?.includes('Invalid Refresh Token') ||
      error.message?.includes('Refresh Token Not Found')) {
    console.log('Refresh token invalid, signing out user');
    // Clear local session and redirect to login
    await supabase.auth.signOut();
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login page
    window.location.href = '/auth/login';
    return true; // Indicates error was handled
  }
  return false; // Error not handled
};

// Set up auth state change listener for session management
export const initializeAuthStateListener = () => {
  if (isMsalConfigured) {
    // MSAL manages its own state via cache + redirect handling; no listener.
    return;
  }
  if (!isSupabaseConfigured) return;
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);

    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in successfully');
        break;
      case 'SIGNED_OUT':
        console.log('User signed out, clearing local data');
        localStorage.clear();
        sessionStorage.clear();
        break;
      case 'TOKEN_REFRESHED':
        console.log('Session refreshed successfully');
        break;
      case 'USER_UPDATED':
        console.log('User data updated');
        break;
    }
  });
};

export const authService = {
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    if (isMsalConfigured) {
      // MSAL uses redirect-based login; ignore credentials.
      await msalLogin();
      return { success: true, user: null };
    }
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || email.split('@')[0]
          }
        };
      }

      return {
        success: false,
        error: 'No user returned from authentication'
      };
    } catch (error: any) {
      // Handle refresh token errors
      const handled = await handleAuthError(error);
      if (handled) {
        return {
          success: false,
          error: 'Session expired, please sign in again'
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
  },

  signUp: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    if (isMsalConfigured) {
      // Sign-up is handled by the CIAM user flow; trigger login redirect.
      await msalLogin();
      return { success: true, user: null };
    }
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          },
      emailRedirectTo: `${(import.meta as any).env?.VITE_APP_URL || window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      if (user) {
        // Send custom welcome email
        await sendEmail(emailTemplates.confirmEmail(
          email,
          `${(import.meta as any).env?.VITE_APP_URL || window.location.origin}/auth/callback?email=${encodeURIComponent(email)}`
        ));

        return {
          success: true,
          message: 'Please check your email to confirm your account!',
          user: null // Don't return user until email is confirmed
        };
      }

      return {
        success: false,
        error: 'No user returned from sign up'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
    if (isMsalConfigured) {
      // Password resets are managed by the CIAM user flow (self-service).
      await msalLogin();
      return { success: true, message: 'Redirecting to account recovery.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      await sendEmail(emailTemplates.resetPassword(
        email,
        `${(import.meta as any).env?.VITE_APP_URL || window.location.origin}/auth/reset-password?email=${encodeURIComponent(email)}`
      ));

      return {
        success: true,
        message: 'Password reset instructions have been sent to your email'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  signOut: async (): Promise<AuthResponse> => {
    if (isMsalConfigured) {
      try {
        await msalLogout();
        return { success: true, message: 'Successfully signed out' };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: 'Successfully signed out'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get the current session user (MSAL account or Supabase user)
  getCurrentUser: async () => {
    if (isMsalConfigured) {
      const account = msalGetAccount();
      if (!account) return null;
      const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
      return {
        id: account.homeAccountId,
        email:
          (typeof claims.email === 'string' ? claims.email : undefined) ||
          (typeof claims.preferred_username === 'string'
            ? claims.preferred_username
            : undefined) ||
          account.username ||
          '',
        user_metadata: {
          name: account.name || claims.name || account.username,
          provider: 'msal',
        },
      } as any;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get the current access token (MSAL or Supabase)
  getAccessToken: async (): Promise<string | null> => {
    if (isMsalConfigured) {
      return msalGetToken();
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },

  // Verify email confirmation
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    if (isMsalConfigured) {
      // Email verification is handled by the CIAM user flow.
      return {
        success: true,
        message: 'Email verification is managed by Microsoft Entra.'
      };
    }
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
