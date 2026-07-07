/**
 * useUserProfile Hook - Web Version
 * Fetches complete user profile with stats and viewer relationship
 * Calls the Express API (/api/users/:id) instead of querying Supabase directly
 */

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api-client';
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
      const { data, error: fetchError } = await apiGet<Record<string, any>>(
        `/api/users/${encodeURIComponent(userId)}`,
      );

      if (fetchError || !data) {
        throw new Error(fetchError?.message || 'Profile not found');
      }

      // The API returns the profile fields directly on the response object.
      const dataRecord = data as Record<string, any>;

      // Build profile with defaults for stats/viewer fields
      const userProfile: UserProfile = {
        id: dataRecord.id,
        username: dataRecord.username || 'user',
        display_name: dataRecord.display_name || 'User',
        bio: dataRecord.bio || null,
        avatar_url: dataRecord.avatar_url || null,
        cover_photo_url: dataRecord.cover_photo_url || null,
        location: dataRecord.location || null,
        website_url: dataRecord.website_url || null,
        partycrew_count: dataRecord.partycrew_count || 0,
        crewing_count: dataRecord.crewing_count || 0,
        events_hosted: dataRecord.events_hosted || 0,
        haus_score: dataRecord.haus_score || 0,
        is_verified: dataRecord.is_verified || false,
        is_private: dataRecord.is_private || false,
        account_type: dataRecord.account_type || 'user',
        viewer_is_following: dataRecord.viewer_is_following || false,
        viewer_is_follower: dataRecord.viewer_is_follower || false,
        viewer_is_mutual: dataRecord.viewer_is_mutual || false,
        viewer_has_pending_request: dataRecord.viewer_has_pending_request || false,
        viewer_is_blocked: dataRecord.viewer_is_blocked || false,
        viewer_has_blocked: dataRecord.viewer_has_blocked || false,
        mutual_crew_count: dataRecord.mutual_crew_count || 0,
        created_at: dataRecord.created_at || new Date().toISOString(),
        last_active_at: dataRecord.last_active_at || dataRecord.created_at || new Date().toISOString(),
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
