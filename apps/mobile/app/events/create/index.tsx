import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { createMvpIdempotencyKey, type MvpEventCreateInput } from '@partyhause/core/mvp';

import { api } from '@/lib/client';

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 2_000;
const LOCATION_LIMIT = 255;
const TIMEZONE_LIMIT = 50;

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

function Field({ children, label, required = false }: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      {children}
    </View>
  );
}

export default function EventFormScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const queryClient = useQueryClient();
  const createCommands = useRef(new Map<string, string>());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 60 * 60 * 1_000));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 4 * 60 * 60 * 1_000));
  const [timezone, setTimezone] = useState(deviceTimezone);
  const [location, setLocation] = useState('');
  const [revision, setRevision] = useState<number | null>(null);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(eventId);

  useEffect(() => {
    if (!eventId) return;
    let current = true;
    void api.events.get(eventId).then((result) => {
      if (!current) return;
      if (result.error || !result.data) {
        setError(result.error?.message || 'The event could not be loaded.');
        setLoading(false);
        return;
      }
      const event = result.data;
      setName(event.name);
      setDescription(event.description ?? '');
      setStartDate(new Date(event.start));
      setEndDate(new Date(event.end));
      setTimezone(event.timezone);
      setLocation(event.location);
      setRevision(event.revision);
      setDirty(false);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [eventId, loadAttempt]);

  function change(setter: (value: string) => void, value: string): void {
    setter(value);
    setDirty(true);
  }

  function updateDate(
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    target: 'start' | 'end',
  ): void {
    if (Platform.OS !== 'ios') {
      if (target === 'start') setStartPickerVisible(false);
      else setEndPickerVisible(false);
    }
    if (event.type === 'dismissed' || !selectedDate) return;
    if (target === 'start') setStartDate(selectedDate);
    else setEndDate(selectedDate);
    setDirty(true);
  }

  function validatedInput(): MvpEventCreateInput | null {
    if (!name.trim()) {
      setError('Enter an event name.');
      return null;
    }
    if (!location.trim()) {
      setError('Enter an event location.');
      return null;
    }
    if (!validTimezone(timezone.trim())) {
      setError('Enter a valid IANA timezone, such as America/New_York.');
      return null;
    }
    if (endDate <= startDate) {
      setError('End time must be after start time.');
      return null;
    }
    return {
      name: name.trim(),
      description: description.trim() || null,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timezone: timezone.trim(),
      location: location.trim(),
    };
  }

  function createKey(input: MvpEventCreateInput): string {
    const fingerprint = JSON.stringify(input);
    const existing = createCommands.current.get(fingerprint);
    if (existing) return existing;
    const key = createMvpIdempotencyKey('event-create');
    createCommands.current.set(fingerprint, key);
    return key;
  }

  async function save(): Promise<void> {
    const input = validatedInput();
    if (!input) return;
    if (editing && revision === null) {
      setError('The event revision is unavailable. Reload and try again.');
      return;
    }

    setSaving(true);
    setError(null);
    const result = editing
      ? await api.events.update(eventId!, { ...input, expectedRevision: revision! })
      : await api.events.create(input, createKey(input));
    setSaving(false);
    if (result.error || !result.data) {
      setError(result.error?.code === 'REVISION_CONFLICT'
        ? 'This event changed elsewhere. Go back and reopen it before editing.'
        : result.error?.message || 'The event could not be saved.');
      return;
    }
    setDirty(false);
    await queryClient.invalidateQueries({ queryKey: ['user-events'] });
    await queryClient.invalidateQueries({ queryKey: ['mvp-event', result.data.id] });
    router.replace(`/events/${result.data.id}`);
  }

  function close(): void {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved event changes will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C02A16" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (editing && revision === null && error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={46} color="#B42328" />
        <Text style={styles.loadErrorTitle}>Event unavailable</Text>
        <Text style={styles.loadErrorText}>{error}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Close event form" accessibilityRole="button" style={styles.backButton} onPress={close}>
          <Ionicons name="close" size={24} color="#26201D" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{editing ? 'Edit event' : 'New event'}</Text>
          <Text style={styles.headerSubtitle}>Private event, up to 50 guests</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Event name" required>
          <TextInput
            accessibilityLabel="Event name"
            style={styles.input}
            value={name}
            onChangeText={(value) => change(setName, value)}
            maxLength={TITLE_LIMIT}
            placeholder="Saturday dinner"
            placeholderTextColor="#847771"
          />
        </Field>

        <Field label="Description">
          <TextInput
            accessibilityLabel="Event description"
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(value) => change(setDescription, value)}
            maxLength={DESCRIPTION_LIMIT}
            placeholder="What should guests know?"
            placeholderTextColor="#847771"
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label="Start" required>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.inputButton}
            onPress={() => setStartPickerVisible((visible) => !visible)}
          >
            <Text style={styles.inputButtonText}>{startDate.toLocaleString()}</Text>
            <Ionicons name="calendar-outline" size={20} color="#C02A16" />
          </TouchableOpacity>
          {startPickerVisible ? (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => updateDate(event, date, 'start')}
            />
          ) : null}
        </Field>

        <Field label="End" required>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.inputButton}
            onPress={() => setEndPickerVisible((visible) => !visible)}
          >
            <Text style={styles.inputButtonText}>{endDate.toLocaleString()}</Text>
            <Ionicons name="calendar-outline" size={20} color="#C02A16" />
          </TouchableOpacity>
          {endPickerVisible ? (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => updateDate(event, date, 'end')}
            />
          ) : null}
        </Field>

        <Field label="IANA timezone" required>
          <TextInput
            accessibilityLabel="Event timezone"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            value={timezone}
            onChangeText={(value) => change(setTimezone, value)}
            maxLength={TIMEZONE_LIMIT}
            placeholder="America/New_York"
            placeholderTextColor="#847771"
          />
        </Field>

        <Field label="Location" required>
          <TextInput
            accessibilityLabel="Event location"
            style={styles.input}
            value={location}
            onChangeText={(value) => change(setLocation, value)}
            maxLength={LOCATION_LIMIT}
            placeholder="Venue or street address"
            placeholderTextColor="#847771"
          />
        </Field>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.saveButton, (saving || (editing && !dirty)) && styles.disabledButton]}
          onPress={() => { void save(); }}
          disabled={saving || (editing && !dirty)}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={styles.saveButtonText}>{editing ? 'Save Changes' : 'Save Draft'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.saveNote}>
          {editing ? 'Changes are saved only after server confirmation.' : 'The event remains private and unpublished.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAF9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FBFAF9' },
  loadingText: { color: '#6A5E58', fontSize: 15 },
  loadErrorTitle: { color: '#26201D', fontSize: 21, fontWeight: '900' },
  loadErrorText: { maxWidth: 320, color: '#6A5E58', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 48, justifyContent: 'center', borderRadius: 12, backgroundColor: '#C02A16', paddingHorizontal: 22 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { color: '#972317', fontWeight: '700' },
  header: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7E5',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerCopy: { flex: 1, paddingBottom: 3 },
  headerTitle: { color: '#26201D', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#6A5E58', fontSize: 14, marginTop: 2 },
  headerSpacer: { width: 44 },
  content: { padding: 20, paddingBottom: 48 },
  field: { marginBottom: 22 },
  label: { color: '#39312D', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#D8D2CF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#26201D',
    fontSize: 16,
  },
  textArea: { minHeight: 112 },
  inputButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D8D2CF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputButtonText: { flex: 1, color: '#26201D', fontSize: 16 },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FCEDEE',
    borderWidth: 1,
    borderColor: '#E12D33',
    marginBottom: 18,
  },
  errorText: { color: '#9F1D22', fontSize: 14, lineHeight: 20 },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#C02A16',
  },
  disabledButton: { opacity: 0.55 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  saveNote: { color: '#6A5E58', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
