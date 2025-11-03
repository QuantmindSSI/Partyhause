/**
 * useCrewingWith Hook - Web Version
 * Fetches list of creators a user is following
 * Ported from mobile app
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '../api/client';
import { Creator } from '../types';

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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      const targetUserId = userId || session.user.id;
      const currentOffset = reset ? 0 : offset;

      const data = await apiRequest<{
        creators: Creator[];
        total: number;
        offset: number;
        limit: number;
      }>(`/api/partycrew/crewing-with?userId=${targetUserId}&limit=${limit}&offset=${currentOffset}`);

      if (reset) {
        setCreators(data.creators);
        setOffset(limit);
      } else {
        setCreators(prev => [...prev, ...data.creators]);
        setOffset(prev => prev + limit);
      }

      setHasMore(data.creators.length === limit);
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
    setOffset(0);
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
