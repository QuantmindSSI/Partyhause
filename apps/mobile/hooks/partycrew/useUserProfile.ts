/**
 * useUserProfile Hook
 * Fetches complete user profile with stats and viewer relationship
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserProfileDetail } from '@partyhause/core';
import { api } from '@/lib/client';

/**
 * Re-exported so existing consumers keep compiling. The canonical definition
 * lives in @partyhause/core and mirrors what GET /api/users/:id returns.
 */
export type UserProfile = UserProfileDetail;

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

    // The route uses optionalAuth, so an anonymous read is legitimate and
    // simply comes back without the viewer_* flags. The transport attaches a
    // bearer token when one is stored and omits it otherwise.
    const { data, error: apiError } = await api.users.get(userId);

    if (apiError) {
      setError(apiError.message);
      console.error('[useUserProfile Error]:', apiError.message);
    } else {
      setProfile(data);
    }
    setIsLoading(false);
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
