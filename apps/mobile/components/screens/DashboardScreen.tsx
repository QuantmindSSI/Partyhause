import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, ImageBackground } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase, requireSupabase } from '@/lib/supabase';
import { EventCardCarousel } from '@/components/cards/EventCardCarousel';
import { getTemplateBackground } from '@/utils/templateBackgrounds';

interface Event {
  id: string;
  name: string;
  title?: string;
  template_type?: string;
  event_date: string;
  start_date?: string;
  location?: string;
  venue?: string;
  description?: string;
  spotify_playlist_url?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  host_id: string;
  created_at: string;
}

interface DashboardScreenProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export const DashboardScreen = ({ userId, userEmail, onSignOut }: DashboardScreenProps) => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

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
    // Navigate to the new event details screen using dynamic route
    router.push(`/events/${event.id}` as any);
  };

  const handleCreateEvent = () => {
    router.push('/events/create');
  };

  // Transform events to match carousel component interface
  const carouselEvents = events.map(event => ({
    id: event.id,
    title: event.name || event.title || 'Untitled Event',
    description: event.description,
    template_type: event.template_type || 'default',
    start_date: event.start_date || event.event_date,
    end_date: event.event_date,
    location: event.venue || event.location,
    status: (event.status || 'published') as 'draft' | 'published' | 'cancelled' | 'completed',
    settings: {},
  }));

  // Get current event's template background for dashboard
  const currentEventBackground = carouselEvents.length > 0 
    ? getTemplateBackground(carouselEvents[currentEventIndex]?.template_type || 'default')
    : null;

  return (
    <View style={styles.container}>
      {/* Dynamic Background based on center event */}
      {currentEventBackground && carouselEvents.length > 0 && (
        <ImageBackground
          source={{ uri: currentEventBackground }}
          style={StyleSheet.absoluteFill}
          blurRadius={25}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(10,10,15,0.95)', 'rgba(10,10,15,0.85)', 'rgba(10,10,15,0.95)']}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey there! 👋</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.draftsButton} 
            onPress={() => router.push('/events/drafts')}
          >
            <Ionicons name="document-text-outline" size={20} color="#6366F1" />
            <Text style={styles.draftsButtonText}>Drafts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading your events...</Text>
          </View>
        ) : events.length === 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
            }
          >
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎈</Text>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Create your first event and start inviting guests!
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Create Your First Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Events</Text>
              <Text style={styles.sectionSubtitle}>
                {events.length} {events.length === 1 ? 'event' : 'events'} • Swipe to navigate
              </Text>
            </View>
            <View style={styles.carouselContainer}>
              <EventCardCarousel
                events={carouselEvents}
                onEventPress={(event) => router.push(`/events/${event.id}` as any)}
                onIndexChange={setCurrentEventIndex}
                currentUserId={userId}
              />
            </View>
          </>
        )}
      </View>

      {/* Floating Create Button */}
      {events.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateEvent}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  draftsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  draftsButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
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
  carouselContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
