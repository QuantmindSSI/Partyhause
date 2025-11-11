/**
 * useCrewFeed Hook
 * Fetches personalized feed from PartyCrew creators
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface FeedPost {
  id: string;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  content_type: 'update' | 'photo' | 'video' | 'poll' | 'event_announcement' | 'tip' | 'recap';
  title: string | null;
  body: string | null;
  media_urls: string[];
  event_id: string | null;
  poll_options: any;
  
  likes_count: number;
  comments_count: number;
  shares_count: number;
  
  viewer_has_liked: boolean;
  viewer_has_commented: boolean;
  
  published_at: string;
  feed_score: number;
}

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

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://www.partyhause.com';
      let url = `${apiUrl}/api/feed/crew?limit=${limit}`;
      
      if (contentType) {
        url += `&content_type=${contentType}`;
      }
      
      if (!reset && cursor) {
        url += `&cursor=${cursor}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();
      
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
      setError(null);
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
