/**
 * useCrewFeed Hook - Web Version
 * Fetches personalized feed from PartyCrew creators
 * Ported from mobile app
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '../api/client';
import { FeedPost } from '../types';

interface UseCrewFeedResult {
  posts: FeedPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useCrewFeed(
  contentType?: string,
  limit: number = 10
): UseCrewFeedResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (reset: boolean = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/feed/crew?limit=${limit}`;
      
      if (contentType) {
        url += `&content_type=${contentType}`;
      }
      
      if (!reset && cursor) {
        url += `&cursor=${cursor}`;
      }

      const data = await apiRequest<{
        posts: FeedPost[];
        cursor: string | null;
        hasMore: boolean;
      }>(url);

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load feed';
      setError(errorMsg);
      console.error('[useCrewFeed Error]:', err);
    } finally {
      setIsLoading(false);
    }
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
