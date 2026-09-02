/**
 * useCrewFeed Hook
 * Fetches personalized feed from PartyCrew creators
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeedPost, FeedContentType } from '@partyhause/core';
import { api } from '@/lib/client';

export type { FeedPost };

interface UseCrewFeedResult {
  posts: FeedPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useCrewFeed(
  contentType?: FeedContentType,
  limit: number = 10
): UseCrewFeedResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (reset: boolean = false) => {
    if (!(await api.auth.isAuthenticated())) {
      setIsLoading(false);
      return;
    }

    // On a reset the cursor is deliberately dropped, otherwise a refresh would
    // resume mid-stream and silently hide everything published since.
    const { data, error: apiError } = await api.feed.crew({
      limit,
      contentType,
      cursor: reset ? undefined : cursor ?? undefined,
    });

    if (apiError) {
      setError(apiError.message);
      console.error('[useCrewFeed Error]:', apiError.message);
    } else if (data) {
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
      setError(null);
    }
    setIsLoading(false);
  }, [contentType, limit, cursor]);

  useEffect(() => {
    fetchFeed(true);
  }, [contentType]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setCursor(null);
    await fetchFeed(true);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore && cursor) {
      await fetchFeed(false);
    }
  }, [isLoading, hasMore, cursor, fetchFeed]);

  return {
    posts,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
  };
}
