import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import type { MvpEvent } from '@partyhause/core/mvp';

import { api } from '@/lib/client';

interface DashboardScreenProps {
  userId: string;
  userEmail: string;
}

function eventDate(event: MvpEvent): string {
  const date = new Date(event.start);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  try {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timezone || 'UTC',
    });
  } catch {
    return date.toISOString();
  }
}

function EventRow({ event }: { event: MvpEvent }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.eventCard}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.eventCopy}>
        <View style={styles.eventMetaRow}>
          <Text style={styles.eventDate}>{eventDate(event)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#6A5E58" />
          <Text numberOfLines={1} style={styles.locationText}>
            {event.location || 'Location not set'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#847771" />
    </TouchableOpacity>
  );
}

export function DashboardScreen({ userId, userEmail }: DashboardScreenProps) {
  const eventsQuery = useQuery({
    queryKey: ['user-events', userId],
    queryFn: async () => {
      const result = await api.events.list();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>YOUR EVENTS</Text>
          <Text style={styles.heading}>Make the next gathering easy.</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open account"
          style={styles.accountButton}
          onPress={() => router.push('/account' as Href)}
        >
          <Ionicons name="person-circle-outline" size={30} color="#FFA694" />
        </TouchableOpacity>
      </View>

      {eventsQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C02A16" />
          <Text style={styles.supportingText}>Loading events...</Text>
        </View>
      ) : eventsQuery.isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={42} color="#E12D33" />
          <Text style={styles.emptyTitle}>Events could not be loaded</Text>
          <Text style={styles.supportingText}>{eventsQuery.error.message}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => { void eventsQuery.refetch(); }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={eventsQuery.data}
          keyExtractor={(event) => event.id}
          renderItem={({ item }) => <EventRow event={item} />}
          contentContainerStyle={eventsQuery.data?.length ? styles.list : styles.emptyList}
          refreshing={eventsQuery.isRefetching}
          onRefresh={() => { void eventsQuery.refetch(); }}
          ListEmptyComponent={(
            <View style={styles.centered}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={36} color="#C02A16" />
              </View>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.supportingText}>Save your first event draft to get started.</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create event"
        style={styles.createButton}
        onPress={() => router.push('/events/create')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF9',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 62,
    paddingBottom: 22,
    backgroundColor: '#181311',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCopy: {
    paddingRight: 76,
  },
  kicker: {
    color: '#FF7D66',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heading: {
    color: '#FBFAF9',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 9,
  },
  email: {
    color: '#ABA09B',
    fontSize: 13,
    marginTop: 9,
  },
  accountButton: {
    position: 'absolute',
    top: 58,
    right: 18,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  list: {
    padding: 18,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  eventCard: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE7E5',
  },
  eventCopy: {
    flex: 1,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventDate: {
    color: '#972317',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#F6F4F3',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    color: '#514743',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  eventTitle: {
    color: '#26201D',
    fontSize: 19,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  locationText: {
    flex: 1,
    color: '#6A5E58',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF2F0',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#26201D',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  supportingText: {
    maxWidth: 300,
    color: '#6A5E58',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7,
  },
  retryButton: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#C02A16',
    paddingHorizontal: 22,
    marginTop: 18,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  createButton: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#C02A16',
    shadowColor: '#46110B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
});
