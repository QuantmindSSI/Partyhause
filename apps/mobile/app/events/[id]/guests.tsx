import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/client';

import type { Guest } from '@partyhause/core';

// The local Guest interface this replaces declared four columns the schema does
// not have: plus_ones_names, notes, invited_at and rsvp_responded_at. Because
// the type asserted they were present, the UI read them without guarding, and
// `invited_at` in particular rendered as "Invited: Invalid Date" on every row.

interface GuestStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  maybe: number;
  checked_in: number;
}


export default function EventGuestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats>({
    total: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    maybe: 0,
    checked_in: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchGuests();
  }, [id]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      
      // Validate id parameter
      if (!id) {
        console.error('[Guest List] Event ID is missing');
        Alert.alert('Error', 'Event ID is missing');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('[Guest List] Fetching guests for event:', id);

      if (!(await api.auth.isAuthenticated())) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to view guests',
          [{ text: 'OK', style: 'cancel' }]
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // The content-type sniffing and HTML-error-page detection this replaces
      // are handled by the shared transport, which parses defensively and
      // reports a message rather than throwing on a non-JSON body.
      const { data, error: apiError } = await api.guests.listForEventWithStats(id);

      if (apiError) {
        console.error('[Guest List] API error:', apiError.status, apiError.message);
        if (apiError.status === 401 || apiError.status === 403) {
          Alert.alert(
            'Unauthorized',
            'You do not have permission to view this guest list. Only event hosts can view guests.',
            [{ text: 'OK', style: 'cancel' }]
          );
        } else if (apiError.status === 404) {
          Alert.alert('Event Not Found', 'This event does not exist or has been deleted',
            [{ text: 'OK', style: 'cancel' }]);
        } else {
          Alert.alert('Error', `Failed to load guest list. ${apiError.message}`,
            [{ text: 'Retry', onPress: () => fetchGuests() }, { text: 'Cancel', style: 'cancel' }]);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setGuests(data?.guests ?? []);

      // The server counts these; re-deriving them here would miss that
      // `accepted` also covers the legacy 'confirmed' status. Only the
      // checked-in key needs renaming, camelCase on the wire and snake_case
      // in this component's state.
      if (data?.stats) {
        setStats({
          total: data.stats.total,
          accepted: data.stats.accepted,
          declined: data.stats.declined,
          pending: data.stats.pending,
          maybe: data.stats.maybe,
          checked_in: data.stats.checkedIn,
        });
      }
    } catch (error) {
      console.error('[Guest List] Exception:', error);
      Alert.alert(
        'Error', 
        'Failed to load guest list. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => fetchGuests() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuests();
  };

  const handleCheckIn = async (guestId: string, currentStatus: boolean) => {
    try {
      console.log('[Guest List] Checking in guest:', guestId, 'Current status:', currentStatus);
      
      if (!(await api.auth.isAuthenticated())) {
        Alert.alert('Authentication Required', 'Please sign in to check in guests');
        return;
      }

      // This previously sent PATCH /api/guests?id=<id>. The route is
      // PUT /api/guests/:id and there is no PATCH handler at all, so the
      // request 404'd and check-in never persisted. The toggle would flip in
      // the UI and revert on the next refresh.
      const { error: apiError } = await api.guests.update(guestId, {
        checkedIn: !currentStatus,
      });

      if (apiError) {
        console.error('[Guest List] Check-in API error:', apiError.status, apiError.message);
        if (apiError.status === 401 || apiError.status === 403) {
          Alert.alert('Unauthorized', 'You do not have permission to check in guests');
        } else {
          Alert.alert('Error', `Failed to update check-in status. ${apiError.message}`);
        }
        return;
      }

      // Update local state
      setGuests((prev) =>
        prev.map((guest) =>
          guest.id === guestId
            ? { ...guest, checked_in: !currentStatus, checked_in_at: !currentStatus ? new Date().toISOString() : undefined }
            : guest
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        checked_in: prev.checked_in + (!currentStatus ? 1 : -1),
      }));
    } catch (error) {
      console.error('[Guest List] Check-in exception:', error);
      Alert.alert(
        'Error', 
        'Failed to update check-in status. Please try again.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'accepted':
        return '#10b981';
      case 'declined':
        return '#ef4444';
      case 'maybe':
        return '#f59e0b';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'accepted':
        return 'checkmark-circle';
      case 'declined':
        return 'close-circle';
      case 'maybe':
        return 'help-circle';
      case 'pending':
        return 'time';
      default:
        return 'time';
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      searchQuery === '' ||
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || guest.rsvp_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Guest List' }} />
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Guest List',
          headerRight: () => (
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={24} color="#9333ea" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.maybe}</Text>
          <Text style={styles.statLabel}>Maybe</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#6b7280' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#9333ea' }]}>{stats.checked_in}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'pending', 'accepted', 'maybe', 'declined'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Guest List */}
      <ScrollView
        style={styles.guestList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#9333ea']} />
        }
      >
        {filteredGuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {searchQuery || filterStatus !== 'all' ? 'No guests found' : 'No guests yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add guests to see them here'}
            </Text>
          </View>
        ) : (
          filteredGuests.map((guest) => (
            <View key={guest.id} style={styles.guestCard}>
              <View style={styles.guestHeader}>
                <View style={styles.guestInfo}>
                  <View style={styles.guestNameRow}>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    {guest.checked_in && (
                      <View style={styles.checkedInBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                        <Text style={styles.checkedInText}>Checked In</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.guestEmail}>{guest.email}</Text>
                  {guest.phone && (
                    <Text style={styles.guestPhone}>{guest.phone}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(guest.rsvp_status) }]}>
                  <Ionicons
                    name={getStatusIcon(guest.rsvp_status)}
                    size={16}
                    color="#fff"
                  />
                </View>
              </View>

              {/* Additional Info */}
              {(guest.plus_ones > 0 || (guest.dietary_restrictions?.length ?? 0) > 0) && (
                <View style={styles.guestDetails}>
                  {guest.plus_ones > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          +{guest.plus_ones} guest{guest.plus_ones > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {guest.dietary_restrictions && guest.dietary_restrictions.length > 0 && (
                      <View style={styles.detailRow}>
                        <Ionicons name="restaurant" size={16} color="#6b7280" />
                        {/* text[] in Postgres, so an array here. Rendering it
                            directly concatenated the entries with no separator. */}
                        <Text style={styles.detailText}>
                          {guest.dietary_restrictions.join(', ')}
                        </Text>
                      </View>
                    )}
                </View>
              )}

              {/* Check-in Button */}
              {guest.rsvp_status === 'accepted' && (
                <TouchableOpacity
                  style={[
                    styles.checkInButton,
                    guest.checked_in && styles.checkInButtonActive,
                  ]}
                  onPress={() => handleCheckIn(guest.id, guest.checked_in)}
                >
                  <Ionicons
                    name={guest.checked_in ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={20}
                    color={guest.checked_in ? '#fff' : '#9333ea'}
                  />
                  <Text
                    style={[
                      styles.checkInButtonText,
                      guest.checked_in && styles.checkInButtonTextActive,
                    ]}
                  >
                    {guest.checked_in ? 'Checked In' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Timestamps. `created_at` is when the guest row was added,
                  which is the closest the schema has to an invite time; there
                  is no invited_at column, and reading it produced an
                  "Invalid Date" on every row. There is no rsvp_responded_at
                  either, so the second line is gone rather than always hidden. */}
              <View style={styles.timestamps}>
                {guest.created_at && (
                  <Text style={styles.timestampText}>
                    Added: {new Date(guest.created_at).toLocaleDateString()}
                  </Text>
                )}
                {guest.checked_in_at && (
                  <Text style={styles.timestampText}>
                    Checked in: {new Date(guest.checked_in_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  guestList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guestInfo: {
    flex: 1,
  },
  guestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  checkedInText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  guestEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  guestPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9333ea',
    backgroundColor: '#fff',
  },
  checkInButtonActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  checkInButtonTextActive: {
    color: '#fff',
  },
  timestamps: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  timestampText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
