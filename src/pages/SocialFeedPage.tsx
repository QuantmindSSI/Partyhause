/**
 * Social Feed Page - Web Version
 * PartyCrew personalized feed with content filtering
 * Ported from mobile app
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCrewFeed } from '@/features/partycrew/hooks';
import { ContentFeedCard, CrewingWithBar } from '@/features/partycrew/components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, ArrowLeft, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterTab } from '@/features/partycrew/types';
import { usePartyStore } from '@/store/usePartyStore';

export default function SocialFeedPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  
  const contentTypeMap: Record<FilterTab, string | undefined> = {
    all: undefined,
    events: 'event_announcement',
    tips: 'tip',
    recaps: 'recap',
  };

  const { posts, isLoading, refetch, loadMore, hasMore, markSeen } = useCrewFeed(
    contentTypeMap[activeFilter]
  );

  // Impression tracking: a post counts as "seen" only when ≥50% of its card
  // has actually been in the viewport. Reported ids are batched and flushed
  // every 2s (and deduped for the session) via POST /api/feed/seen.
  const observerRef = useRef<IntersectionObserver | null>(null);
  const seenQueueRef = useRef<Set<string>>(new Set());
  const reportedRef = useRef<Set<string>>(new Set());

  const observePost = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (!observerRef.current && typeof IntersectionObserver !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = (entry.target as HTMLElement).dataset.postId;
              if (id && !reportedRef.current.has(id)) {
                seenQueueRef.current.add(id);
              }
            }
          }
        },
        { threshold: 0.5 },
      );
    }
    observerRef.current?.observe(node);
  }, []);

  useEffect(() => {
    const flush = setInterval(() => {
      if (seenQueueRef.current.size === 0) return;
      const batch = Array.from(seenQueueRef.current);
      seenQueueRef.current.clear();
      batch.forEach((id) => reportedRef.current.add(id));
      markSeen(batch);
    }, 2000);

    return () => {
      clearInterval(flush);
      // Flush anything still queued on unmount.
      const remaining = Array.from(seenQueueRef.current);
      seenQueueRef.current.clear();
      if (remaining.length > 0) {
        remaining.forEach((id) => reportedRef.current.add(id));
        markSeen(remaining);
      }
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [markSeen]);

  const handleLike = async (postId: string) => {
    // TODO: Implement like functionality
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail with comments
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">PartyCrew Feed</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterTab)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
              <TabsTrigger value="recaps">Recaps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Crewing With Bar */}
        <CrewingWithBar />

        {/* Loading State */}
        {isLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <EmptyState
            icon={Users}
            title="No posts yet"
            description="Start following creators to see their content here!"
            action={{
              label: 'Discover Creators',
              onClick: () => usePartyStore.getState().setCurrentPage('explore'),
            }}
          />
        )}

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} data-post-id={post.id} ref={observePost}>
              <ContentFeedCard
                post={post}
                onLike={() => handleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onShare={() => handleShare(post.id)}
              />
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && !isLoading && posts.length > 0 && (
          <div className="flex justify-center py-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* End of Feed */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end! 🎊</p>
          </div>
        )}
      </div>
    </div>
  );
}
