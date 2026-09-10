import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

/** "HH:MM" on a 24-hour clock, which is what this screen renders from. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Reduce a block's `start_time` to "HH:MM".
 *
 * The two stores disagree on format, which is documented on `TimelineBlock` in
 * packages/core: the `events.timeline_blocks` JSON column holds a bare "HH:MM"
 * string, while the relational table holds a DateTime that arrives as ISO-8601.
 * This screen reads the table, so everything below the fetch works in "HH:MM"
 * and converts once, here.
 *
 * Without this, `formatTime` split an ISO string on ':' and produced
 * `NaN:NaN PM` for every row.
 *
 * @param value Either "HH:MM" or an ISO-8601 timestamp.
 * @returns "HH:MM", or "00:00" when the input cannot be interpreted.
 */
/**
 * Place an "HH:MM" clock time on the event's calendar day.
 *
 * @param clock "HH:MM", already validated.
 * @param day The event's start date, or null when it could not be read.
 * @returns A Date on `day` at `clock`, falling back to today's date.
 */
function anchorToEventDay(clock: string, day: Date | null): Date {
  const [hours, minutes] = clock.split(':').map(Number);
  const base = day && !Number.isNaN(day.getTime()) ? new Date(day) : new Date();
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function toClockTime(value: string): string {
  if (TIME_RE.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '00:00';

  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Longest activity we will accept, in minutes. A full day. */
const MAX_DURATION_MINUTES = 24 * 60;

interface ActivityDraft {
  label: string;
  start_time: string;
  duration: string;
  type: TimelineBlock['type'];
}

const EMPTY_DRAFT: ActivityDraft = {
  label: '',
  start_time: '',
  duration: '60',
  type: 'activity',
};

export default function ActivitiesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activities, setActivities] = useState<TimelineBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  /** The event's own day. New blocks land on it; only the time is entered. */
  const [eventDate, setEventDate] = useState<Date | null>(null);

  /**
   * Add-activity state.
   *
   * Both "Add Activity" controls on this screen used to be
   * `onPress={() => {/* TODO *\/}}`, one of them the primary button of the
   * empty state, which is the first thing anyone sees on a new event.
   *
   * Writing goes through `api.events.update`, not `api.timeline.create`,
   * because the live schedule is the `events.timeline_blocks` JSON column.
   * That is where the creation wizard puts it (`events/create/review.tsx:200`)
   * and what this screen reads. The relational `timeline_blocks` table that
   * /api/timeline serves is populated by nothing, so writing there would
   * produce a 201 and a row this screen could never display.
   */
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<ActivityDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  /**
   * Validate a draft against what the JSON column and this screen can render.
   *
   * @param value The draft under edit.
   * @returns An error message, or null when the draft is saveable.
   */
  const validateDraft = (value: ActivityDraft): string | null => {
    if (!value.label.trim()) return 'Give the activity a name.';
    if (!TIME_RE.test(value.start_time)) {
      return 'Start time must be on a 24-hour clock, like 18:30.';
    }
    const duration = Number.parseInt(value.duration, 10);
    if (!Number.isInteger(duration) || duration <= 0) {
      return 'Duration must be a whole number of minutes.';
    }
    if (duration > MAX_DURATION_MINUTES) {
      return 'Duration cannot be longer than 24 hours.';
    }
    return null;
  };

  /** Persist a new block onto the event, keeping the list ordered by time. */
  const addActivity = async () => {
    const invalid = validateDraft(draft);
    if (invalid) {
      Alert.alert('Check this activity', invalid);
      return;
    }
    if (!id) {
      Alert.alert('Error', 'Event ID is missing');
      return;
    }

    setSaving(true);
    const { data: created, error } = await api.timeline.create({
      event_id: id,
      label: draft.label.trim(),
      // The route stores a DateTime, so the entered clock time is anchored to
      // the event's own day and sent as an unambiguous instant. Sending a bare
      // "18:30" would be parsed by `new Date()` on the server against its
      // locale, not the event's.
      start_time: anchorToEventDay(draft.start_time, eventDate).toISOString(),
      duration: Number.parseInt(draft.duration, 10),
      type: draft.type,
      // The host is writing their own schedule and this screen offers no
      // private-note field, so there is nothing here to withhold from guests.
      guest_visible: true,
    });
    setSaving(false);

    if (error || !created) {
      // The local list is deliberately not updated on failure. Showing the
      // block anyway would tell the host their schedule was saved when the
      // server rejected it.
      Alert.alert('Could not save', error?.message ?? 'The activity was not saved.');
      return;
    }

    // Sorted, because the screen renders in array order and draws the
    // connecting line between consecutive items.
    setActivities((current) =>
      [...current, created].sort((a, b) =>
        toClockTime(a.start_time).localeCompare(toClockTime(b.start_time)),
      ),
    );
    setDraft(EMPTY_DRAFT);
    setShowAdd(false);
  };

  const openAdd = () => {
    setDraft(EMPTY_DRAFT);
    setShowAdd(true);
  };

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

      // The event is still fetched, but only for the day a new block lands on
      // and for the authorization and 404 handling above.
      const eventDay = event?.start_date ? new Date(event.start_date) : null;
      setEventDate(eventDay && !Number.isNaN(eventDay.getTime()) ? eventDay : null);
      if (eventDay && !Number.isNaN(eventDay.getTime())) setSelectedDate(eventDay);

      // Blocks come from /api/timeline, not from `event.timeline_blocks`.
      //
      // That JSON column is deliberately withheld from every client, hosts
      // included, by `serialiseEvent` in server/lib/event-dto.ts: it cannot
      // express `guest_visible` or separate `host_notes`, so emitting it would
      // keep a second source of truth alive and disclose host-only notes to
      // guests. This screen read it anyway, so `event.timeline_blocks` was
      // always undefined and the list was always empty, whatever the event
      // actually contained.
      //
      // /api/timeline is the representation that carries `guest_visible`, and
      // the route applies it per viewer: hosts and co-hosts see every block,
      // guests see only the visible ones.
      const { data: blocks, error: timelineError } = await api.timeline.listForEvent(id);

      if (timelineError) {
        console.error('[Activities] Timeline error:', timelineError.status, timelineError.message);
        Alert.alert('Error', `Failed to load activities. ${timelineError.message}`);
        setLoading(false);
        return;
      }

      // Sorted on a copy: the array belongs to the response object, and sorting
      // in place mutates it. The route already orders by start_time, so this is
      // a guard against that changing rather than the primary ordering.
      setActivities(
        [...(blocks ?? [])].sort((a, b) =>
          toClockTime(a.start_time).localeCompare(toClockTime(b.start_time)),
        ),
      );
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
    const clock = toClockTime(block.start_time);
    const startTime = formatTime(clock);
    const endTime = calculateEndTime(clock, block.duration);
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
        <TouchableOpacity onPress={openAdd} accessibilityLabel="Add activity">
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
              onPress={openAdd}
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

      <Modal
        visible={showAdd}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdd(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New activity</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} disabled={saving}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cake cutting"
              placeholderTextColor="#9ca3af"
              value={draft.label}
              onChangeText={(label) => setDraft((d) => ({ ...d, label }))}
              editable={!saving}
              maxLength={255}
            />

            <View style={styles.modalRow}>
              <View style={styles.modalRowItem}>
                <Text style={styles.modalLabel}>Start (24h)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="18:30"
                  placeholderTextColor="#9ca3af"
                  value={draft.start_time}
                  onChangeText={(start_time) => setDraft((d) => ({ ...d, start_time }))}
                  editable={!saving}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={styles.modalRowItem}>
                <Text style={styles.modalLabel}>Minutes</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="60"
                  placeholderTextColor="#9ca3af"
                  value={draft.duration}
                  onChangeText={(duration) => setDraft((d) => ({ ...d, duration }))}
                  editable={!saving}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typeGrid}>
              {(Object.keys(BLOCK_TYPE_CONFIG) as Array<TimelineBlock['type']>).map((type) => {
                const config = BLOCK_TYPE_CONFIG[type];
                const selected = draft.type === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      selected && { backgroundColor: config.color, borderColor: config.color },
                    ]}
                    onPress={() => setDraft((d) => ({ ...d, type }))}
                    disabled={saving}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={15}
                      color={selected ? '#fff' : config.color}
                    />
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalSave, saving && styles.modalSaveDisabled]}
              onPress={() => void addActivity()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSaveText}>Add to schedule</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(38, 32, 29, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#26201D' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#6A5E58', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EBE7E5',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 16,
    color: '#26201D',
    marginBottom: 14,
  },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalRowItem: { flex: 1 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#EBE7E5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeChipText: { fontSize: 13, color: '#26201D', fontWeight: '500' },
  typeChipTextSelected: { color: '#fff' },
  modalSave: {
    backgroundColor: '#FF5233',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveDisabled: { opacity: 0.5 },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
