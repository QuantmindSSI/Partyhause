import { useEffect } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const isLoading = usePartyStore((s) => s.isLoading);

  useEffect(() => {
    let mounted = true;
    let isLoggingOut = false; // GUARD: Prevent double logout

    // Simple auth state listener - no complex flags or race condition logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        isLoggingOut = false; // Reset logout guard
        // User signed in - set user in store
        const normalizedUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name,
          user_metadata: session.user.user_metadata
        };
        await usePartyStore.getState().setUser(normalizedUser);
      } else if (event === 'SIGNED_OUT' && !isLoggingOut) {
        isLoggingOut = true; // Set guard to prevent double logout
        // User signed out - clear user from store
        usePartyStore.getState().logout();
      }
    });

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
      } catch (error) {
        console.warn('Session check failed:', error);
      } finally {
        if (mounted) {
          usePartyStore.getState().setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
