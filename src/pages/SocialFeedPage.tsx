/**
 * Social Feed Page - Web Version
 * PartyCrew personalized feed with content filtering
 * Ported from mobile app
 */

import React, { useState } from 'react';
import { useCrewFeed } from '@/features/partycrew/hooks';
import { ContentFeedCard, CrewingWithBar } from '@/features/partycrew/components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { FilterTab } from '@/features/partycrew/types';

export default function SocialFeedPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  
  const contentTypeMap: Record<FilterTab, string | undefined> = {
    all: undefined,
    events: 'event_announcement',
    tips: 'tip',
    recaps: 'recap',
  };

  const { posts, isLoading, refetch, loadMore, hasMore } = useCrewFeed(
    contentTypeMap[activeFilter]
  );

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
            <h1 className="text-2xl font-bold text-gray-900">PartyCrew Feed</h1>
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
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🎉</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
              <p className="text-gray-600">
                Start following creators to see their content here!
              </p>
            </div>
            <Button onClick={() => window.location.href = '/explore'}>
              Discover Creators
            </Button>
          </div>
        )}

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <ContentFeedCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
              onShare={() => handleShare(post.id)}
            />
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
