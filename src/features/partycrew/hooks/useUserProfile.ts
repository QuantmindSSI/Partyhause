/**
 * useUserProfile Hook - Web Version
 * Fetches complete user profile with stats and viewer relationship
 * Queries Supabase directly instead of going through Netlify API
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '../types';

interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(userId: string | undefined): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !data) {
        throw new Error(fetchError?.message || 'Profile not found');
      }

      // Build profile with defaults for stats/viewer fields
      const userProfile: UserProfile = {
        id: data.id,
        username: data.username || 'user',
        display_name: data.display_name || 'User',
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        cover_photo_url: data.cover_photo_url || null,
        location: data.location || null,
        website_url: data.website_url || null,
        partycrew_count: data.partycrew_count || 0,
        crewing_count: data.crewing_count || 0,
        events_hosted: data.events_hosted || 0,
        haus_score: data.haus_score || 0,
        is_verified: data.is_verified || false,
        is_private: data.is_private || false,
        account_type: data.account_type || 'user',
        viewer_is_following: false,
        viewer_is_follower: false,
        viewer_is_mutual: false,
        viewer_has_pending_request: false,
        viewer_is_blocked: false,
        viewer_has_blocked: false,
        mutual_crew_count: 0,
        created_at: data.created_at || new Date().toISOString(),
        last_active_at: data.last_active_at || data.created_at || new Date().toISOString(),
      };

      setProfile(userProfile);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMsg);
      console.error('[useUserProfile Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
