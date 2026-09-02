import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TimelineBlock } from '@partyhause/core';
import { api } from '@/lib/client';

const BLOCK_TYPE_CONFIG = {
  activity: { icon: 'sparkles', color: '#6366F1', label: 'Activity' },
  meal: { icon: 'restaurant', color: '#10B981', label: 'Meal' },
  speech: { icon: 'mic', color: '#F59E0B', label: 'Speech' },
  performance: { icon: 'musical-notes', color: '#EC4899', label: 'Performance' },
  break: { icon: 'time', color: '#6B7280', label: 'Break' },
  custom: { icon: 'add-circle', color: '#8B5CF6', label: 'Custom' },
};

export default function ActivitiesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activities, setActivities] = useState<TimelineBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      fetchActivities();
    }
  }, [id]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Validate id parameter
      if (!id) {
        console.error('[Activities] Event ID is missing');
        Alert.alert('Error', 'Event ID is missing');
        setLoading(false);
        return;
      }

      console.log('[Activities] Fetching activities for event:', id);

      if (!(await api.auth.isAuthenticated())) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to view activities',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Sign In', onPress: () => router.push('/') }
          ]
        );
        setLoading(false);
        return;
      }

      // The previous request went to `/api/events?id=<id>`, but the route reads
      // the id from the path (`/:id?`) and ignores that query parameter, so it
      // answered with the caller's event LIST. `data.event` was therefore always
      // undefined and this screen always rendered "no activities", even when the
      // event had a full schedule.
      const { data: event, error: apiError } = await api.events.get(id);

      if (apiError) {
        console.error('[Activities] API error:', apiError.status, apiError.message);
        if (apiError.status === 401 || apiError.status === 403) {
          Alert.alert('Unauthorized', 'You do not have permission to view this event',
            [{ text: 'OK', onPress: () => router.back() }]);
        } else if (apiError.status === 404) {
          Alert.alert('Event Not Found', 'This event does not exist or has been deleted',
            [{ text: 'OK', onPress: () => router.back() }]);
        } else {
          Alert.alert('Error', `Failed to load activities. ${apiError.message}`);
        }
        setLoading(false);
        return;
      }

      const blocks = Array.isArray(event?.timeline_blocks) ? event.timeline_blocks : [];

      // Sorted on a copy: the array belongs to the response object, and sorting
      // in place mutates it.
      setActivities([...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time)));
    } catch (error) {
      console.error('[Activities] Exception:', error);
      Alert.alert(
        'Error', 
        'Failed to load activities. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => fetchActivities() },
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() }
        ]
      );
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    // time is in HH:MM format
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    return formatTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  const getTypeConfig = (type: string) => {
    return BLOCK_TYPE_CONFIG[type as keyof typeof BLOCK_TYPE_CONFIG] || BLOCK_TYPE_CONFIG.custom;
  };

  const renderTimelineItem = (block: TimelineBlock, index: number) => {
    const config = getTypeConfig(block.type);
    const startTime = formatTime(block.start_time);
    const endTime = calculateEndTime(block.start_time, block.duration);
    const isLastItem = index === activities.length - 1;

    return (
      <View key={block.id} style={styles.timelineItem}>
        {/* Timeline Line & Dot */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineDot, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon as any} size={16} color="#fff" />
          </View>
          {!isLastItem && <View style={styles.timelineLine} />}
        </View>

        {/* Activity Card */}
        <View style={styles.activityCard}>
          {/* Time Badge */}
          <View style={styles.timeBadge}>
            <Ionicons name="time" size={14} color="#6b7280" />
            <Text style={styles.timeText}>
              {startTime} - {endTime}
            </Text>
            <Text style={styles.durationText}>
              ({formatDuration(block.duration)})
            </Text>
          </View>

          {/* Activity Header */}
          <View style={styles.activityHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${config.color}20` }]}>
              <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>
            <View style={styles.activityTitle}>
              <Text style={styles.activityName}>{block.label}</Text>
              <Text style={styles.activityType}>{config.label}</Text>
            </View>
            {block.guest_visible && (
              <View style={styles.visibilityBadge}>
                <Ionicons name="eye" size={12} color="#10b981" />
              </View>
            )}
          </View>

          {/* Description */}
          {block.description && (
            <Text style={styles.description}>{block.description}</Text>
          )}

          {/* Notification Badge */}
          {block.notify_before && block.notify_before > 0 && (
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications" size={12} color="#f59e0b" />
              <Text style={styles.notificationText}>
                Notify {block.notify_before}m before
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activities</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities Schedule</Text>
        <TouchableOpacity onPress={() => {/* TODO: Add new activity */}}>
          <Ionicons name="add" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <View style={styles.dateDisplay}>
          <Ionicons name="calendar" size={20} color="#6366F1" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>{activities.length} activities</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Activities Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Add activities to create your event timeline
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {/* TODO: Navigate to add activity */}}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timeline}>
            {activities.map((block, index) => renderTimelineItem(block, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  calendarHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  scrollView: {
    flex: 1,
  },
  timeline: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 12,
    color: '#6b7280',
  },
  visibilityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  notificationText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
