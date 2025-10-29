import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event, getEventLocation } from '@/types/event';
import { Guest } from '@/types/guest';

interface EventDetailsScreenProps {
  event: Event;
  onBack: () => void;
  onViewGuests: () => void;
}

export const EventDetailsScreen = ({ event, onBack, onViewGuests }: EventDetailsScreenProps) => {
  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<Guest[]>({
    queryKey: ['event-guests', event.id],
    queryFn: async () => {
      console.log('[EventDetails] Fetching guests for event:', event.id);
      if (!supabase) {
        console.log('[EventDetails] No supabase client');
        return [];
      }
      
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EventDetails] Error fetching guests:', error);
        throw error;
      }

      console.log('[EventDetails] Fetched', data?.length || 0, 'guests');
      return data || [];
    },
    enabled: !!event.id && !!supabase,
  });

  const checkedInCount = guests.filter(g => g.is_checked_in).length;
  const totalGuests = guests.length;
  const checkInPercentage = totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Event Hero */}
        <View style={styles.heroSection}>
          <View style={styles.eventIcon}>
            <Text style={styles.eventIconText}>🎉</Text>
          </View>
          <Text style={styles.eventName}>{event.name || event.title}</Text>
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
        </View>

        {/* Event Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📅</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{formatDate(event.event_date || event.date || event.start_date || '')}</Text>
              <Text style={styles.infoSubValue}>{formatTime(event.event_date || event.date || event.start_date || '')}</Text>
            </View>
          </View>

          {(event.location || event.venue) && (
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{getEventLocation(event)}</Text>
              </View>
            </View>
          )}

          {event.spotify_playlist_url && (
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🎵</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Playlist</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {event.spotify_playlist_url}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Guest Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Guest Overview</Text>
          
          {isLoadingGuests ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#6C63FF" />
              <Text style={styles.loadingText}>Loading guest data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalGuests}</Text>
                  <Text style={styles.statLabel}>Total Guests</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, styles.statValueSuccess]}>{checkedInCount}</Text>
                  <Text style={styles.statLabel}>Checked In</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, styles.statValueWarning]}>
                    {totalGuests - checkedInCount}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Check-in Progress</Text>
                  <Text style={styles.progressPercentage}>{checkInPercentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${checkInPercentage}%` }]} />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={onViewGuests}>
            <Text style={styles.primaryButtonIcon}>👥</Text>
            <Text style={styles.primaryButtonText}>Manage Guests</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Share Event</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  eventIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eventIconText: {
    fontSize: 40,
  },
  eventName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 15,
    color: '#a8a8b3',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a8b3',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#6C63FF',
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a24',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#a8a8b3',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  statValue: {
    fontSize: 28,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a8b3',
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C63FF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a3a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
});
