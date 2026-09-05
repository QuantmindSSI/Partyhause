/**
 * PartyCrewFeedScreen Component
 * Enhanced home screen showing personalized PartyCrew feed
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CrewingWithBar } from '@/components/partycrew/CrewingWithBar';
import { ContentFeedCard } from '@/components/partycrew/ContentFeedCard';
import type { FeedContentType } from '@partyhause/core';
import { useCrewFeed } from '@/hooks/partycrew/useCrewFeed';
import { api } from '@/lib/client';
import { getWebBaseUrl } from '@/lib/api';

type FilterTab = 'all' | 'events' | 'tips' | 'recaps';

export function PartyCrewFeedScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  
  const contentTypeMap: Record<FilterTab, FeedContentType | undefined> = {
    all: undefined,
    events: 'event_announcement',
    tips: 'tip',
    recaps: 'recap',
  };

  const { posts, isLoading, refetch, loadMore, hasMore } = useCrewFeed(
    contentTypeMap[activeFilter]
  );

  /**
   * Likes the caller has toggled during this session, keyed by post id.
   *
   * The feed payload does not currently report whether the viewer has liked a
   * post, so this tracks it locally and the server remains authoritative for
   * the count. Both endpoints are idempotent, so a state that drifts out of
   * sync self-corrects on the next tap rather than double-counting.
   */
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [pendingLike, setPendingLike] = useState<Record<string, boolean>>({});

  const handleLike = async (postId: string) => {
    // Ignore a second tap while the first is in flight. Without this a fast
    // double tap sends a like and an unlike whose ordering is not guaranteed.
    if (pendingLike[postId]) return;
    setPendingLike((p) => ({ ...p, [postId]: true }));

    const wasLiked = likedPosts[postId] ?? false;
    // Optimistic, because a like must feel instant. Reverted below if the
    // server refuses, rather than left showing a state that never persisted.
    setLikedPosts((p) => ({ ...p, [postId]: !wasLiked }));

    const { error } = wasLiked ? await api.feed.unlike(postId) : await api.feed.like(postId);

    if (error) {
      setLikedPosts((p) => ({ ...p, [postId]: wasLiked }));
      Alert.alert('Could not update', 'That did not save. Try again in a moment.');
    } else {
      // Pull the authoritative counts back rather than guessing them locally.
      await refetch();
    }
    setPendingLike((p) => ({ ...p, [postId]: false }));
  };

  const handleComment = (postId: string) => {
    router.push(`/feed/${postId}/comments` as never);
  };

  const handleShare = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const url = `${getWebBaseUrl()}/feed/${postId}`;
    try {
      const result = await Share.share({
        message: post?.title ? `${post.title}\n\n${url}` : url,
        url,
      });
      // Only record a share the user actually completed. Recording on open
      // would count every dismissed sheet as a share.
      if (result.action === Share.sharedAction) {
        await api.feed.share(postId, 'external');
        await refetch();
      }
    } catch {
      Alert.alert('Could not share', 'Sharing is unavailable right now.');
    }
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'events' && styles.filterTabActive]}
        onPress={() => setActiveFilter('events')}
      >
        <Text style={[styles.filterText, activeFilter === 'events' && styles.filterTextActive]}>
          🎉 Events
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'tips' && styles.filterTabActive]}
        onPress={() => setActiveFilter('tips')}
      >
        <Text style={[styles.filterText, activeFilter === 'tips' && styles.filterTextActive]}>
          💡 Tips
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'recaps' && styles.filterTabActive]}
        onPress={() => setActiveFilter('recaps')}
      >
        <Text style={[styles.filterText, activeFilter === 'recaps' && styles.filterTextActive]}>
          ✨ Recaps
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyTitle}>Welcome to PartyCrew!</Text>
        <Text style={styles.emptyText}>
          Join some creators to see their events, tips, and party content in your feed
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Text style={styles.exploreButtonText}>Explore Creators</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentFeedCard
            post={item}
            onLike={() => handleLike(item.id)}
            onComment={() => handleComment(item.id)}
            onShare={() => handleShare(item.id)}
          />
        )}
        ListHeaderComponent={
          <>
            <CrewingWithBar />
            {renderFilterTabs()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#6366F1"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
