import { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireSupabase } from '@/lib/supabase';
import { sendInvitationEmail, generateInvitationUrl } from '@/lib/email';

interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string;
  is_checked_in: boolean;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  start_date?: string;
  location: string;
  description?: string;
}

interface GuestManagementScreenProps {
  eventId: string;
  eventName: string;
  event?: Event; // Full event object for email sending
  onBack: () => void;
}

export const GuestManagementScreen = ({ eventId, eventName, event, onBack }: GuestManagementScreenProps) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true); // Toggle for sending email

  // Fetch guests
  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ['event-guests', eventId],
    queryFn: async () => {
      console.log('[GuestManagement] Fetching guests for event:', eventId);
      if (!supabase) {
        console.log('[GuestManagement] No supabase client');
        return [];
      }
      
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GuestManagement] Error fetching guests:', error);
        throw error;
      }

      console.log('[GuestManagement] Fetched', data?.length || 0, 'guests');
      return data || [];
    },
    enabled: !!eventId && !!supabase,
  });

  // Add guest mutation
  const addGuestMutation = useMutation({
    mutationFn: async (newGuest: { name: string; email: string; sendInvite: boolean }) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[GuestManagement] 👤 ADDING GUEST');
      console.log('[GuestManagement] Name:', newGuest.name);
      console.log('[GuestManagement] Email:', newGuest.email);
      console.log('[GuestManagement] Send Invite:', newGuest.sendInvite);
      console.log('[GuestManagement] Event ID:', eventId);
      console.log('[GuestManagement] Has Event Object:', !!event);
      if (event) {
        console.log('[GuestManagement] Event Name:', event.name);
        console.log('[GuestManagement] Event Date:', event.start_date || event.date);
        console.log('[GuestManagement] Event Location:', event.location);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const client = requireSupabase();
      
      // Step 1: Add guest to database
      const { data, error } = await client
        .from('guests')
        .insert({
          event_id: eventId,
          name: newGuest.name.trim(),
          email: newGuest.email.trim(),
          is_checked_in: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[GuestManagement] ❌ Database error:', error);
        throw error;
      }

      console.log('[GuestManagement] ✅ Guest created in database:', data.id);

      // Step 2: Send invitation email if requested and event data is available
      console.log('[GuestManagement] 📧 Checking email send conditions:', {
        sendInvite: newGuest.sendInvite,
        hasEvent: !!event,
        hasData: !!data,
        willSendEmail: !!(newGuest.sendInvite && event && data)
      });
      
      if (newGuest.sendInvite && event && data) {
        console.log('[GuestManagement] 📧 Proceeding to send invitation email...');
        
        try {
          // Create email log entry in database
          const { data: emailLog, error: logError } = await client
            .from('email_logs')
            .insert({
              event_id: eventId,
              guest_id: data.id,
              email_type: 'invitation',
              recipient_email: newGuest.email.trim(),
              subject: `🎉 You're Invited to ${event.name}!`,
              status: 'pending',
            })
            .select()
            .single();

          if (logError) {
            console.warn('[GuestManagement] Failed to create email log:', logError);
          }

          // Send the email
          const invitationUrl = generateInvitationUrl(eventId, data.id);
          const emailResult = await sendInvitationEmail(
            { name: newGuest.name.trim(), email: newGuest.email.trim() },
            {
              id: event.id,
              name: event.name,
              date: event.start_date || event.date,
              location: event.location,
              description: event.description,
            },
            { emailLogId: emailLog?.id }
          );

          if (emailResult.success) {
            console.log('[GuestManagement] Email sent successfully');
            
            // Update email log status
            if (emailLog) {
              await client
                .from('email_logs')
                .update({
                  status: 'sent',
                  resend_email_id: emailResult.messageId,
                  sent_at: new Date().toISOString(),
                })
                .eq('id', emailLog.id);
            }

            // Update guest email_sent_at timestamp
            await client
              .from('guests')
              .update({ email_sent_at: new Date().toISOString() })
              .eq('id', data.id);

            return { ...data, emailSent: true };
          } else {
            console.warn('[GuestManagement] Email sending failed:', emailResult.error);
            
            // Update email log with error
            if (emailLog) {
              await client
                .from('email_logs')
                .update({
                  status: 'failed',
                  error_message: emailResult.error,
                })
                .eq('id', emailLog.id);
            }

            return { ...data, emailSent: false, emailError: emailResult.error };
          }
        } catch (emailError) {
          console.error('[GuestManagement] Error in email flow:', emailError);
          return { ...data, emailSent: false, emailError: String(emailError) };
        }
      }

      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['event-guests', eventId] });
      setShowAddModal(false);
      setNewGuestName('');
      setNewGuestEmail('');
      setSendEmail(true); // Reset toggle

      // Show appropriate success message
      if (data.emailSent) {
        Alert.alert('Success! 🎉', `Guest added and invitation email sent to ${data.email}!`);
      } else if (data.emailSent === false) {
        Alert.alert(
          'Guest Added',
          `${data.name} was added to the guest list, but the invitation email could not be sent.\n\nError: ${data.emailError || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Guest added successfully!');
      }
    },
    onError: (error: any) => {
      console.error('[GuestManagement] Error adding guest:', error);
      Alert.alert('Error', error.message || 'Failed to add guest');
    },
  });

  // Toggle check-in mutation
  const toggleCheckInMutation = useMutation({
    mutationFn: async ({ guestId, isCheckedIn }: { guestId: string; isCheckedIn: boolean }) => {
      console.log('[GuestManagement] Toggling check-in for guest:', guestId, 'to', !isCheckedIn);
      const client = requireSupabase();
      const { data, error } = await client
        .from('guests')
        .update({ is_checked_in: !isCheckedIn })
        .eq('id', guestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-guests', eventId] });
    },
    onError: (error: any) => {
      console.error('[GuestManagement] Error toggling check-in:', error);
      Alert.alert('Error', error.message || 'Failed to update check-in status');
    },
  });

  // Delete guest mutation
  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      console.log('[GuestManagement] Deleting guest:', guestId);
      const client = requireSupabase();
      const { error } = await client
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-guests', eventId] });
      Alert.alert('Success', 'Guest removed successfully');
    },
    onError: (error: any) => {
      console.error('[GuestManagement] Error deleting guest:', error);
      Alert.alert('Error', error.message || 'Failed to remove guest');
    },
  });

  const handleAddGuest = () => {
    if (!newGuestName.trim() || !newGuestEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter both name and email');
      return;
    }

    // Check for duplicate email
    const duplicate = guests.find(
      g => g.email.toLowerCase() === newGuestEmail.trim().toLowerCase()
    );

    if (duplicate) {
      Alert.alert('Duplicate Guest', `${newGuestEmail} is already on the guest list`);
      return;
    }

    addGuestMutation.mutate({ 
      name: newGuestName, 
      email: newGuestEmail,
      sendInvite: sendEmail 
    });
  };

  const handleDeleteGuest = (guest: Guest) => {
    Alert.alert(
      'Remove Guest',
      `Are you sure you want to remove ${guest.name} from the guest list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteGuestMutation.mutate(guest.id),
        },
      ]
    );
  };

  const checkedInCount = guests.filter(g => g.is_checked_in).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Guest List</Text>
          <Text style={styles.headerSubtitle}>{eventName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{guests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueSuccess]}>{checkedInCount}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueWarning]}>
            {guests.length - checkedInCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Guest List */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading guests...</Text>
          </View>
        ) : guests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No guests yet</Text>
            <Text style={styles.emptyText}>Add your first guest to get started!</Text>
          </View>
        ) : (
          <View style={styles.guestList}>
            {guests.map((guest) => (
              <View key={guest.id} style={styles.guestCard}>
                <View style={styles.guestInfo}>
                  <View style={styles.guestAvatar}>
                    <Text style={styles.guestAvatarText}>
                      {guest.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.guestDetails}>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    <Text style={styles.guestEmail}>{guest.email}</Text>
                  </View>
                </View>

                <View style={styles.guestActions}>
                  <View style={styles.checkInToggle}>
                    <Text style={styles.checkInLabel}>
                      {guest.is_checked_in ? '✓ In' : 'Out'}
                    </Text>
                    <Switch
                      value={guest.is_checked_in}
                      onValueChange={() =>
                        toggleCheckInMutation.mutate({
                          guestId: guest.id,
                          isCheckedIn: guest.is_checked_in,
                        })
                      }
                      trackColor={{ false: '#2a2a3a', true: '#6C63FF40' }}
                      thumbColor={guest.is_checked_in ? '#6C63FF' : '#a8a8b3'}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGuest(guest)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+ Add Guest</Text>
      </TouchableOpacity>

      {/* Add Guest Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Guest</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Guest Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#666"
                  value={newGuestName}
                  onChangeText={setNewGuestName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor="#666"
                  value={newGuestEmail}
                  onChangeText={setNewGuestEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.emailToggleContainer}>
                <View style={styles.emailToggleInfo}>
                  <Text style={styles.emailToggleTitle}>📧 Send Invitation Email</Text>
                  <Text style={styles.emailToggleDescription}>
                    Automatically send a beautiful invitation email to the guest
                  </Text>
                </View>
                <Switch
                  value={sendEmail}
                  onValueChange={setSendEmail}
                  trackColor={{ false: '#2a2a3a', true: '#6C63FF40' }}
                  thumbColor={sendEmail ? '#6C63FF' : '#a8a8b3'}
                />
              </View>

              <TouchableOpacity
                style={[styles.addButton, addGuestMutation.isPending && styles.addButtonDisabled]}
                onPress={handleAddGuest}
                disabled={addGuestMutation.isPending}
              >
                {addGuestMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Guest</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a8a8b3',
    marginTop: 2,
  },
  headerSpacer: {
    width: 60,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a24',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6C63FF',
    marginBottom: 4,
  },
  statValueSuccess: {
    color: '#10b981',
  },
  statValueWarning: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a8a8b3',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3a',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#a8a8b3',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  guestList: {
    padding: 24,
  },
  guestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C63FF40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guestAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6C63FF',
  },
  guestDetails: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  guestEmail: {
    fontSize: 13,
    color: '#a8a8b3',
  },
  guestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkInToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkInLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a8b3',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalClose: {
    fontSize: 24,
    color: '#a8a8b3',
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: '#2a2a3a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emailToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2a2a3a',
  },
  emailToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  emailToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emailToggleDescription: {
    fontSize: 12,
    color: '#a8a8b3',
    lineHeight: 16,
  },
});
