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
  /** Report real impressions (posts actually scrolled into view). */
  markSeen: (postIds: string[]) => Promise<void>;
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

      // Server returns { posts, next_cursor, has_more } (snake_case).
      const data = await apiRequest<{
        posts: FeedPost[];
        next_cursor: string | null;
        has_more: boolean;
      }>(url);

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setCursor(data.next_cursor);
      setHasMore(data.has_more);
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

  const markSeen = useCallback(async (postIds: string[]) => {
    if (postIds.length === 0) return;
    try {
      await apiRequest('/api/feed/seen', {
        method: 'POST',
        body: JSON.stringify({ post_ids: postIds.slice(0, 100) }),
      });
    } catch (err) {
      // Impression reporting is best-effort — never surface to the UI.
      console.warn('[useCrewFeed] markSeen failed:', err);
    }
  }, []);

  return {
    posts,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
    markSeen,
  };
}
