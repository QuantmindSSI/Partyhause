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
import type { TimelineBlock } from '@partyhause/core';
import { api } from '@/lib/client';

/**
 * Turn the wizard's "HH:MM" onto the event's day as an absolute instant.
 *
 * `POST /api/timeline` stores a DateTime, so it passes whatever arrives to
 * `new Date()`. A bare "18:30" is not a date and would become Invalid Date;
 * sending an instant removes the ambiguity rather than relying on the server's
 * locale.
 *
 * @param clock "HH:MM" from the timeline step, possibly malformed.
 * @param day The event's start date as an ISO or date string.
 * @returns An ISO-8601 timestamp.
 */
function toIsoStart(clock: string, day: string): string {
  const base = new Date(day);
  const anchor = Number.isNaN(base.getTime()) ? new Date() : base;

  const [hours, minutes] = clock.split(':').map(Number);
  if (Number.isInteger(hours) && Number.isInteger(minutes)) {
    anchor.setHours(hours, minutes, 0, 0);
  }
  return anchor.toISOString();
}

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

      if (!(await api.auth.isAuthenticated())) {
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
      const { data: createdEvent, error: createError } = await api.events.create(eventData);

      if (createError) {
        throw new Error(createError.message || 'Failed to create event');
      }

      const eventId = createdEvent?.id;
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
            // The route reads camelCase per guest. This previously sent
            // `plus_ones`, which is not a key it looks at, so every imported
            // guest was created with plus_ones 0.
            //
            // It also sent `eventDetails` and `sendInvitations: true`. The
            // route destructures only `{ eventId, guests }` and ignores both,
            // so no invitation email was ever triggered here despite the flag.
            // Guests are created; inviting them is a separate step.
            const { error: guestsError } = await api.guests.createMany(
              eventId,
              guests.map((guest: { name: string; email?: string; phone?: string; plus_ones?: number }) => ({
                name: guest.name,
                email: guest.email,
                phone: guest.phone,
                plusOnes: guest.plus_ones ?? 0,
              })),
            );

            if (guestsError) {
              console.error('[Review] Failed to import guests:', guestsError.message);
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
            // Written to /api/timeline, not onto the event's JSON column.
            //
            // History, because this has now been wrong twice. It originally
            // sent `{ event_id, blocks: [...] }` to POST /api/timeline, which
            // creates ONE block and validates different field names, so it
            // 400'd every time and the schedule was lost inside the catch
            // below. The fix at the time was to write the JSON column instead,
            // on the grounds that the relational table was the one nothing
            // read.
            //
            // That is no longer true, and the JSON column is the wrong target:
            // `serialiseEvent` withholds it from every client including the
            // host, deliberately, because it cannot express `guest_visible` or
            // `host_notes`. So a schedule written there is invisible to the
            // activities screen, which is the only screen that shows it. The
            // relational table is the representation that carries visibility,
            // and the route filters on it per viewer.
            //
            // One request per block, because the route creates one block per
            // call. The loop is bounded by the wizard's own list, which is
            // built by hand a block at a time.
            const failures: string[] = [];
            for (const block of timeline as Array<Record<string, unknown>>) {
              const { error: blockError } = await api.timeline.create({
                event_id: eventId,
                label: String(block.label ?? ''),
                start_time: toIsoStart(String(block.start_time ?? ''), startDate),
                duration: Number(block.duration ?? 0),
                type: block.type as TimelineBlock['type'],
                guest_visible: true,
              });
              if (blockError) failures.push(`${String(block.label)}: ${blockError.message}`);
            }

            if (failures.length > 0) {
              // Reported, not swallowed. The event itself was created, so this
              // is a partial success and the host needs to know which part.
              console.error('[Review] Timeline blocks rejected:', failures.join('; '));
              Alert.alert(
                'Event created, schedule incomplete',
                `${failures.length} of ${timeline.length} activities could not be saved. You can add them from the event's Activities screen.`,
              );
            }
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
