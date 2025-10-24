import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Get API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [isPublishing, setIsPublishing] = useState(false);

  // Debug logging
  console.log('[Review] All params:', Object.keys(params));
  console.log('[Review] templateSettings type:', typeof params.templateSettings);
  console.log('[Review] templateSettings raw:', params.templateSettings);

  // Parse data from params
  const templateType = params.template as string;
  const title = params.title as string;
  const description = params.description as string;
  const startDate = params.startDate as string;
  const endDate = params.endDate as string;
  const location = params.location as string;
  const guestCount = params.guestCount as string || '0';
  const timelineCount = params.timelineCount as string || '0';
  const isDraft = params.isDraft === 'true';
  const draftId = params.draftId as string;
  
  // Parse template settings with comprehensive error handling
  let templateSettings = {};
  try {
    if (params.templateSettings) {
      const settingsParam = params.templateSettings;
      console.log('[Review] Template settings type:', typeof settingsParam);
      console.log('[Review] Template settings first 100 chars:', 
        String(settingsParam).substring(0, 100));
      
      // Check if it's already an object
      if (typeof settingsParam === 'object' && settingsParam !== null) {
        templateSettings = settingsParam;
        console.log('[Review] Using object directly');
      } else if (typeof settingsParam === 'string') {
        // Only parse if it's a valid JSON string
        const trimmed = settingsParam.trim();
        if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
          console.log('[Review] Empty or null settings, using empty object');
          templateSettings = {};
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            templateSettings = JSON.parse(trimmed);
            console.log('[Review] Successfully parsed JSON');
          } catch (parseError) {
            console.error('[Review] JSON parse error:', parseError);
            console.error('[Review] Failed string:', trimmed.substring(0, 200));
            // Use empty object on parse failure
            templateSettings = {};
          }
        } else {
          console.warn('[Review] Not valid JSON format, first char:', trimmed[0]);
          console.warn('[Review] String preview:', trimmed.substring(0, 100));
          templateSettings = {};
        }
      } else {
        console.warn('[Review] Unexpected type for templateSettings:', typeof settingsParam);
        templateSettings = {};
      }
    }
  } catch (error) {
    console.error('[Review] Failed to process template settings:', error);
    console.error('[Review] Raw value type:', typeof params.templateSettings);
    console.error('[Review] Raw value:', params.templateSettings);
    // Continue with empty settings rather than failing
    templateSettings = {};
  }
  
  console.log('[Review] Final templateSettings:', templateSettings);

  const handlePublish = async () => {
    console.log('[Review] ========== PUBLISH STARTED ==========');
    try {
      setIsPublishing(true);

      // Get auth token from Supabase
      console.log('[Review] Step 1: Getting auth session');
      if (!supabase) {
        Alert.alert('Error', 'Supabase client not initialized');
        setIsPublishing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        Alert.alert('Error', 'Please sign in to create events');
        setIsPublishing(false);
        return;
      }

      console.log('[Review] Step 2: Preparing event data');
      // Prepare event data
      const eventData: any = {
        template_type: templateType,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        privacy: 'private',
        status: 'published',
        settings: templateSettings, // Template-specific settings stored in settings JSONB field
      };

      // Format location properly - API expects object or null
      if (location && location.trim()) {
        eventData.location = {
          name: location,
          address: location,
        };
      }

      console.log('[Review] Step 3: Event data prepared:', {
        template_type: eventData.template_type,
        title: eventData.title,
        has_location: !!eventData.location,
        has_settings: !!eventData.settings,
        settings_keys: Object.keys(eventData.settings || {}),
      });

      // Create event
      console.log('[Review] Step 4: Sending create event request to:', `${API_URL}/api/events`);
      const eventResponse = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      console.log('[Review] Step 5: Event API response status:', eventResponse.status);

      if (!eventResponse.ok) {
        const errorText = await eventResponse.text();
        console.error('[Review] Event creation failed:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || 'Failed to create event');
      }

      const eventResult = await eventResponse.json();
      const eventId = eventResult.id || eventResult.event?.id || eventResult.data?.id;

      console.log('[Review] Step 6: Event created with ID:', eventId);

      if (!eventId) {
        throw new Error('Event created but no ID returned');
      }

      // Import guests if any
      if (params.guests) {
        try {
          let guests = [];
          const guestsParam = params.guests;
          
          // Safe JSON parsing
          if (typeof guestsParam === 'object' && Array.isArray(guestsParam)) {
            guests = guestsParam;
          } else if (typeof guestsParam === 'string') {
            const trimmed = guestsParam.trim();
            if (trimmed && trimmed.startsWith('[')) {
              guests = JSON.parse(trimmed);
            }
          }
          
          if (guests.length > 0) {
            // Prepare guest data with event context for invitations
            const guestPayload = {
              eventId: eventId,
              guests: guests.map((guest: any) => ({
                name: guest.name,
                email: guest.email,
                phone: guest.phone || null,
                plus_ones: guest.plus_ones || 0,
              })),
              // Pass event details for invitation emails
              eventDetails: {
                title,
                template_type: templateType,
                start_date: startDate,
                end_date: endDate,
                location: location,
                settings: templateSettings, // Template-specific data for personalized invitations
              },
              sendInvitations: true, // Trigger invitation emails
            };

            const guestsResponse = await fetch(`${API_URL}/api/guests`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(guestPayload),
            });

            if (!guestsResponse.ok) {
              console.error('[Review] Failed to import guests');
            }
          }
        } catch (error) {
          console.error('[Review] Failed to import guests:', error);
        }
      }

      // Create timeline if any
      if (params.timeline) {
        try {
          let timeline = [];
          const timelineParam = params.timeline;
          
          // Safe JSON parsing
          if (typeof timelineParam === 'object' && Array.isArray(timelineParam)) {
            timeline = timelineParam;
          } else if (typeof timelineParam === 'string') {
            const trimmed = timelineParam.trim();
            if (trimmed && trimmed.startsWith('[')) {
              timeline = JSON.parse(trimmed);
            }
          }
          
          if (timeline.length > 0) {
            await fetch(`${API_URL}/api/timeline`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                event_id: eventId,
                blocks: timeline,
              }),
            });
          }
        } catch (error) {
          console.error('[Review] Failed to create timeline:', error);
        }
      }

      setIsPublishing(false);
      
      // If this was a draft, delete it from AsyncStorage
      if (isDraft && draftId) {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const draftsJson = await AsyncStorage.getItem('event_drafts');
          if (draftsJson) {
            const drafts = JSON.parse(draftsJson);
            const updatedDrafts = drafts.filter((d: any) => d.id !== draftId);
            await AsyncStorage.setItem('event_drafts', JSON.stringify(updatedDrafts));
          }
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
      }
      
      Alert.alert(
        'Success!',
        'Your event has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error: any) {
      setIsPublishing(false);
      console.error('[Review] ========== PUBLISH FAILED ==========');
      console.error('[Review] Error type:', error.constructor.name);
      console.error('[Review] Error message:', error.message);
      console.error('[Review] Error stack:', error.stack);
      
      const errorMessage = error.message || 'Failed to create event. Please try again.';
      Alert.alert(
        'Error', 
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => console.log('[Review] User dismissed error alert'),
          },
        ]
      );
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsPublishing(true);

      // Save to AsyncStorage as draft
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      const draftData = {
        id: Date.now().toString(), // Unique draft ID
        templateType,
        title,
        description,
        startDate,
        endDate,
        location,
        templateSettings,
        guests: params.guests,
        timeline: params.timeline,
        guestCount,
        timelineCount,
        savedAt: new Date().toISOString(),
      };

      // Get existing drafts
      const draftsJson = await AsyncStorage.getItem('event_drafts');
      const drafts = draftsJson ? JSON.parse(draftsJson) : [];
      
      // Add new draft
      drafts.push(draftData);
      
      // Save back to storage
      await AsyncStorage.setItem('event_drafts', JSON.stringify(drafts));

      setIsPublishing(false);
      
      Alert.alert(
        'Draft Saved!',
        'Your event has been saved as a draft. You can continue editing it later.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      setIsPublishing(false);
      console.error('Failed to save draft:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Review & Publish</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
      </View>
      <Text style={styles.stepText}>Step 5 of 5</Text>

      {/* Event Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        
        <View style={styles.summaryRow}>
          <Ionicons name="calendar" size={20} color="#6366F1" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Template</Text>
            <Text style={styles.summaryValue}>{templateType}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Ionicons name="text" size={20} color="#6366F1" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Title</Text>
            <Text style={styles.summaryValue}>{title}</Text>
          </View>
        </View>

        {description ? (
          <View style={styles.summaryRow}>
            <Ionicons name="document-text" size={20} color="#6366F1" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Description</Text>
              <Text style={styles.summaryValue}>{description}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <Ionicons name="time" size={20} color="#6366F1" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {startDate} - {endDate}
            </Text>
          </View>
        </View>

        {location ? (
          <View style={styles.summaryRow}>
            <Ionicons name="location" size={20} color="#6366F1" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>{location}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Guest Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Guests</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="pencil" size={18} color="#6366F1" />
          </TouchableOpacity>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#6366F1" />
          <Text style={styles.statValue}>{guestCount}</Text>
          <Text style={styles.statLabel}>guests invited</Text>
        </View>
      </View>

      {/* Timeline Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="pencil" size={18} color="#6366F1" />
          </TouchableOpacity>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="list" size={24} color="#6366F1" />
          <Text style={styles.statValue}>{timelineCount}</Text>
          <Text style={styles.statLabel}>blocks scheduled</Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#6366F1" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Ready to publish?</Text>
          <Text style={styles.infoText}>
            Once published, your guests will receive invitations and can RSVP. You can
            always edit event details later.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={handleSaveDraft}
          disabled={isPublishing}
        >
          <Ionicons name="save-outline" size={20} color="#6366F1" />
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#FFF" />
              <Text style={styles.publishButtonText}>Publish Event</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },
  stepText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  statCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 8,
    gap: 8,
  },
  draftButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  publishButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
