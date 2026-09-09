import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  createMvpIdempotencyKey,
  type MvpGuest,
  type MvpGuestsPage,
  type MvpGuestStats,
  type MvpRsvpStatus,
} from '@partyhause/core/mvp';

import { api } from '@/lib/client';

type GuestEditor = { mode: 'add' } | { mode: 'edit'; guest: MvpGuest };
type GuestFilter = 'all' | MvpRsvpStatus;

const NAME_LIMIT = 120;
const EMAIL_LIMIT = 254;

function guestStats(guests: MvpGuest[]): MvpGuestStats {
  return {
    total: guests.length,
    pending: guests.filter((guest) => guest.rsvpStatus === 'pending').length,
    accepted: guests.filter((guest) => guest.rsvpStatus === 'accepted').length,
    declined: guests.filter((guest) => guest.rsvpStatus === 'declined').length,
    maybe: guests.filter((guest) => guest.rsvpStatus === 'maybe').length,
    checkedIn: guests.filter((guest) => guest.checkedIn).length,
  };
}

function statusColor(status: MvpRsvpStatus): string {
  if (status === 'accepted') return '#197A4A';
  if (status === 'declined') return '#B42328';
  if (status === 'maybe') return '#A35A00';
  return '#625750';
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function GuestForm({
  editor,
  email,
  error,
  name,
  onCancel,
  onEmailChange,
  onNameChange,
  onSave,
  saving,
}: {
  editor: GuestEditor;
  email: string;
  error: string | null;
  name: string;
  onCancel: () => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editor.mode === 'add' ? 'Add guest' : 'Edit guest'}</Text>
      <TextInput
        accessibilityLabel="Guest name"
        maxLength={NAME_LIMIT}
        onChangeText={onNameChange}
        placeholder="Full name"
        placeholderTextColor="#847771"
        style={styles.input}
        value={name}
      />
      <TextInput
        accessibilityLabel="Guest email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        maxLength={EMAIL_LIMIT}
        onChangeText={onEmailChange}
        placeholder="name@example.com"
        placeholderTextColor="#847771"
        style={styles.input}
        value={email}
      />
      {error ? <Text accessibilityRole="alert" style={styles.formError}>{error}</Text> : null}
      <View style={styles.formActions}>
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={onCancel} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.primaryAction, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={styles.primaryActionText}>{editor.mode === 'add' ? 'Add Guest' : 'Save Guest'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GuestCard({
  eventPublished,
  guest,
  onAttendance,
  onEdit,
  onRemove,
  pending,
}: {
  eventPublished: boolean;
  guest: MvpGuest;
  onAttendance: (guest: MvpGuest) => void;
  onEdit: (guest: MvpGuest) => void;
  onRemove: (guest: MvpGuest) => void;
  pending: boolean;
}) {
  const canCheckIn = eventPublished && guest.rsvpStatus === 'accepted';
  return (
    <View style={styles.guestCard}>
      <View style={styles.guestTopRow}>
        <View style={styles.guestIdentity}>
          <Text style={styles.guestName}>{guest.name}</Text>
          <Text style={styles.guestEmail}>{guest.email}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor(guest.rsvpStatus) }]}>
          <Text style={[styles.statusText, { color: statusColor(guest.rsvpStatus) }]}>{guest.rsvpStatus}</Text>
        </View>
      </View>

      <View style={styles.attendanceRow}>
        <Ionicons
          name={guest.checkedIn ? 'checkmark-circle' : 'ellipse-outline'}
          size={19}
          color={guest.checkedIn ? '#197A4A' : '#847771'}
        />
        <Text style={styles.attendanceText}>
          {guest.checkedIn
            ? `Checked in${guest.checkedInAt ? ` at ${new Date(guest.checkedInAt).toLocaleTimeString()}` : ''}`
            : 'Not checked in'}
        </Text>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity accessibilityRole="button" disabled={pending} onPress={() => onEdit(guest)} style={styles.rowButton}>
          <Ionicons name="pencil-outline" size={17} color="#972317" />
          <Text style={styles.rowButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={pending} onPress={() => onRemove(guest)} style={styles.rowButton}>
          <Ionicons name="trash-outline" size={17} color="#A51D20" />
          <Text style={styles.destructiveText}>Remove</Text>
        </TouchableOpacity>
        {canCheckIn ? (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={pending}
            onPress={() => onAttendance(guest)}
            style={[styles.rowButton, styles.attendanceButton]}
          >
            {pending ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Ionicons name={guest.checkedIn ? 'refresh-outline' : 'checkmark'} size={17} color="#FFFFFF" />
                <Text style={styles.attendanceButtonText}>{guest.checkedIn ? 'Correct' : 'Check In'}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function EventGuestsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const commandKeys = useRef(new Map<string, string>());
  const [page, setPage] = useState<MvpGuestsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [editor, setEditor] = useState<GuestEditor | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [pendingGuests, setPendingGuests] = useState<Set<string>>(() => new Set());

  const loadGuests = useCallback(async (showLoading = false) => {
    if (!id) {
      setLoadError('This event link is incomplete.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (showLoading) setLoading(true);
    const result = await api.guests.listForEventWithStats(id);
    if (result.error || !result.data) {
      setLoadError(result.error?.status === 404
        ? 'This event does not exist or is no longer available.'
        : result.error?.message || 'The guest list could not be loaded.');
    } else {
      setPage(result.data);
      setLoadError(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    void loadGuests(true);
  }, [loadGuests]);

  function commandKey(fingerprint: string): string {
    const existing = commandKeys.current.get(fingerprint);
    if (existing) return existing;
    const created = createMvpIdempotencyKey('guest');
    commandKeys.current.set(fingerprint, created);
    return created;
  }

  function setGuestPending(guestId: string, pending: boolean): void {
    setPendingGuests((current) => {
      const next = new Set(current);
      if (pending) next.add(guestId);
      else next.delete(guestId);
      return next;
    });
  }

  function applyGuest(confirmed: MvpGuest): void {
    setPage((current) => {
      if (!current) return current;
      const found = current.guests.some((guest) => guest.id === confirmed.id);
      const guests = (found
        ? current.guests.map((guest) => guest.id === confirmed.id ? confirmed : guest)
        : [...current.guests, confirmed]
      ).sort((left, right) => left.name.localeCompare(right.name));
      return { ...current, guests, stats: guestStats(guests) };
    });
  }

  function openAdd(): void {
    setName('');
    setEmail('');
    setFormError(null);
    setEditor({ mode: 'add' });
  }

  function openEdit(guest: MvpGuest): void {
    setName(guest.name);
    setEmail(guest.email);
    setFormError(null);
    setEditor({ mode: 'edit', guest });
  }

  async function saveGuest(): Promise<void> {
    if (!id || !editor) return;
    const input = { name: name.trim(), email: email.trim().toLowerCase() };
    if (!input.name || !/^\S+@\S+\.\S+$/.test(input.email)) {
      setFormError('Enter a name and valid email address.');
      return;
    }
    if (editor.mode === 'add' && (page?.stats.total ?? 0) >= 50) {
      setFormError('This event already has 50 guests.');
      return;
    }
    setFormSaving(true);
    setFormError(null);
    const result = editor.mode === 'add'
      ? await api.guests.create(id, input, commandKey(`add:${id}:${JSON.stringify(input)}`))
      : await api.guests.update(editor.guest.id, {
          ...input,
          expectedRevision: editor.guest.revision,
        });
    setFormSaving(false);
    if (result.error || !result.data) {
      setFormError(result.error?.code === 'REVISION_CONFLICT'
        ? 'This guest changed elsewhere. Refresh and try again.'
        : result.error?.message || 'The guest could not be saved.');
      if (result.error?.code === 'REVISION_CONFLICT') void loadGuests();
      return;
    }
    applyGuest(result.data);
    setEditor(null);
  }

  async function removeGuest(guest: MvpGuest): Promise<void> {
    setGuestPending(guest.id, true);
    const result = await api.guests.remove(
      guest.id,
      guest.revision,
      commandKey(`remove:${guest.id}:${guest.revision}`),
    );
    setGuestPending(guest.id, false);
    if (result.error) {
      Alert.alert('Guest not removed', result.error.message);
      if (result.error.code === 'REVISION_CONFLICT') void loadGuests();
      return;
    }
    setPage((current) => {
      if (!current) return current;
      const guests = current.guests.filter((item) => item.id !== guest.id);
      return { ...current, guests, stats: guestStats(guests) };
    });
  }

  function confirmRemove(guest: MvpGuest): void {
    Alert.alert(
      `Remove ${guest.name}?`,
      'This removes the guest and immediately revokes their invitation and RSVP link.',
      [
        { text: 'Keep Guest', style: 'cancel' },
        { text: 'Remove Guest', style: 'destructive', onPress: () => { void removeGuest(guest); } },
      ],
    );
  }

  async function updateAttendance(guest: MvpGuest): Promise<void> {
    setGuestPending(guest.id, true);
    const fingerprint = `${guest.checkedIn ? 'correct' : 'check-in'}:${guest.id}:${guest.revision}`;
    const key = commandKey(fingerprint);
    const result = guest.checkedIn
      ? await api.guests.correctCheckIn(guest.id, false, guest.revision, key)
      : await api.guests.checkIn(guest.id, guest.revision, key);
    setGuestPending(guest.id, false);
    if (result.error || !result.data) {
      Alert.alert('Attendance not changed', result.error?.message || 'The server did not confirm this change.');
      if (result.error?.code === 'REVISION_CONFLICT') void loadGuests();
      return;
    }
    applyGuest(result.data);
  }

  function confirmAttendance(guest: MvpGuest): void {
    if (!guest.checkedIn) {
      void updateAttendance(guest);
      return;
    }
    Alert.alert(
      `Correct ${guest.name}'s attendance?`,
      'This marks the guest as not checked in and adds an audit record. It does not erase the original check-in.',
      [
        { text: 'Keep Check-In', style: 'cancel' },
        { text: 'Confirm Correction', style: 'destructive', onPress: () => { void updateAttendance(guest); } },
      ],
    );
  }

  const guests = page?.guests ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredGuests = guests.filter((guest) => {
    const matchesText = !normalizedSearch
      || guest.name.toLowerCase().includes(normalizedSearch)
      || guest.email.toLowerCase().includes(normalizedSearch);
    return matchesText && (filter === 'all' || guest.rsvpStatus === filter);
  });

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C02A16" /></View>;
  }

  if (!page) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={46} color="#B42328" />
        <Text style={styles.emptyTitle}>Guest list unavailable</Text>
        <Text style={styles.emptyCopy}>{loadError}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryAction} onPress={() => { void loadGuests(true); }}>
          <Text style={styles.primaryActionText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={() => router.back()}>
          <Text style={styles.secondaryActionText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const atCapacity = page.stats.total >= page.event.capacity;
  const eventPublished = page.event.status === 'published';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#26201D" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Guests</Text>
          <Text style={styles.headerSubtitle}>{page.stats.total} of {page.event.capacity}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={atCapacity ? 'Guest capacity reached' : 'Add guest'}
          accessibilityRole="button"
          disabled={atCapacity || editor !== null}
          style={styles.headerButton}
          onPress={openAdd}
        >
          <Ionicons name="person-add-outline" size={22} color={atCapacity ? '#B9B0AC' : '#C02A16'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadGuests(); }} tintColor="#C02A16" />}
      >
        <View style={styles.summaryGrid}>
          <Summary label="Total" value={page.stats.total} />
          <Summary label="Accepted" value={page.stats.accepted} />
          <Summary label="Pending" value={page.stats.pending} />
          <Summary label="Checked In" value={page.stats.checkedIn} />
        </View>

        {atCapacity ? <Text style={styles.capacityNotice}>Guest capacity reached. Remove a guest before adding another.</Text> : null}
        {!eventPublished ? <Text style={styles.infoNotice}>Publish the event before recording attendance.</Text> : null}
        {loadError ? <Text accessibilityRole="alert" style={styles.formError}>{loadError}</Text> : null}

        {editor ? (
          <GuestForm
            editor={editor}
            email={email}
            error={formError}
            name={name}
            onCancel={() => setEditor(null)}
            onEmailChange={setEmail}
            onNameChange={setName}
            onSave={() => { void saveGuest(); }}
            saving={formSaving}
          />
        ) : null}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color="#6A5E58" />
          <TextInput
            accessibilityLabel="Search guests"
            onChangeText={setSearch}
            placeholder="Search name or email"
            placeholderTextColor="#847771"
            style={styles.searchInput}
            value={search}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'pending', 'accepted', 'maybe', 'declined'] as const).map((status) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={status}
              onPress={() => setFilter(status)}
              style={[styles.filter, filter === status && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredGuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={46} color="#B9B0AC" />
            <Text style={styles.emptyTitle}>{guests.length === 0 ? 'No guests yet' : 'No guests match'}</Text>
            <Text style={styles.emptyCopy}>{guests.length === 0 ? 'Add guests manually with a name and email.' : 'Adjust the search or RSVP filter.'}</Text>
          </View>
        ) : filteredGuests.map((guest) => (
          <GuestCard
            eventPublished={eventPublished}
            guest={guest}
            key={guest.id}
            onAttendance={confirmAttendance}
            onEdit={openEdit}
            onRemove={confirmRemove}
            pending={pendingGuests.has(guest.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAF9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#FBFAF9' },
  header: { minHeight: 104, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBE7E5' },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  headerTitle: { color: '#26201D', fontSize: 20, fontWeight: '900' },
  headerSubtitle: { color: '#6A5E58', fontSize: 12, marginTop: 2 },
  content: { padding: 18, paddingBottom: 48 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  summaryCard: { width: '48%', minHeight: 76, justifyContent: 'center', padding: 13, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  summaryValue: { color: '#C02A16', fontSize: 23, fontWeight: '900' },
  summaryLabel: { color: '#6A5E58', fontSize: 12, fontWeight: '700', marginTop: 2 },
  capacityNotice: { color: '#A51D20', backgroundColor: '#FFF2F0', borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 19 },
  infoNotice: { color: '#6A5E58', backgroundColor: '#F1EEEC', borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 19 },
  formCard: { gap: 11, padding: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFF8F6', borderWidth: 1, borderColor: '#E7B1A8' },
  formTitle: { color: '#26201D', fontSize: 18, fontWeight: '900' },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1, borderColor: '#D8D2CF', backgroundColor: '#FFFFFF', color: '#26201D', fontSize: 15 },
  formError: { color: '#A51D20', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  primaryAction: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#C02A16', paddingHorizontal: 18 },
  primaryActionText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryAction: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryActionText: { color: '#6A5E58', fontWeight: '700' },
  disabled: { opacity: 0.55 },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D2CF' },
  searchInput: { flex: 1, color: '#26201D', fontSize: 15 },
  filters: { gap: 8, paddingVertical: 13 },
  filter: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 999, borderWidth: 1, borderColor: '#D8D2CF', backgroundColor: '#FFFFFF' },
  filterActive: { borderColor: '#C02A16', backgroundColor: '#C02A16' },
  filterText: { color: '#625750', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  filterTextActive: { color: '#FFFFFF' },
  guestCard: { padding: 16, marginBottom: 11, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  guestTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guestIdentity: { flex: 1 },
  guestName: { color: '#26201D', fontSize: 17, fontWeight: '800' },
  guestEmail: { color: '#6A5E58', fontSize: 13, marginTop: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 },
  attendanceText: { color: '#514743', fontSize: 13 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  rowButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#D8D2CF' },
  rowButtonText: { color: '#972317', fontSize: 13, fontWeight: '800' },
  destructiveText: { color: '#A51D20', fontSize: 13, fontWeight: '800' },
  attendanceButton: { borderColor: '#197A4A', backgroundColor: '#197A4A' },
  attendanceButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 54 },
  emptyTitle: { color: '#26201D', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { maxWidth: 300, color: '#6A5E58', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
