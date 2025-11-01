import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Event, getEventLocation } from '@/types/event';

interface EventStats {
  total_guests: number;
  guests_accepted: number;
  guests_declined: number;
  guests_pending: number;
  guests_checked_in: number;
  timeline_blocks: number;
  media_count: number;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats>({
    total_guests: 0,
    guests_accepted: 0,
    guests_declined: 0,
    guests_pending: 0,
    guests_checked_in: 0,
    timeline_blocks: 0,
    media_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      // Validate id parameter
      if (!id) {
        console.error('[Event Details] Event ID is missing');
        Alert.alert('Error', 'Event ID is missing');
        setLoading(false);
        return;
      }

      console.log('[Event Details] Fetching event:', id);

      // Get auth token from Supabase session
      if (!supabase) {
        console.error('[Event Details] Supabase client not initialized');
        Alert.alert('Configuration Error', 'Supabase client not initialized');
        setLoading(false);
        return;
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Event Details] Session error:', sessionError);
      }
      
      const token = session?.access_token;
      
      if (!token) {
        console.error('[Event Details] No auth token found');
        Alert.alert(
          'Authentication Required', 
          'Please sign in to view event details',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/') }
          ]
        );
        setLoading(false);
        return;
      }

      console.log('[Event Details] Making API request to:', `${API_BASE_URL}/api/events?id=${id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/events?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Event Details] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Event Details] API error:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            'Unauthorized', 
            'You do not have permission to view this event',
            [
              { text: 'OK', onPress: () => router.back() }
            ]
          );
        } else if (response.status === 404) {
          Alert.alert(
            'Event Not Found',
            'This event does not exist or has been deleted',
            [
              { text: 'OK', onPress: () => router.back() }
            ]
          );
        } else {
          Alert.alert(
            'Error',
            `Failed to load event details (${response.status}). Please try again.`
          );
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('[Event Details] Event loaded successfully:', data.event?.name || data.event?.title);
      
      setEvent(data.event);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('[Event Details] Exception:', error);
      Alert.alert(
        'Error', 
        'Failed to load event details. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => fetchEventDetails() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return '#10b981';
      case 'draft':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getTemplateIcon = (template: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      birthday: 'gift',
      'kids-birthday': 'balloon',
      wedding: 'heart',
      'product-launch': 'rocket',
      fundraiser: 'cash',
      festival: 'musical-notes',
      conference: 'business',
      travel: 'airplane',
      'block-party': 'home',
      class: 'school',
      hackathon: 'code-slash',
      corporate: 'briefcase',
    };
    return iconMap[template] || 'calendar';
  };

  const renderBirthdayDetails = (settings: Record<string, any>) => {
    if (!settings) return null;

    return (
      <View style={styles.templateDetailsSection}>
        <Text style={styles.sectionTitle}>🎂 Birthday Party Details</Text>
        
        {/* Birthday Child Info */}
        {settings.birthday_person && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Birthday Child</Text>
            <Text style={styles.detailCardValue}>
              {settings.birthday_person}
              {settings.age && ` (turning ${settings.age})`}
            </Text>
            {settings.milestone && (
              <Text style={styles.detailCardSubtext}>{settings.milestone}</Text>
            )}
          </View>
        )}

        {/* Guest Info */}
        {(settings.expected_guest_count || settings.age_range) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Guest Information</Text>
            {settings.expected_guest_count && (
              <Text style={styles.detailCardValue}>
                Expected: {settings.expected_guest_count} guests
              </Text>
            )}
            {settings.age_range && (
              <Text style={styles.detailCardSubtext}>Ages: {settings.age_range}</Text>
            )}
          </View>
        )}

        {/* Venue & Theme */}
        {(settings.venue_type || settings.theme) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Venue & Theme</Text>
            {settings.venue_type && (
              <Text style={styles.detailCardValue}>📍 {settings.venue_type}</Text>
            )}
            {settings.theme && (
              <Text style={styles.detailCardValue}>🎨 Theme: {settings.theme}</Text>
            )}
            {settings.dress_code && (
              <Text style={styles.detailCardSubtext}>Dress Code: {settings.dress_code}</Text>
            )}
            {settings.venue_package && (
              <Text style={styles.detailCardSubtext}>Package: {settings.venue_package}</Text>
            )}
          </View>
        )}

        {/* Activities */}
        {(settings.selected_activities?.length > 0 || settings.custom_activities) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🎉 Activities & Entertainment</Text>
            {settings.selected_activities?.length > 0 && (
              <View style={styles.chipContainer}>
                {settings.selected_activities.map((activity: string, index: number) => (
                  <View key={index} style={styles.activityChip}>
                    <Text style={styles.activityChipText}>{activity}</Text>
                  </View>
                ))}
              </View>
            )}
            {settings.custom_activities && (
              <Text style={styles.detailCardSubtext}>{settings.custom_activities}</Text>
            )}
            {settings.entertainment_notes && (
              <Text style={styles.detailCardSubtext}>📝 {settings.entertainment_notes}</Text>
            )}
          </View>
        )}

        {/* Food & Cake */}
        {(settings.food_menu || settings.cake_details) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🍰 Food & Cake</Text>
            {settings.food_menu && (
              <Text style={styles.detailCardValue}>Menu: {settings.food_menu}</Text>
            )}
            {settings.cake_details && (
              <Text style={styles.detailCardValue}>Cake: {settings.cake_details}</Text>
            )}
            {settings.allergy_notes && (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.alertText}>Allergies: {settings.allergy_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Gift Preferences */}
        {settings.gift_preference && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🎁 Gift Preferences</Text>
            {settings.gift_preference === 'registry' && settings.registry_links?.length > 0 && (
              <>
                <Text style={styles.detailCardValue}>Gift Registry:</Text>
                {settings.registry_links.map((link: string, index: number) => (
                  <Text key={index} style={styles.linkText} numberOfLines={1}>
                    {link}
                  </Text>
                ))}
              </>
            )}
            {settings.gift_preference === 'no-gifts' && (
              <Text style={styles.detailCardValue}>No gifts please 💝</Text>
            )}
            {settings.gift_preference === 'donation' && settings.donation_info && (
              <Text style={styles.detailCardValue}>Donate to: {settings.donation_info}</Text>
            )}
            {settings.gift_preference === 'wishes' && settings.gift_wishes && (
              <Text style={styles.detailCardValue}>{settings.gift_wishes}</Text>
            )}
          </View>
        )}

        {/* Parent Logistics */}
        {(settings.parent_stay_required || settings.supervision_ratio || settings.pickup_time) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>👨‍👩‍👧 Parent Information</Text>
            {settings.parent_stay_required && (
              <View style={styles.alertBox}>
                <Ionicons name="people" size={16} color="#9333ea" />
                <Text style={styles.alertText}>Parents must stay</Text>
              </View>
            )}
            {settings.supervision_ratio && (
              <Text style={styles.detailCardValue}>Supervision: {settings.supervision_ratio}</Text>
            )}
            {settings.pickup_time && (
              <Text style={styles.detailCardValue}>Pickup Time: {settings.pickup_time}</Text>
            )}
          </View>
        )}

        {/* Safety & Requirements */}
        {(settings.safety_requirements || settings.what_to_bring || settings.equipment_provided) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>⚠️ Safety & Requirements</Text>
            {settings.safety_requirements && (
              <Text style={styles.detailCardValue}>Safety: {settings.safety_requirements}</Text>
            )}
            {settings.what_to_bring && (
              <View style={styles.alertBox}>
                <Ionicons name="bag-handle" size={16} color="#10b981" />
                <Text style={styles.alertText}>Bring: {settings.what_to_bring}</Text>
              </View>
            )}
            {settings.equipment_provided && (
              <Text style={styles.detailCardSubtext}>Provided: {settings.equipment_provided}</Text>
            )}
            {settings.venue_rules && (
              <Text style={styles.detailCardSubtext}>Venue Rules: {settings.venue_rules}</Text>
            )}
          </View>
        )}

        {/* Photography */}
        {settings.photography_arrangement && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>📸 Photography</Text>
            <Text style={styles.detailCardValue}>
              {settings.photography_arrangement === 'professional' && 'Professional Photographer'}
              {settings.photography_arrangement === 'parent-volunteers' && 'Parent Volunteers'}
              {settings.photography_arrangement === 'none' && 'No Photos'}
            </Text>
            {settings.photographer_details && (
              <Text style={styles.detailCardSubtext}>{settings.photographer_details}</Text>
            )}
          </View>
        )}

        {/* Weather Backup */}
        {settings.backup_plan && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>☔ Weather Backup Plan</Text>
            <Text style={styles.detailCardValue}>{settings.backup_plan}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAdultBirthdayDetails = (settings: Record<string, any>) => {
    if (!settings) return null;

    return (
      <View style={styles.templateDetailsSection}>
        <Text style={styles.sectionTitle}>🎂 Birthday Celebration Details</Text>
        
        {/* Birthday Celebrant Info */}
        {settings.birthday_person && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Birthday Celebrant</Text>
            <Text style={styles.detailCardValue}>
              {settings.birthday_person}
              {settings.age && ` (turning ${settings.age})`}
            </Text>
            {settings.milestone && (
              <Text style={styles.detailCardSubtext}>{settings.milestone}</Text>
            )}
          </View>
        )}

        {/* Guest Info */}
        {settings.expected_guest_count && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Guest Information</Text>
            <Text style={styles.detailCardValue}>
              Expected: {settings.expected_guest_count} guests
            </Text>
          </View>
        )}

        {/* Venue & Theme */}
        {(settings.venue_type || settings.theme) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Venue & Theme</Text>
            {settings.venue_type && (
              <Text style={styles.detailCardValue}>📍 {settings.venue_type}</Text>
            )}
            {settings.theme && (
              <Text style={styles.detailCardValue}>🎨 Theme: {settings.theme}</Text>
            )}
            {settings.dress_code && (
              <Text style={styles.detailCardSubtext}>Dress Code: {settings.dress_code}</Text>
            )}
          </View>
        )}

        {/* Food & Drinks */}
        {(settings.catering_style || settings.bar_service || settings.menu_notes) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🍽️ Food & Drinks</Text>
            {settings.catering_style && (
              <Text style={styles.detailCardValue}>Catering: {settings.catering_style}</Text>
            )}
            {settings.bar_service && (
              <Text style={styles.detailCardValue}>🍸 Bar: {settings.bar_service}</Text>
            )}
            {settings.signature_cocktail && (
              <Text style={styles.detailCardSubtext}>Signature: {settings.signature_cocktail}</Text>
            )}
            {settings.menu_notes && (
              <Text style={styles.detailCardSubtext}>{settings.menu_notes}</Text>
            )}
            {settings.allergy_notes && (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.alertText}>Allergies: {settings.allergy_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Entertainment */}
        {(settings.entertainment_type || settings.entertainment_details) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🎵 Entertainment</Text>
            {settings.entertainment_type && (
              <Text style={styles.detailCardValue}>
                {settings.entertainment_type === 'dj' && '🎧 DJ'}
                {settings.entertainment_type === 'band' && '🎸 Live Band'}
                {settings.entertainment_type === 'karaoke' && '🎤 Karaoke'}
                {settings.entertainment_type === 'comedy' && '🎭 Comedy Show'}
                {settings.entertainment_type === 'none' && 'No Entertainment'}
              </Text>
            )}
            {settings.entertainment_details && (
              <Text style={styles.detailCardSubtext}>{settings.entertainment_details}</Text>
            )}
          </View>
        )}

        {/* Gift Preferences */}
        {settings.gift_preference && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>🎁 Gift Preferences</Text>
            {settings.gift_preference === 'registry' && settings.registry_links?.length > 0 && (
              <>
                <Text style={styles.detailCardValue}>Gift Registry:</Text>
                {settings.registry_links.map((link: string, index: number) => (
                  <Text key={index} style={styles.linkText} numberOfLines={1}>
                    {link}
                  </Text>
                ))}
              </>
            )}
            {settings.gift_preference === 'no-gifts' && (
              <Text style={styles.detailCardValue}>No gifts please 💝</Text>
            )}
            {settings.gift_preference === 'donation' && settings.donation_info && (
              <Text style={styles.detailCardValue}>Donate to: {settings.donation_info}</Text>
            )}
            {settings.gift_preference === 'wishes' && settings.gift_wishes && (
              <Text style={styles.detailCardValue}>{settings.gift_wishes}</Text>
            )}
          </View>
        )}

        {/* Special Features */}
        {(settings.photo_booth || settings.toasts_speeches) && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>✨ Special Features</Text>
            {settings.photo_booth && (
              <Text style={styles.detailCardValue}>📸 Photo Booth Included</Text>
            )}
            {settings.booth_details && (
              <Text style={styles.detailCardSubtext}>{settings.booth_details}</Text>
            )}
            {settings.toasts_speeches && (
              <Text style={styles.detailCardValue}>🥂 Toasts & Speeches Scheduled</Text>
            )}
            {settings.toast_schedule && (
              <Text style={styles.detailCardSubtext}>{settings.toast_schedule}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTemplateDetails = () => {
    if (!event?.settings) return null;

    switch (event.template_type) {
      case 'birthday':
        return renderAdultBirthdayDetails(event.settings);
      case 'kids-birthday':
        return renderBirthdayDetails(event.settings);
      // Add other template types here as they're implemented
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Event Details' }} />
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Event Not Found' }} />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: event.title,
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* TODO: Edit event */}}>
              <Ionicons name="create-outline" size={24} color="#9333ea" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Event Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.templateBadge}>
              <Ionicons
                name={getTemplateIcon(event.template_type)}
                size={20}
                color="#9333ea"
              />
              <Text style={styles.templateText}>
                {event.template_type?.replace('-', ' ')?.toUpperCase() || 'EVENT'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
              <Text style={styles.statusText}>{event.status?.toUpperCase() || 'UNKNOWN'}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(event.start_date || event.date || event.event_date || '').toLocaleString()}
                </Text>
              </View>
            </View>
            {event.end_date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>End Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(event.end_date).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            {event.location && (
              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color="#6b7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{getEventLocation(event)}</Text>
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="lock-closed" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Privacy</Text>
                <Text style={styles.detailValue}>
                  {event.privacy ? event.privacy.charAt(0).toUpperCase() + event.privacy.slice(1) : 'Private'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Event Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.total_guests}</Text>
              <Text style={styles.statLabel}>Total Guests</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>
                {stats.guests_accepted}
              </Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#6b7280' }]}>
                {stats.guests_pending}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#9333ea' }]}>
                {stats.guests_checked_in}
              </Text>
              <Text style={styles.statLabel}>Checked In</Text>
            </View>
          </View>
        </View>

        {/* Template-Specific Details */}
        {renderTemplateDetails()}

        {/* Management Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Manage Event</Text>
          
          {/* Create Invites */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/events/${id}/invites/templates` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mail" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Invitations</Text>
              <Text style={styles.actionSubtitle}>
                Design and send custom invites to guests
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/events/${id}/guests` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="people" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Guest List</Text>
              <Text style={styles.actionSubtitle}>
                Manage guests, RSVPs, and check-ins
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {/* TODO: Navigate to timeline */}}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="time" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Timeline</Text>
              <Text style={styles.actionSubtitle}>
                {stats.timeline_blocks} scheduled activities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {/* TODO: Navigate to media */}}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="images" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Media</Text>
              <Text style={styles.actionSubtitle}>
                {stats.media_count} photos and videos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {/* TODO: Navigate to vendors */}}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="business" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Vendors</Text>
              <Text style={styles.actionSubtitle}>Manage vendors and services</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {/* TODO: Navigate to activities */}}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="game-controller" size={24} color="#9333ea" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Activities</Text>
              <Text style={styles.actionSubtitle}>Plan games and activities</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/events/${id}/planning/collaborate` as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="people-circle" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Collaboration Hub</Text>
              <Text style={styles.actionSubtitle}>Polls, debates, and team decisions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        {event.status !== 'cancelled' && (
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Event',
                  'Are you sure you want to cancel this event? This action cannot be undone.',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: () => {/* TODO: Cancel event */} },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Cancel Event</Text>
            </TouchableOpacity>
          </View>
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
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3e8ff',
    borderRadius: 16,
  },
  templateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333ea',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  dangerZone: {
    padding: 20,
    marginTop: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  // Template Details Styles
  templateDetailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailCardValue: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 22,
  },
  detailCardSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  activityChip: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  activityChipText: {
    fontSize: 13,
    color: '#9333ea',
    fontWeight: '500',
  },
  linkText: {
    fontSize: 14,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
});
