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
import { supabase } from '@/lib/supabase';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'maybe';
  plus_ones: number;
  plus_ones_names?: string[];
  dietary_restrictions?: string;
  notes?: string;
  checked_in: boolean;
  checked_in_at?: string;
  invited_at: string;
  rsvp_responded_at?: string;
}

interface GuestStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  maybe: number;
  checked_in: number;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
      // Get auth token from Supabase session
      if (!supabase) {
        Alert.alert('Configuration Error', 'Supabase client not initialized');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in to view guests');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/guests?eventId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Unauthorized', 'You do not have permission to view this guest list');
        } else if (response.status === 403) {
          Alert.alert('Forbidden', 'Only event hosts can view the guest list');
        } else {
          throw new Error('Failed to fetch guests');
        }
        return;
      }

      const data = await response.json();
      setGuests(data.guests || []);
      
      // Map API response stats (camelCase) to component stats (snake_case)
      if (data.stats) {
        setStats({
          total: data.stats.total || 0,
          accepted: data.stats.accepted || 0,
          declined: data.stats.declined || 0,
          pending: data.stats.pending || 0,
          maybe: data.stats.maybe || 0,
          checked_in: data.stats.checkedIn || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      Alert.alert('Error', 'Failed to load guest list');
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
      // Get auth token from Supabase session
      if (!supabase) {
        Alert.alert('Configuration Error', 'Supabase client not initialized');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in to check in guests');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/guests?id=${guestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkedIn: !currentStatus, // API expects camelCase
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Unauthorized', 'You do not have permission to check in guests');
        } else {
          throw new Error('Failed to update check-in status');
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
      console.error('Error updating check-in:', error);
      Alert.alert('Error', 'Failed to update check-in status');
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
              {(guest.plus_ones > 0 || guest.dietary_restrictions || guest.notes) && (
                <View style={styles.guestDetails}>
                  {guest.plus_ones > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        +{guest.plus_ones} guest{guest.plus_ones > 1 ? 's' : ''}
                        {guest.plus_ones_names && guest.plus_ones_names.length > 0
                          ? `: ${guest.plus_ones_names.join(', ')}`
                          : ''}
                      </Text>
                    </View>
                  )}
                  {guest.dietary_restrictions && (
                    <View style={styles.detailRow}>
                      <Ionicons name="restaurant" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{guest.dietary_restrictions}</Text>
                    </View>
                  )}
                  {guest.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{guest.notes}</Text>
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

              {/* Timestamps */}
              <View style={styles.timestamps}>
                <Text style={styles.timestampText}>
                  Invited: {new Date(guest.invited_at).toLocaleDateString()}
                </Text>
                {guest.rsvp_responded_at && (
                  <Text style={styles.timestampText}>
                    Responded: {new Date(guest.rsvp_responded_at).toLocaleDateString()}
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
