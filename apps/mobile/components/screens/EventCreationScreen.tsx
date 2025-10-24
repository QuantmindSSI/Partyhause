import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requireSupabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventCreationScreenProps {
  userId: string;
  onBack: () => void;
  onEventCreated?: () => void;
}

export const EventCreationScreen = ({ userId, onBack, onEventCreated }: EventCreationScreenProps) => {
  const queryClient = useQueryClient();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: {
      name: string;
      description?: string;
      location?: string;
      venue?: string;
      event_date: string;
      is_public: boolean;
      spotify_playlist_url?: string;
    }) => {
      console.log('[EventCreation] Creating event:', eventData);
      const client = requireSupabase();
      
      const { data, error } = await client
        .from('events')
        .insert({
          host_id: userId,
          name: eventData.name,
          description: eventData.description,
          location: eventData.location,
          venue: eventData.venue,
          event_date: eventData.event_date,
          event_type: 'single_day',
          start_date: eventData.event_date,
          end_date: eventData.event_date,
          is_public: eventData.is_public,
          spotify_playlist_url: eventData.spotify_playlist_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('[EventCreation] Event created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['user-events', userId] });
      
      Alert.alert(
        'Success! 🎉',
        `Event "${data.name}" has been created!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onEventCreated?.();
              onBack();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('[EventCreation] Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.'
      );
    },
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDate = new Date(eventDate);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setEventDate(newDate);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter an event name.');
      return;
    }

    if (!location.trim() && !venue.trim()) {
      Alert.alert('Required Field', 'Please enter a location or venue.');
      return;
    }

    // Create event
    createEventMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      venue: venue.trim() || undefined,
      event_date: eventDate.toISOString(),
      is_public: isPublic,
      spotify_playlist_url: spotifyUrl.trim() || undefined,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Form */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Birthday Party, Wedding, etc."
            placeholderTextColor="#666"
            maxLength={100}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { flex: 1, marginRight: 8 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>📅 {formatDate(eventDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateTimeButton, { flex: 1 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>🕐 {formatTime(eventDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State or Full Address"
            placeholderTextColor="#666"
            maxLength={200}
          />
        </View>

        {/* Venue */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Venue (Optional)</Text>
          <TextInput
            style={styles.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="Club, Restaurant, Park, etc."
            placeholderTextColor="#666"
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell guests what to expect..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Spotify Playlist */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Spotify Playlist (Optional)</Text>
          <TextInput
            style={styles.input}
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
            placeholder="https://open.spotify.com/playlist/..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Public Event Toggle */}
        <View style={styles.formGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.label}>Public Event</Text>
              <Text style={styles.toggleDescription}>
                {isPublic ? 'Anyone can discover this event' : 'Invite-only event'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#3e3e42', true: '#6C63FF' }}
              thumbColor={isPublic ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, createEventMutation.isPending && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={createEventMutation.isPending}
        >
          {createEventMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>✨ Create Event</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1f',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#2a2a2f',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#2a2a2f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#2a2a2f',
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
