import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { sendInviteEmails } from '@/lib/email';

// Simple guest type for invite sending
interface InviteGuest {
  id: string;
  name: string;
  email: string;
  selected: boolean;
}

export default function SendInvitesScreen() {
  const { id, templateId, customization } = useLocalSearchParams<{
    id: string;
    templateId: string;
    customization: string;
  }>();  // Mock guests data (would come from event attendees/guests list)
  const [guests, setGuests] = useState<InviteGuest[]>([
    { id: '1', name: 'John Smith', email: 'john@example.com', selected: false },
    { id: '2', name: 'Jane Doe', email: 'jane@example.com', selected: false },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', selected: false },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com', selected: false },
  ]);

  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedCount = guests.filter(g => g.selected).length;

  const toggleGuest = (guestId: string) => {
    setGuests(prev =>
      prev.map(g => (g.id === guestId ? { ...g, selected: !g.selected } : g))
    );
  };

  const selectAll = () => {
    const allSelected = guests.every(g => g.selected);
    setGuests(prev => prev.map(g => ({ ...g, selected: !allSelected })));
  };

  const addNewGuest = () => {
    if (!newGuestName.trim() || !newGuestEmail.trim()) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newGuestEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const newGuest: InviteGuest = {
      id: Date.now().toString(),
      name: newGuestName.trim(),
      email: newGuestEmail.trim().toLowerCase(),
      selected: true,
    };

    setGuests(prev => [...prev, newGuest]);
    setNewGuestName('');
    setNewGuestEmail('');
  };

  const handleSendInvites = async () => {
    const selectedGuests = guests.filter(g => g.selected);

    if (selectedGuests.length === 0) {
      Alert.alert('No Guests Selected', 'Please select at least one guest to send invites to');
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
            try {
              // TODO: Integrate with actual email API
              await sendInviteEmails({
                eventId: id,
                templateId: templateId || '',
                recipients: selectedGuests.map(g => ({ name: g.name, email: g.email })),
                customization: customization ? JSON.parse(customization) : undefined,
              });

              Alert.alert(
                'Success!',
                `Invitations sent to ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.push(`/events/${id}`),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to send invitations. Please try again.');
              console.error('Send invites error:', error);
            } finally {
              setIsSending(false);
            }
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
          <TouchableOpacity style={styles.addButton} onPress={addNewGuest}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Guest</Text>
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
                <Text style={styles.emptyStateText}>No guests added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add guests above to start sending invitations
                </Text>
              </View>
            }
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

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
  addButtonText: {
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
