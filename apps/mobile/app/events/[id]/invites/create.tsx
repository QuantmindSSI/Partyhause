import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { INVITE_TEMPLATES, InviteCustomization } from '@/types/invites';
import { InvitePreview } from '@/components/invites/InvitePreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateInviteScreen() {
  const { id, templateId } = useLocalSearchParams<{ id: string; templateId: string }>();
  const template = INVITE_TEMPLATES.find(t => t.id === templateId);
  const scrollViewRef = useRef<ScrollView>(null);

  const [customization, setCustomization] = useState<Partial<InviteCustomization>>({
    template_id: templateId || '',
    show_event_details: true,
    show_location_map: false,
    show_rsvp_button: true,
  });

  const [customMessage, setCustomMessage] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  if (!template) {
    return (
      <View style={styles.errorContainer}>
        <Text>Template not found</Text>
      </View>
    );
  }

  // Mock event data (would come from event details)
  const eventData = {
    title: 'Summer BBQ Party',
    date: '2025-07-15',
    time: '4:00 PM',
    location: 'Backyard',
    host_name: 'John Doe',
  };

  const handleSaveAndContinue = () => {
    const finalCustomization: InviteCustomization = {
      template_id: template.id,
      custom_message: customMessage || undefined,
      custom_footer: customFooter || undefined,
      show_event_details: customization.show_event_details ?? true,
      show_location_map: customization.show_location_map ?? false,
      show_rsvp_button: customization.show_rsvp_button ?? true,
    };

    // Navigate to send screen with customization data
    router.push({
      pathname: `/events/[id]/invites/send` as any,
      params: {
        id,
        templateId: template.id,
        customization: JSON.stringify(finalCustomization),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FAFAFA', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Customize Invite</Text>
            <Text style={styles.headerSubtitle}>{template.name}</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndContinue}>
            <Text style={styles.saveButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewScrollContent}
          >
            <InvitePreview
              template={template}
              customization={{ ...customization, custom_message: customMessage, custom_footer: customFooter }}
              eventData={eventData}
              scale={0.8}
            />
          </ScrollView>
        </View>

        {/* Customization Options */}
        <View style={styles.optionsSection}>
          {/* Custom Message */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#6366F1" />
              <Text style={styles.optionTitle}>Invitation Message</Text>
            </View>
            <Text style={styles.optionDescription}>
              Add a personal message to your guests
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={`You're invited to ${eventData.title}!`}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{customMessage.length}/200</Text>
          </View>

          {/* Display Options */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name="options" size={24} color="#6366F1" />
              <Text style={styles.optionTitle}>Display Options</Text>
            </View>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() =>
                setCustomization(prev => ({
                  ...prev,
                  show_event_details: !prev.show_event_details,
                }))
              }
            >
              <View style={styles.toggleLeft}>
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <Text style={styles.toggleLabel}>Show Event Details</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  customization.show_event_details && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    customization.show_event_details && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() =>
                setCustomization(prev => ({
                  ...prev,
                  show_location_map: !prev.show_location_map,
                }))
              }
            >
              <View style={styles.toggleLeft}>
                <Ionicons name="map" size={20} color="#6B7280" />
                <Text style={styles.toggleLabel}>Show Location Map</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  customization.show_location_map && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    customization.show_location_map && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() =>
                setCustomization(prev => ({
                  ...prev,
                  show_rsvp_button: !prev.show_rsvp_button,
                }))
              }
            >
              <View style={styles.toggleLeft}>
                <Ionicons name="checkmark-circle" size={20} color="#6B7280" />
                <Text style={styles.toggleLabel}>Show RSVP Button</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  customization.show_rsvp_button && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    customization.show_rsvp_button && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Custom Footer */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name="text" size={24} color="#6366F1" />
              <Text style={styles.optionTitle}>Footer Text</Text>
            </View>
            <Text style={styles.optionDescription}>
              Add additional information at the bottom
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Dress code: Casual, Please bring a dish"
              value={customFooter}
              onChangeText={setCustomFooter}
              multiline
              numberOfLines={2}
              maxLength={150}
            />
            <Text style={styles.charCount}>{customFooter.length}/150</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back to Templates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveAndContinue}>
          <Text style={styles.primaryButtonText}>Continue to Send</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  previewScrollContent: {
    paddingRight: 20,
  },
  optionsSection: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#374151',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6366F1',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
