import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DraftEvent {
  id: string;
  templateType: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  templateSettings: any;
  guests?: string;
  timeline?: string;
  guestCount: string;
  timelineCount: string;
  savedAt: string;
}

export default function DraftsScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const draftsJson = await AsyncStorage.getItem('event_drafts');
      if (draftsJson) {
        const parsedDrafts = JSON.parse(draftsJson);
        // Sort by most recent first
        parsedDrafts.sort((a: DraftEvent, b: DraftEvent) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
      Alert.alert('Error', 'Failed to load drafts');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrafts();
    setRefreshing(false);
  };

  const handleContinueDraft = (draft: DraftEvent) => {
    // Navigate back to review screen with draft data
    router.push({
      pathname: '/events/create/review',
      params: {
        template: draft.templateType,
        title: draft.title,
        description: draft.description,
        startDate: draft.startDate,
        endDate: draft.endDate,
        location: draft.location,
        templateSettings: JSON.stringify(draft.templateSettings),
        guests: draft.guests,
        timeline: draft.timeline,
        guestCount: draft.guestCount,
        timelineCount: draft.timelineCount,
        isDraft: 'true',
        draftId: draft.id,
      },
    });
  };

  const handleDeleteDraft = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedDrafts = drafts.filter(d => d.id !== draftId);
              await AsyncStorage.setItem('event_drafts', JSON.stringify(updatedDrafts));
              setDrafts(updatedDrafts);
            } catch (error) {
              console.error('Failed to delete draft:', error);
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType.toLowerCase()) {
      case 'birthday':
      case 'kids-birthday':
        return 'gift';
      case 'wedding':
        return 'heart';
      case 'conference':
        return 'business';
      case 'product-launch':
        return 'rocket';
      case 'festival':
        return 'musical-notes';
      case 'fundraiser':
        return 'cash';
      default:
        return 'calendar';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Draft Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Drafts List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {drafts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No drafts yet</Text>
            <Text style={styles.emptyText}>
              Your saved event drafts will appear here
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/events/create')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.draftsList}>
            {drafts.map((draft) => (
              <View key={draft.id} style={styles.draftCard}>
                {/* Draft Header */}
                <View style={styles.draftHeader}>
                  <View style={styles.draftHeaderLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={getTemplateIcon(draft.templateType)}
                        size={24}
                        color="#6366F1"
                      />
                    </View>
                    <View style={styles.draftInfo}>
                      <Text style={styles.draftTitle} numberOfLines={1}>
                        {draft.title}
                      </Text>
                      <Text style={styles.draftTemplate}>
                        {draft.templateType}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteDraft(draft.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Draft Details */}
                <View style={styles.draftDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatDate(draft.startDate)}
                    </Text>
                  </View>

                  {draft.location && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {draft.location}
                      </Text>
                    </View>
                  )}

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Ionicons name="people-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{draft.guestCount} guests</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="list-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{draft.timelineCount} blocks</Text>
                    </View>
                  </View>
                </View>

                {/* Draft Footer */}
                <View style={styles.draftFooter}>
                  <Text style={styles.savedText}>
                    Saved {formatDate(draft.savedAt)}
                  </Text>
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleContinueDraft(draft)}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  draftsList: {
    padding: 16,
    gap: 16,
  },
  draftCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  draftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  draftTemplate: {
    fontSize: 14,
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
  draftDetails: {
    gap: 8,
    marginBottom: 12,
    paddingLeft: 60,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  savedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
});
