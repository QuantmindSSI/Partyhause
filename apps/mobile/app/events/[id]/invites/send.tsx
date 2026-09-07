import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { sendInviteEmails } from '@/lib/email';
import { api } from '@/lib/client';

/** A guest row plus its selection state on this screen. */
interface InviteGuest {
  /** The server's guest id. Required: /api/send-email only accepts addresses
   *  already on this event's guest list, so a guest with no row cannot be
   *  mailed. */
  id: string;
  name: string;
  email: string;
  selected: boolean;
}

/**
 * Compose and send an event's invitations.
 *
 * WHAT THIS USED TO DO
 *   Rendered four fabricated guests, hardcoded in the source: John Smith,
 *   Jane Doe, Bob Johnson and Alice Williams at @example.com. The Send button
 *   mailed those addresses. It never read the event's real guest list, so a
 *   host who had spent the previous screen adding twenty guests saw four
 *   strangers here instead.
 *
 *   The send could not have worked in any case. /api/send-email requires
 *   authentication (the mobile client sent none), requires `event_id` at the
 *   top level of the body (it was buried in `metadata`), and restricts
 *   recipients to that event's guest list (@example.com is on nobody's).
 */
export default function SendInvitesScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
    templateId: string;
    customization: string;
  }>();

  const [event, setEvent] = useState<{
    id: string;
    name: string;
    date: string;
    location: string;
    description?: string;
  } | null>(null);
  const [guests, setGuests] = useState<InviteGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedCount = guests.filter(g => g.selected).length;

  /** Load the event and its real guest list. Both are required to send. */
  const load = useCallback(async () => {
    if (!id) {
      setLoadError('No event was specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const [eventResult, guestResult] = await Promise.all([
      api.events.get(id),
      api.guests.listForEvent(id),
    ]);

    if (eventResult.error || !eventResult.data) {
      setLoadError(eventResult.error?.message ?? 'This event could not be loaded.');
      setLoading(false);
      return;
    }

    if (guestResult.error) {
      setLoadError(guestResult.error.message);
      setLoading(false);
      return;
    }

    const loaded = eventResult.data;
    setEvent({
      id: loaded.id,
      name: loaded.name,
      date: loaded.start_date ?? '',
      location: loaded.location ?? '',
      description: loaded.description ?? undefined,
    });

    setGuests(
      (guestResult.data ?? [])
        .filter(g => typeof g.email === 'string' && g.email.trim() !== '')
        .map(g => ({
          id: g.id,
          name: g.name || g.email,
          email: g.email,
          selected: false,
        })),
    );

    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleGuest = (guestId: string) => {
    setGuests(prev =>
      prev.map(g => (g.id === guestId ? { ...g, selected: !g.selected } : g))
    );
  };

  const selectAll = () => {
    const allSelected = guests.every(g => g.selected);
    setGuests(prev => prev.map(g => ({ ...g, selected: !allSelected })));
  };

  /**
   * Add a guest to the event, then to this list.
   *
   * The server call is not optional. This used to push a local object with
   * `id: Date.now().toString()` and no persistence, which meant the guest
   * vanished on navigation and, more to the point, was not on the event's
   * guest list, so /api/send-email would refuse to mail them.
   */
  const addNewGuest = async () => {
    const name = newGuestName.trim();
    const email = newGuestEmail.trim().toLowerCase();

    if (!name || !email) {
      Alert.alert('Missing details', 'Enter both a name and an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid email', 'That does not look like an email address.');
      return;
    }

    if (guests.some(g => g.email === email)) {
      Alert.alert('Already invited', `${email} is already on the guest list.`);
      return;
    }

    if (!id) return;

    setIsAddingGuest(true);
    const { data, error } = await api.guests.create(id, { name, email });
    setIsAddingGuest(false);

    if (error || !data) {
      Alert.alert('Could not add guest', error?.message ?? 'The guest was not saved. Try again.');
      return;
    }

    setGuests(prev => [
      ...prev,
      { id: data.id, name: data.name || name, email: data.email || email, selected: true },
    ]);
    setNewGuestName('');
    setNewGuestEmail('');
  };

  const handleSendInvites = async () => {
    const selectedGuests = guests.filter(g => g.selected);

    if (selectedGuests.length === 0) {
      Alert.alert('No Guests Selected', 'Please select at least one guest to send invites to');
      return;
    }

    if (!event) {
      Alert.alert('Not ready', 'The event has not finished loading yet.');
      return;
    }

    Alert.alert(
      'Send Invites?',
      `Send invitations to ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setIsSending(true);
            const result = await sendInviteEmails({
              event,
              recipients: selectedGuests.map(g => ({
                name: g.name,
                email: g.email,
                guest_id: g.id,
              })),
            });
            setIsSending(false);

            if (result.success) {
              // Clear the selection so a second tap cannot re-send to everyone
              // who has just been invited.
              setGuests(prev => prev.map(g => ({ ...g, selected: false })));
              Alert.alert(
                'Invitations sent',
                `Sent to ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}.`,
                [{ text: 'OK', onPress: () => router.push(`/events/${id}`) }],
              );
              return;
            }

            // Partial failure is the common case with email, and the host needs
            // to know who did not receive one. Successful recipients are
            // deselected so a retry does not mail them twice.
            const failed = new Set(result.failedRecipients);
            setGuests(prev => prev.map(g => ({ ...g, selected: failed.has(g.email) })));
            Alert.alert(
              'Some invitations failed',
              `${result.error ?? 'The send did not complete.'}\n\nThe guests who did not receive one are still selected, so you can retry just those.`,
            );
          },
        },
      ]
    );
  };

  const renderGuestItem = ({ item }: { item: InviteGuest }) => (
    <TouchableOpacity
      style={[styles.guestItem, item.selected && styles.guestItemSelected]}
      onPress={() => toggleGuest(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.guestCheckbox}>
        {item.selected && <Ionicons name="checkmark" size={18} color="#6366F1" />}
      </View>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{item.name}</Text>
        <Text style={styles.guestEmail}>{item.email}</Text>
      </View>
      <Ionicons
        name={item.selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={item.selected ? '#6366F1' : '#D1D5DB'}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FAFAFA', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Send Invitations</Text>
            <Text style={styles.headerSubtitle}>
              {selectedCount} guest{selectedCount !== 1 ? 's' : ''} selected
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.centeredText}>Loading the guest list…</Text>
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.centeredText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !loadError && (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add New Guest */}
        <View style={styles.addGuestCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-add" size={24} color="#6366F1" />
            <Text style={styles.cardTitle}>Add Guest</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Guest name"
            value={newGuestName}
            onChangeText={setNewGuestName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={newGuestEmail}
            onChangeText={setNewGuestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.addButton, isAddingGuest && styles.addButtonDisabled]}
            onPress={addNewGuest}
            disabled={isAddingGuest}
          >
            {isAddingGuest ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.addButtonText}>
              {isAddingGuest ? 'Adding…' : 'Add Guest'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest List */}
        <View style={styles.guestListCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="people" size={24} color="#6366F1" />
              <Text style={styles.cardTitle}>Guest List ({guests.length})</Text>
            </View>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllText}>
                {guests.every(g => g.selected) ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={guests}
            renderItem={renderGuestItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No guests on this event yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add guests above. They are saved to the event, which is what
                  lets us email them.
                </Text>
              </View>
            }
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      )}

      {/* Bottom Action Bar */}
      {selectedCount > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.selectedInfo}>
            <Ionicons name="mail" size={20} color="#6366F1" />
            <Text style={styles.selectedText}>
              {selectedCount} invitation{selectedCount !== 1 ? 's' : ''} ready to send
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSendInvites}
            disabled={isSending}
          >
            {isSending ? (
              <Text style={styles.sendButtonText}>Sending...</Text>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Invites</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addGuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guestListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  centeredText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  guestItemSelected: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 12,
  },
  guestCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  guestEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 20,
    gap: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
