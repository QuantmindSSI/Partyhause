import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

interface NetworkEvent {
  id: string;
  name: string;
  title: string;
  description: string;
  venue: string;
  location: string;
  event_date: string;
  start_date: string;
  template_type: string;
  visibility: string;
  host_id: string;
  users?: {
    name: string;
    email: string;
  };
}

export default function ExploreScreen() {
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchNetworkEvents();
    } else {
      setEventsLoading(false);
    }
  }, [isAuthenticated, userId]);

  const checkAuthStatus = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      setUserId(session?.user?.id || null);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchNetworkEvents = async () => {
    setEventsLoading(true);
    try {
      if (!supabase || !userId) return;

      // For now, fetch public and network events
      // TODO: When user_connections table is implemented, filter by crew connections instead of all public/network events
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          title,
          description,
          venue,
          location,
          event_date,
          start_date,
          template_type,
          visibility,
          host_id,
          users (
            name,
            email
          )
        `)
        .in('visibility', ['public', 'network'])
        .neq('host_id', userId) // Don't show user's own events
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error fetching network events:', error);
      } else {
        setNetworkEvents(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateFromScratch = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to create events',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(tabs)') }
        ]
      );
      return;
    }
    router.push('/events/create');
  };

  return (
    <View style={styles.container}>
      {/* Header with Plus Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>
            {isAuthenticated 
              ? 'Discover events from your crew' 
              : 'Sign in to see events from your network'}
          </Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity 
            style={styles.plusButton}
            onPress={handleCreateFromScratch}
            activeOpacity={0.7}
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isAuthenticated && (
          <ThemedView style={styles.section}>
            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptIcon}>🎉</Text>
              <Text style={styles.signInPromptTitle}>
                Join the Party!
              </Text>
              <Text style={styles.signInPromptText}>
                Sign in to discover amazing events from your crew and start creating your own unforgettable experiences
              </Text>
              <TouchableOpacity 
                style={styles.signInButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.signInButtonText}>Sign In to Explore</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

      {isAuthenticated && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Events from Your Network</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Discover events from your crew and public events
          </ThemedText>
          
          {eventsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : networkEvents.length > 0 ? (
            <View style={styles.eventsGrid}>
              {networkEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/events/${event.id}` as any)}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName}>
                      {event.name || event.title || 'Untitled Event'}
                    </Text>
                    <View style={[
                      styles.visibilityBadge,
                      event.visibility === 'public' ? styles.publicBadge : styles.networkBadge
                    ]}>
                      <Text style={styles.visibilityText}>
                        {event.visibility === 'public' ? '🌍 Public' : '👥 Network'}
                      </Text>
                    </View>
                  </View>
                  
                  {event.users && (
                    <Text style={styles.hostName}>
                      Hosted by {event.users.name || event.users.email}
                    </Text>
                  )}
                  
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description || 'No description'}
                  </Text>
                  
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventDate}>
                      📅 {new Date(event.event_date || event.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                    {event.venue && (
                      <Text style={styles.eventVenue} numberOfLines={1}>
                        📍 {event.venue}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎉</Text>
              <Text style={styles.emptyStateText}>
                No network events yet. Start connecting with other users to see their events!
              </Text>
            </View>
          )}
        </ThemedView>
      )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: Fonts.rounded,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  plusIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  signInPrompt: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signInPromptIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  signInPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  signInPromptText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  eventsGrid: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  visibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publicBadge: {
    backgroundColor: '#DBEAFE',
  },
  networkBadge: {
    backgroundColor: '#E0E7FF',
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  hostName: {
    fontSize: 13,
    color: '#6366F1',
    marginBottom: 8,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  eventDate: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  eventVenue: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    marginLeft: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
