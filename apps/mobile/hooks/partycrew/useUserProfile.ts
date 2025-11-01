/**
 * useUserProfile Hook
 * Fetches complete user profile with stats and viewer relationship
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  location: string | null;
  website_url: string | null;
  
  // Stats
  partycrew_count: number;
  crewing_count: number;
  events_hosted: number;
  haus_score: number;
  
  // Account info
  is_verified: boolean;
  is_private: boolean;
  account_type: string;
  
  // Viewer relationship
  viewer_is_following: boolean;
  viewer_is_follower: boolean;
  viewer_is_mutual: boolean;
  viewer_has_pending_request: boolean;
  viewer_is_blocked: boolean;
  viewer_has_blocked: boolean;
  mutual_crew_count?: number;
  
  // Timestamps
  created_at: string;
  last_active_at: string;
}

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
    if (!userId || !supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://partyhause.vercel.app';
      const headers: any = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const url = `${apiUrl}/api/users/${userId}`;
      console.log('[useUserProfile] Fetching:', url);
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useUserProfile] Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useUserProfile] Success:', data);
      setProfile(data);
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
