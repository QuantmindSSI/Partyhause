import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { InviteTemplate, InviteCustomization } from '@/types/invites';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InvitePreviewProps {
  template: InviteTemplate;
  customization?: Partial<InviteCustomization>;
  eventData: {
    title: string;
    date: string;
    time?: string;
    location?: string;
    host_name?: string;
  };
  scale?: number;
}

export function InvitePreview({
  template,
  customization,
  eventData,
  scale = 1,
}: InvitePreviewProps) {
  // Merge template colors with custom colors
  const colors = {
    ...template.colors,
    ...customization?.custom_colors,
  };

  const customMessage = customization?.custom_message || 
    `You're invited to ${eventData.title}!`;

  const showDetails = customization?.show_event_details !== false;
  const showRSVP = customization?.show_rsvp_button !== false;

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Different layouts
  const renderClassicLayout = () => (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={[styles.previewContainer, { transform: [{ scale }] }]}
    >
      {/* Decorative Border */}
      <View style={[styles.decorativeBorder, { borderColor: colors.primary }]} />

      {/* Header Icon/Decoration */}
      <View style={styles.headerDecoration}>
        <View style={[styles.decorativeDot, { backgroundColor: colors.accent }]} />
        <View style={[styles.decorativeLine, { backgroundColor: colors.primary }]} />
        <View style={[styles.decorativeDot, { backgroundColor: colors.accent }]} />
      </View>

      {/* Invitation Text */}
      <Text style={[styles.invitationLabel, { color: colors.secondary }]}>
        You're Invited
      </Text>

      {/* Event Title */}
      <Text style={[styles.eventTitle, { color: colors.text }]}>
        {eventData.title}
      </Text>

      {/* Custom Message */}
      {customMessage && (
        <Text style={[styles.customMessage, { color: colors.secondary }]}>
          {customMessage}
        </Text>
      )}

      {/* Event Details */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          {/* Date */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {formatEventDate(eventData.date)}
            </Text>
          </View>

          {/* Time */}
          {eventData.time && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {eventData.time}
              </Text>
            </View>
          )}

          {/* Location */}
          {eventData.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {eventData.location}
              </Text>
            </View>
          )}

          {/* Host */}
          {eventData.host_name && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Hosted by {eventData.host_name}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* RSVP Button Placeholder */}
      {showRSVP && (
        <View style={[styles.rsvpButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.rsvpButtonText, { color: colors.accent }]}>
            RSVP Now
          </Text>
        </View>
      )}

      {/* Footer */}
      {customization?.custom_footer && (
        <Text style={[styles.footer, { color: colors.secondary }]}>
          {customization.custom_footer}
        </Text>
      )}
    </LinearGradient>
  );

  const renderCardLayout = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={[styles.previewContainer, { transform: [{ scale }] }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Card Content */}
      <View style={[styles.cardContent, { backgroundColor: colors.background }]}>
        {/* Title */}
        <Text style={[styles.cardTitle, { color: colors.primary }]}>
          {eventData.title}
        </Text>

        {/* Message */}
        <Text style={[styles.cardMessage, { color: colors.text }]}>
          {customMessage}
        </Text>

        {/* Details */}
        {showDetails && (
          <View style={styles.cardDetails}>
            <View style={[styles.cardDetailItem, { borderLeftColor: colors.primary }]}>
              <Text style={[styles.cardDetailLabel, { color: colors.secondary }]}>
                DATE
              </Text>
              <Text style={[styles.cardDetailValue, { color: colors.text }]}>
                {formatEventDate(eventData.date)}
              </Text>
            </View>

            {eventData.time && (
              <View style={[styles.cardDetailItem, { borderLeftColor: colors.primary }]}>
                <Text style={[styles.cardDetailLabel, { color: colors.secondary }]}>
                  TIME
                </Text>
                <Text style={[styles.cardDetailValue, { color: colors.text }]}>
                  {eventData.time}
                </Text>
              </View>
            )}

            {eventData.location && (
              <View style={[styles.cardDetailItem, { borderLeftColor: colors.primary }]}>
                <Text style={[styles.cardDetailLabel, { color: colors.secondary }]}>
                  LOCATION
                </Text>
                <Text style={[styles.cardDetailValue, { color: colors.text }]}>
                  {eventData.location}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* RSVP */}
        {showRSVP && (
          <View style={[styles.rsvpButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.rsvpButtonText, { color: colors.background }]}>
              RSVP
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  // Render based on layout type
  const renderLayout = () => {
    switch (template.layout) {
      case 'card':
        return renderCardLayout();
      case 'classic':
      default:
        return renderClassicLayout();
    }
  };

  return renderLayout();
}

const styles = StyleSheet.create({
  previewContainer: {
    width: SCREEN_WIDTH - 40,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  decorativeBorder: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 2,
    borderRadius: 12,
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  decorativeLine: {
    width: 60,
    height: 2,
  },
  invitationLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  customMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  detailsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  rsvpButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 'auto',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Card Layout Styles
  cardContent: {
    margin: 20,
    padding: 30,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardDetails: {
    gap: 16,
    marginVertical: 20,
  },
  cardDetailItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  cardDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
