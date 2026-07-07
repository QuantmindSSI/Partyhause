import { useEffect } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const isLoading = usePartyStore((s) => s.isLoading);

  useEffect(() => {
    let mounted = true;
    let isLoggingOut = false; // GUARD: Prevent double logout
    let subscription: { unsubscribe: () => void } | null = null;

    if (!isSupabaseConfigured) {
      // Supabase not configured (migration in progress) — skip auth setup
      // and let the app show the landing page.
      usePartyStore.getState().setLoading(false);
      return;
    }

    // Simple auth state listener - no complex flags or race condition logic
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        isLoggingOut = false; // Reset logout guard
        const meta = session.user.user_metadata || {};
        const normalizedUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: meta.name,
          role: meta.role,
          user_metadata: meta
        };
        await usePartyStore.getState().setUser(normalizedUser);
        // If no role yet, send to role selection
        if (!meta.role) {
          usePartyStore.getState().setCurrentPage('role-selection');
        }
      } else if (event === 'SIGNED_OUT' && !isLoggingOut) {
        isLoggingOut = true; // Set guard to prevent double logout
        // User signed out - clear user from store
        usePartyStore.getState().logout();
      }
    });
    subscription = data.subscription;

    // Check for existing session on mount
    const checkSession = async () => {
      if (!mounted) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const normalizedUser = {
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.user_metadata?.name,
            user_metadata: session.user.user_metadata
          };
          await usePartyStore.getState().setUser(normalizedUser);
        }
      } catch (error: any) {
        console.warn('Session check failed:', error);
        // If refresh token is invalid or not found (token rotation or revocation),
        // proactively clear local session and force the user to sign in again.
        const msg = (error && (error.message || String(error))) || '';
        if (msg.includes('Refresh Token Not Found') || msg.includes('Invalid Refresh Token')) {
          try {
            // Best-effort sign out to clear local storage/cookies
            await supabase.auth.signOut();
          } catch (e) {
            // ignore signOut errors
          }
          usePartyStore.getState().logout();
        }
      } finally {
        if (mounted) {
          usePartyStore.getState().setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
    // Remove function dependencies to prevent infinite loops
    // Zustand actions are stable, but we'll use the store directly to be safe
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      usePartyStore.getState().setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      usePartyStore.getState().setLoading(false);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      usePartyStore.getState().setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0], // Use name or email prefix as fallback
            full_name: name || email.split('@')[0]
          }
        }
      });
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      usePartyStore.getState().setLoading(false);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      usePartyStore.getState().setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
  // Single source of truth: read user/loading from the global store
  const user = usePartyStore((s) => s.user);
  const isLoading = usePartyStore((s) => s.isLoading);

  return { user, isLoading };
};

export const useRequireAuth = () => {
  const { user, isLoading } = useUser();
  const isAuthorized = !!user;

  return { isAuthorized, isLoading };
};
