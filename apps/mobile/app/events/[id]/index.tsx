import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  createMvpIdempotencyKey,
  type MvpEvent,
  type MvpGuestStats,
} from '@partyhause/core/mvp';

import { api } from '@/lib/client';

type EventAction = 'publish' | 'cancel' | 'delete';
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; event: MvpEvent; stats: MvpGuestStats | null };

function formatEventDate(start: string, end: string, timezone: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: timezone,
  };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone: timezone };
  try {
    const startDay = startDate.toLocaleDateString(undefined, dateOptions);
    const endDay = endDate.toLocaleDateString(undefined, dateOptions);
    const startTime = startDate.toLocaleTimeString(undefined, timeOptions);
    const endTime = endDate.toLocaleTimeString(undefined, timeOptions);
    return startDay === endDay
      ? `${startDay}, ${startTime} to ${endTime}`
      : `${startDay}, ${startTime} to ${endDay}, ${endTime}`;
  } catch {
    return `${startDate.toISOString()} to ${endDate.toISOString()}`;
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  destructive = false,
  disabled,
  icon,
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.lifecycleButton, destructive && styles.destructiveButton, disabled && styles.disabledButton]}
    >
      <Ionicons name={icon} size={19} color={destructive ? '#A51D20' : '#972317'} />
      <Text style={[styles.lifecycleButtonText, destructive && styles.destructiveButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const commandKeys = useRef(new Map<string, string>());
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingAction, setPendingAction] = useState<EventAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!id) {
      setState({ status: 'error', message: 'This event link is incomplete.' });
      return;
    }
    setState({ status: 'loading' });
    const [eventResult, guestResult] = await Promise.all([
      api.events.get(id),
      api.guests.listForEventWithStats(id),
    ]);
    if (eventResult.error || !eventResult.data) {
      setState({
        status: 'error',
        message: eventResult.error?.status === 404
          ? 'This event does not exist or is no longer available.'
          : eventResult.error?.message || 'The event could not be loaded.',
      });
      return;
    }
    setState({ status: 'ready', event: eventResult.data, stats: guestResult.data?.stats ?? null });
  }, [id]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  function commandKey(action: EventAction, event: MvpEvent): string {
    const fingerprint = `${action}:${event.id}:${event.revision}`;
    const existing = commandKeys.current.get(fingerprint);
    if (existing) return existing;
    const created = createMvpIdempotencyKey(`event-${action}`);
    commandKeys.current.set(fingerprint, created);
    return created;
  }

  async function runAction(action: EventAction, event: MvpEvent): Promise<void> {
    setPendingAction(action);
    setActionError(null);
    const key = commandKey(action, event);
    if (action === 'delete') {
      const result = await api.events.remove(event.id, event.revision, key);
      setPendingAction(null);
      if (result.error) {
        setActionError(result.error.code === 'REVISION_CONFLICT'
          ? 'This event changed elsewhere. Refresh before trying again.'
          : result.error.message);
        if (result.error.code === 'REVISION_CONFLICT') void loadEvent();
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['user-events'] });
      router.replace('/');
      return;
    }
    const result = action === 'publish'
      ? await api.events.publish(event.id, event.revision, key)
      : await api.events.cancel(event.id, event.revision, key);
    setPendingAction(null);
    if (result.error) {
      setActionError(result.error.code === 'REVISION_CONFLICT'
        ? 'This event changed elsewhere. Refresh before trying again.'
        : result.error.message);
      if (result.error.code === 'REVISION_CONFLICT') void loadEvent();
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['user-events'] });
    if (result.data && state.status === 'ready') {
      setState({ ...state, event: result.data });
    }
  }

  function confirm(action: EventAction, event: MvpEvent): void {
    const copy = action === 'publish'
      ? { title: `Publish ${event.name}?`, message: 'Guests can be checked in after publication.', label: 'Publish' }
      : action === 'cancel'
        ? { title: `Cancel ${event.name}?`, message: 'Cancellation cannot be reversed.', label: 'Cancel Event' }
        : { title: `Delete ${event.name}?`, message: 'This permanently removes its guests, RSVP links, and attendance history.', label: 'Delete Event' };
    Alert.alert(copy.title, copy.message, [
      { text: 'Keep Event', style: 'cancel' },
      {
        text: copy.label,
        style: action === 'publish' ? 'default' : 'destructive',
        onPress: () => { void runAction(action, event); },
      },
    ]);
  }

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C02A16" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#E12D33" />
        <Text style={styles.errorTitle}>Event unavailable</Text>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { void loadEvent(); }}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { event, stats } = state;
  const busy = pendingAction !== null;
  const canEdit = event.status === 'draft' || event.status === 'published';
  const canDelete = event.status === 'draft' || event.status === 'completed' || event.status === 'cancelled';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#26201D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event</Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!canEdit || busy}
          style={styles.headerAction}
          onPress={() => router.push({ pathname: '/events/create', params: { eventId: event.id } })}
        >
          <Text style={[styles.headerActionText, (!canEdit || busy) && styles.disabledText]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
          <Text style={styles.title}>{event.name}</Text>
          {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={21} color="#C02A16" />
            <Text style={styles.detailText}>{formatEventDate(event.start, event.end, event.timezone)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={21} color="#C02A16" />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={21} color="#C02A16" />
            <Text style={styles.detailText}>{event.timezone}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Attendance</Text>
        {stats ? (
          <View style={styles.statsGrid}>
            <Stat value={stats.total} label="Guests" />
            <Stat value={stats.accepted} label="Accepted" />
            <Stat value={stats.pending} label="Awaiting" />
            <Stat value={stats.checkedIn} label="Checked In" />
          </View>
        ) : <Text style={styles.supportingText}>Attendance totals are temporarily unavailable.</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push(`/events/${event.id}/guests`)}
        >
          <View style={styles.actionIcon}><Ionicons name="people" size={24} color="#C02A16" /></View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Guests and attendance</Text>
            <Text style={styles.actionDescription}>Add guests, review RSVPs, and record check-in.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#847771" />
        </TouchableOpacity>

        {event.status === 'published' && new Date(event.start).getTime() > Date.now() ? (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.actionCard}
            onPress={() => router.push(`/events/${event.id}/invitations`)}
          >
            <View style={styles.actionIcon}><Ionicons name="mail" size={24} color="#C02A16" /></View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Send invitations</Text>
              <Text style={styles.actionDescription}>Choose guests and send the fixed browser RSVP invitation.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#847771" />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>Event actions</Text>
        <View style={styles.lifecycleActions}>
          {event.status === 'draft' ? (
            <ActionButton
              disabled={busy}
              icon="paper-plane-outline"
              label={pendingAction === 'publish' ? 'Publishing...' : 'Publish Event'}
              onPress={() => confirm('publish', event)}
            />
          ) : null}
          {event.status === 'published' ? (
            <ActionButton
              destructive
              disabled={busy}
              icon="close-circle-outline"
              label={pendingAction === 'cancel' ? 'Cancelling...' : 'Cancel Event'}
              onPress={() => confirm('cancel', event)}
            />
          ) : null}
          <ActionButton
            destructive
            disabled={busy || !canDelete}
            icon="trash-outline"
            label={pendingAction === 'delete' ? 'Deleting...' : 'Delete Event'}
            onPress={() => confirm('delete', event)}
          />
          {event.status === 'published' ? (
            <Text style={styles.lifecycleNote}>Cancel this event before deleting it.</Text>
          ) : null}
        </View>

        {actionError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAF9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#FBFAF9' },
  loadingText: { color: '#6A5E58', fontSize: 15 },
  errorTitle: { color: '#26201D', fontSize: 22, fontWeight: '800' },
  errorText: { color: '#9F1D22', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryButton: { minWidth: 180, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#C02A16', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { color: '#972317', fontWeight: '700' },
  header: { minHeight: 96, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBE7E5' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#26201D', fontSize: 17, fontWeight: '800', paddingBottom: 11 },
  headerAction: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  headerActionText: { color: '#972317', fontSize: 15, fontWeight: '800' },
  disabledText: { opacity: 0.4 },
  content: { padding: 20, paddingBottom: 48 },
  hero: { paddingVertical: 14 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#FFF2F0', paddingHorizontal: 11, paddingVertical: 6, marginBottom: 14 },
  statusText: { color: '#972317', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  title: { color: '#26201D', fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -0.8 },
  description: { color: '#6A5E58', fontSize: 16, lineHeight: 24, marginTop: 10 },
  detailsCard: { gap: 16, padding: 18, marginTop: 20, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailText: { flex: 1, color: '#39312D', fontSize: 15, lineHeight: 21 },
  sectionTitle: { color: '#26201D', fontSize: 20, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  supportingText: { color: '#6A5E58', fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', minHeight: 96, justifyContent: 'center', padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  statValue: { color: '#C02A16', fontSize: 27, fontWeight: '900' },
  statLabel: { color: '#6A5E58', fontSize: 13, fontWeight: '600', marginTop: 3 },
  actionCard: { minHeight: 84, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5', marginTop: 14 },
  actionIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2F0' },
  actionCopy: { flex: 1, marginHorizontal: 13 },
  actionTitle: { color: '#26201D', fontSize: 16, fontWeight: '800' },
  actionDescription: { color: '#6A5E58', fontSize: 13, lineHeight: 18, marginTop: 3 },
  lifecycleActions: { gap: 10 },
  lifecycleButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, borderWidth: 1, borderColor: '#D86A58', backgroundColor: '#FFF8F6' },
  lifecycleButtonText: { color: '#972317', fontSize: 15, fontWeight: '800' },
  destructiveButton: { borderColor: '#DFA5A7', backgroundColor: '#FFF5F5' },
  destructiveButtonText: { color: '#A51D20' },
  disabledButton: { opacity: 0.5 },
  lifecycleNote: { color: '#6A5E58', fontSize: 13, textAlign: 'center' },
  errorBox: { padding: 14, borderRadius: 12, backgroundColor: '#FCEDEE', borderWidth: 1, borderColor: '#E12D33', marginTop: 16 },
});
