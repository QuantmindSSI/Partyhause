import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase, requireSupabase } from '@/lib/supabase';
import { EventDetailsScreen } from './EventDetailsScreen';
import { GuestManagementScreen } from './GuestManagementScreen';

interface Event {
  id: string;
  name: string;
  event_date: string;
  location?: string;
  venue?: string;
  description?: string;
  spotify_playlist_url?: string;
  host_id: string;
  created_at: string;
}

type ScreenMode = 'dashboard' | 'event-details' | 'guest-management';

interface DashboardScreenProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export const DashboardScreen = ({ userId, userEmail, onSignOut }: DashboardScreenProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['user-events', userId],
    queryFn: async () => {
      console.log('[Dashboard] Fetching events for user:', userId);
      if (!userId || !supabase) {
        console.log('[Dashboard] No userId or supabase client');
        return [];
      }
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('event_date', { ascending: true });
      
      if (error) {
        console.error('[Dashboard] Error fetching events:', error);
        throw error;
      }
      
      console.log('[Dashboard] Fetched', data?.length || 0, 'events');
      return data || [];
    },
    enabled: !!userId && !!supabase,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setScreenMode('event-details');
  };

  const handleBackToDashboard = () => {
    setScreenMode('dashboard');
    setSelectedEvent(null);
  };

  const handleViewGuests = () => {
    setScreenMode('guest-management');
  };

  // Show EventDetailsScreen
  if (screenMode === 'event-details' && selectedEvent) {
    return (
      <EventDetailsScreen
        event={selectedEvent}
        onBack={handleBackToDashboard}
        onViewGuests={handleViewGuests}
      />
    );
  }

  // Show GuestManagementScreen
  if (screenMode === 'guest-management' && selectedEvent) {
    return (
      <GuestManagementScreen
        eventId={selectedEvent.id}
        eventName={selectedEvent.name}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Show Dashboard (default)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey there! 👋</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Events</Text>
          <Text style={styles.sectionSubtitle}>
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading your events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎈</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Create your first event on the web app at partyhause.com
            </Text>
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>+ Create on Web</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <TouchableOpacity 
                key={event.id} 
                style={styles.eventCard}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.7}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    {(event.venue || event.location) && (
                      <Text style={styles.eventVenue}>📍 {event.venue || event.location}</Text>
                    )}
                  </View>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventDateText}>{formatDate(event.event_date)}</Text>
                  </View>
                </View>
                
                {event.description && (
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
                
                <View style={styles.eventFooter}>
                  <Text style={styles.eventAction}>Tap to view details →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#a8a8b3',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  signOutText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#a8a8b3',
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#a8a8b3',
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#a8a8b3',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  eventsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eventCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
    color: '#6C63FF',
  },
  eventBadge: {
    backgroundColor: '#6C63FF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  eventDescription: {
    fontSize: 14,
    color: '#a8a8b3',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a3a',
    paddingTop: 12,
  },
  eventAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
});
