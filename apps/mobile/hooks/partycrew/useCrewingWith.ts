/**
 * useCrewingWith Hook
 * Fetches list of creators a user is following
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_mutual: boolean;
  account_type: string;
  events_hosted: number;
  followed_at: string;
}

interface UseCrewingWithResult {
  creators: Creator[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useCrewingWith(
  userId?: string,
  limit: number = 20
): UseCrewingWithResult {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchCreators = useCallback(async (reset: boolean = false) => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      const targetUserId = userId || session.user.id;
      const currentOffset = reset ? 0 : offset;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://www.partyhause.com';
      const response = await fetch(
        `${apiUrl}/api/partycrew/crewing-with?userId=${targetUserId}&limit=${limit}&offset=${currentOffset}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }

      const data = await response.json();
      
      if (reset) {
        setCreators(data.creators);
        setOffset(limit);
      } else {
        setCreators(prev => [...prev, ...data.creators]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(data.has_more);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load creators';
      setError(errorMsg);
      console.error('[useCrewingWith Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, offset]);

  useEffect(() => {
    fetchCreators(true);
  }, [userId]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchCreators(true);
  }, [fetchCreators]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchCreators(false);
    }
  }, [isLoading, hasMore, fetchCreators]);

  return {
    creators,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}
