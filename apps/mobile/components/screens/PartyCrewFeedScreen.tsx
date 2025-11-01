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
} from 'react-native';
import { useRouter } from 'expo-router';
import { CrewingWithBar } from '@/components/partycrew/CrewingWithBar';
import { ContentFeedCard } from '@/components/partycrew/ContentFeedCard';
import { useCrewFeed } from '@/hooks/partycrew/useCrewFeed';

type FilterTab = 'all' | 'events' | 'tips' | 'recaps';

export function PartyCrewFeedScreen() {
  const router = useRouter();
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
