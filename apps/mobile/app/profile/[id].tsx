/**
 * User Profile Screen
 * Shows user profile with stats, events, and PartyCrew integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/partycrew/useUserProfile';
import { JoinCrewButton } from '@/components/partycrew/JoinCrewButton';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isLoading, refetch } = useUserProfile(id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const getUserId = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getUserId();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorText}>
          This user profile hasn't been created yet.{'\n\n'}
          If this is your profile, you need to create it in Supabase first.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          💡 Check scripts/create-user-profile.sql for instructions
        </Text>
      </View>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  const handleWebsitePress = () => {
    if (profile.website_url) {
      Linking.openURL(profile.website_url);
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    router.push('/settings/profile' as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover Photo */}
      {profile.cover_photo_url ? (
        <Image
          source={{ uri: profile.cover_photo_url }}
          style={styles.coverPhoto}
        />
      ) : (
        <View style={[styles.coverPhoto, styles.coverPhotoPlaceholder]} />
      )}

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {profile.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        {/* Name and Username */}
        <View style={styles.nameContainer}>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isOwnProfile ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <JoinCrewButton
              creatorId={profile.id}
              variant="default"
              onStatusChange={refetch}
            />
          )}
        </View>
      </View>

      {/* Bio */}
      {profile.bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}

      {/* Location and Website */}
      <View style={styles.detailsContainer}>
        {profile.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{profile.location}</Text>
          </View>
        )}
        {profile.website_url && (
          <TouchableOpacity style={styles.detailRow} onPress={handleWebsitePress}>
            <Text style={styles.detailIcon}>🔗</Text>
            <Text style={[styles.detailText, styles.linkText]}>
              {profile.website_url.replace(/^https?:\/\//, '')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.partycrew_count}</Text>
          <Text style={styles.statLabel}>PartyCrew</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.crewing_count}</Text>
          <Text style={styles.statLabel}>Crewing</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.events_hosted}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.haus_score}</Text>
          <Text style={styles.statLabel}>Haus Score</Text>
        </View>
      </View>

      {/* Mutual Crew */}
      {!isOwnProfile && profile.viewer_is_mutual && (
        <View style={styles.mutualBanner}>
          <Text style={styles.mutualText}>
            ↔️ You're both in each other's PartyCrew
          </Text>
        </View>
      )}

      {/* Private Account Notice */}
      {profile.is_private && !profile.viewer_is_following && !isOwnProfile && (
        <View style={styles.privateBanner}>
          <Text style={styles.privateIcon}>🔒</Text>
          <Text style={styles.privateText}>This account is private</Text>
          <Text style={styles.privateSubtext}>
            Join their PartyCrew to see their events and content
          </Text>
        </View>
      )}

      {/* Account Type Badge */}
      {profile.account_type !== 'personal' && (
        <View style={styles.accountTypeBadge}>
          <Text style={styles.accountTypeText}>
            {profile.account_type === 'creator' ? '🎨 Creator' : '🏢 Business'}
          </Text>
        </View>
      )}

      {/* Events Section */}
      {(isOwnProfile || !profile.is_private || profile.viewer_is_following) && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Hosted Events</Text>
          {profile.events_hosted === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isOwnProfile ? "You haven't hosted any events yet" : "No events hosted yet"}
              </Text>
            </View>
          ) : (
            <Text style={styles.comingSoonText}>Events grid coming soon...</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  helpText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coverPhoto: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  coverPhotoPlaceholder: {
    backgroundColor: '#F3F4F6',
  },
  profileHeader: {
    paddingHorizontal: 16,
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verifiedIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nameContainer: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionContainer: {
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bioContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#6B7280',
  },
  linkText: {
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  mutualBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  mutualText: {
    fontSize: 14,
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '600',
  },
  privateBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  privateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  privateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  privateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  accountTypeBadge: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignItems: 'center',
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  eventsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
