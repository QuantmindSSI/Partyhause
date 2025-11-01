/**
 * ContentFeedCard Component
 * Unified card for displaying all PartyCrew content types
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
}

interface ContentFeedCardProps {
  post: FeedPost;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onCreatorPress?: () => void;
}

export function ContentFeedCard({
  post,
  onLike,
  onComment,
  onShare,
  onCreatorPress,
}: ContentFeedCardProps) {
  const router = useRouter();

  const getContentTypeIcon = () => {
    switch (post.content_type) {
      case 'event_announcement': return '🎉';
      case 'photo': return '📸';
      case 'video': return '🎥';
      case 'poll': return '📊';
      case 'tip': return '💡';
      case 'recap': return '✨';
      default: return '📝';
    }
  };

  const getContentTypeLabel = () => {
    switch (post.content_type) {
      case 'event_announcement': return 'Event Announcement';
      case 'photo': return 'Photo';
      case 'video': return 'Video';
      case 'poll': return 'Poll';
      case 'tip': return 'Party Tip';
      case 'recap': return 'Event Recap';
      default: return 'Update';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCreatorPress = () => {
    if (onCreatorPress) {
      onCreatorPress();
    } else {
      router.push(`/profile/${post.creator.id}` as any);
    }
  };

  const handleEventPress = () => {
    if (post.event_id) {
      router.push(`/events/${post.event_id}`);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleCreatorPress}
        activeOpacity={0.7}
      >
        {post.creator.avatar_url ? (
          <Image
            source={{ uri: post.creator.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {post.creator.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.creatorInfo}>
          <View style={styles.creatorNameRow}>
            <Text style={styles.displayName}>{post.creator.display_name}</Text>
            {post.creator.is_verified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.contentType}>
              {getContentTypeIcon()} {getContentTypeLabel()}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(post.published_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {post.title && (
          <Text style={styles.title}>{post.title}</Text>
        )}
        {post.body && (
          <Text style={styles.body} numberOfLines={6}>
            {post.body}
          </Text>
        )}
        
        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: post.media_urls[0] }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {post.media_urls.length > 1 && (
              <View style={styles.mediaCountBadge}>
                <Text style={styles.mediaCountText}>
                  +{post.media_urls.length - 1}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Event CTA */}
        {post.content_type === 'event_announcement' && post.event_id && (
          <TouchableOpacity
            style={styles.eventCTA}
            onPress={handleEventPress}
            activeOpacity={0.8}
          >
            <Text style={styles.eventCTAText}>View Event →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLike}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, post.viewer_has_liked && styles.actionIconActive]}>
            {post.viewer_has_liked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionCount}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onComment}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionCount}>{post.shares_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  verifiedBadge: {
    fontSize: 14,
    color: '#3B82F6',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentType: {
    fontSize: 13,
    color: '#6B7280',
  },
  dot: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  mediaCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mediaCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCTA: {
    marginTop: 12,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  eventCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  actionIconActive: {
    transform: [{ scale: 1.1 }],
  },
  actionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
