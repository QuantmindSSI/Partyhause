/**
 * useCrewingWith Hook
 * Fetches list of creators a user is following
 */

import { useState, useEffect, useCallback } from 'react';
import type { CrewCreatorRow } from '@partyhause/core';
import { api } from '@/lib/client';

/**
 * Re-exported so existing consumers that imported the local `Creator` shape
 * keep compiling. The canonical definition now lives in @partyhause/core and
 * is checked against the route by scripts/audit-contracts.cjs.
 */
export type Creator = CrewCreatorRow;

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
    if (!(await api.auth.isAuthenticated())) {
      setIsLoading(false);
      return;
    }

    // The route reads `userId` straight off the query string and never falls
    // back to the bearer token's subject, so omitting it produces a 404 rather
    // than "my own crew". Resolve it from the cached session instead.
    let targetUserId = userId;
    if (!targetUserId) {
      const cached = await api.auth.getCachedUser();
      targetUserId = cached?.id;
    }
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    const currentOffset = reset ? 0 : offset;

    // The Authorization header is attached by the shared transport, so the
    // manual session lookup and URL assembly are gone.
    const { data, error: apiError } = await api.partycrew.crewingWith(targetUserId, {
      limit,
      offset: currentOffset,
    });

    if (apiError) {
      setError(apiError.message);
      console.error('[useCrewingWith Error]:', apiError.message);
    } else if (data) {
      if (reset) {
        setCreators(data.creators);
        setOffset(limit);
      } else {
        setCreators(prev => [...prev, ...data.creators]);
        setOffset(prev => prev + limit);
      }
      setHasMore(data.has_more);
      setError(null);
    }
    setIsLoading(false);
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
