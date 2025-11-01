/**
 * CrewingWithBar Component
 * Horizontal scrollable bar showing creators the user is following
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCrewingWith } from '@/hooks/partycrew/useCrewingWith';

interface CrewingWithBarProps {
  userId?: string; // If not provided, uses current user
  onCreatorPress?: (creatorId: string) => void;
}

export function CrewingWithBar({ userId, onCreatorPress }: CrewingWithBarProps) {
  const router = useRouter();
  const { creators, isLoading } = useCrewingWith(userId, 20);

  const handleCreatorPress = (creatorId: string) => {
    if (onCreatorPress) {
      onCreatorPress(creatorId);
    } else {
      router.push(`/profile/${creatorId}` as any);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Crewing With</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {creators.map((creator: any) => (
          <TouchableOpacity
            key={creator.id}
            style={styles.creatorCard}
            onPress={() => handleCreatorPress(creator.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {creator.avatar_url ? (
                <Image
                  source={{ uri: creator.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {creator.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {creator.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
              {creator.is_mutual && (
                <View style={styles.mutualBadge}>
                  <Text style={styles.mutualIcon}>↔</Text>
                </View>
              )}
            </View>
            <Text style={styles.displayName} numberOfLines={1}>
              {creator.display_name}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{creator.username}
            </Text>
            {creator.events_hosted > 0 && (
              <Text style={styles.statsText}>
                {creator.events_hosted} event{creator.events_hosted !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 100,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mutualBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mutualIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
