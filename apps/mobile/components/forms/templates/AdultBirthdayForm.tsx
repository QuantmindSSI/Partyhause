import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemplateFormData } from '../TemplateForm';

interface AdultBirthdayFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const THEME_PRESETS = [
  '80s Retro',
  'Tropical/Luau',
  'Hollywood Glamour',
  'Garden Party',
  'Casino Night',
  'Masquerade Ball',
  'Beach Party',
  'Winter Wonderland',
  'Wine & Cheese',
  'Roaring 20s',
  'Custom',
];

const VENUE_TYPES = [
  'Home (Indoor)',
  'Home (Backyard)',
  'Restaurant/Bar',
  'Banquet Hall',
  'Rooftop Venue',
  'Beach/Outdoor',
  'Wine Bar/Brewery',
  'Club/Lounge',
  'Hotel Suite',
  'Yacht/Boat',
  'Other',
];

export default function AdultBirthdayForm({ initialData = {}, onChange, onValidation }: AdultBirthdayFormProps) {
  // Basic Info
  const [birthdayPerson, setBirthdayPerson] = useState(initialData.birthday_person || '');
  const [age, setAge] = useState(initialData.age?.toString() || '');
  const [milestone, setMilestone] = useState(initialData.milestone || '');
  const [expectedGuestCount, setExpectedGuestCount] = useState(initialData.expected_guest_count?.toString() || '');
  
  // Venue & Theme
  const [venueType, setVenueType] = useState(initialData.venue_type || '');
  const [theme, setTheme] = useState(initialData.theme || '');
  const [customTheme, setCustomTheme] = useState(initialData.custom_theme || '');
  const [dressCode, setDressCode] = useState(initialData.dress_code || '');
  
  // Food & Drinks
  const [cateringStyle, setCateringStyle] = useState(initialData.catering_style || '');
  const [menuNotes, setMenuNotes] = useState(initialData.menu_notes || '');
  const [barService, setBarService] = useState(initialData.bar_service || 'full-bar');
  const [cakeDetails, setCakeDetails] = useState(initialData.cake_details || '');
  const [dietaryRestrictions, setDietaryRestrictions] = useState(initialData.dietary_restrictions || '');
  
  // Entertainment
  const [entertainmentType, setEntertainmentType] = useState(initialData.entertainment_type || '');
  const [musicPreferences, setMusicPreferences] = useState(initialData.music_preferences || '');
  const [djBandDetails, setDjBandDetails] = useState(initialData.dj_band_details || '');
  
  // Gift Preferences
  const [giftPreference, setGiftPreference] = useState(initialData.gift_preference || 'registry');
  const [registryLinks, setRegistryLinks] = useState<string[]>(initialData.registry_links || ['']);
  const [donationInfo, setDonationInfo] = useState(initialData.donation_info || '');
  
  // Special Features
  const [hasPhotoBooth, setHasPhotoBooth] = useState(initialData.has_photo_booth || false);
  const [photoBoothDetails, setPhotoBoothDetails] = useState(initialData.photo_booth_details || '');
  const [hasToasts, setHasToasts] = useState(initialData.has_toasts || false);
  const [toastSchedule, setToastSchedule] = useState(initialData.toast_schedule || '');
  const [specialRequests, setSpecialRequests] = useState(initialData.special_requests || '');

  useEffect(() => {
    const formData: TemplateFormData = {
      // Basic Info
      birthday_person: birthdayPerson,
      age: age ? parseInt(age) : null,
      milestone,
      expected_guest_count: expectedGuestCount ? parseInt(expectedGuestCount) : null,
      
      // Venue & Theme
      venue_type: venueType,
      theme: theme === 'Custom' ? customTheme : theme,
      dress_code: dressCode,
      
      // Food & Drinks
      catering_style: cateringStyle,
      menu_notes: menuNotes,
      bar_service: barService,
      cake_details: cakeDetails,
      dietary_restrictions: dietaryRestrictions,
      
      // Entertainment
      entertainment_type: entertainmentType,
      music_preferences: musicPreferences,
      dj_band_details: djBandDetails,
      
      // Gift Preferences
      gift_preference: giftPreference,
      registry_links: giftPreference === 'registry' ? registryLinks.filter(link => link.trim()) : [],
      donation_info: donationInfo,
      
      // Special Features
      has_photo_booth: hasPhotoBooth,
      photo_booth_details: photoBoothDetails,
      has_toasts: hasToasts,
      toast_schedule: toastSchedule,
      special_requests: specialRequests,
    };

    onChange(formData);

    // Validation: birthday person is required
    const isValid = birthdayPerson.trim().length > 0;
    onValidation(isValid);
  }, [
    birthdayPerson, age, milestone, expectedGuestCount,
    venueType, theme, customTheme, dressCode,
    cateringStyle, menuNotes, barService, cakeDetails, dietaryRestrictions,
    entertainmentType, musicPreferences, djBandDetails,
    giftPreference, registryLinks, donationInfo,
    hasPhotoBooth, photoBoothDetails, hasToasts, toastSchedule, specialRequests,
  ]);

  const addRegistryLink = () => {
    setRegistryLinks([...registryLinks, '']);
  };

  const removeRegistryLink = (index: number) => {
    setRegistryLinks(registryLinks.filter((_, i) => i !== index));
  };

  const updateRegistryLink = (index: number, value: string) => {
    const updated = [...registryLinks];
    updated[index] = value;
    setRegistryLinks(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Birthday Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Birthday Celebrant</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Who's celebrating?"
            value={birthdayPerson}
            onChangeText={setBirthdayPerson}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfWidth]}>
            <Text style={styles.label}>Age Turning</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={[styles.field, styles.halfWidth]}>
            <Text style={styles.label}>Guest Count (Est.)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50"
              value={expectedGuestCount}
              onChangeText={setExpectedGuestCount}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Special Milestone</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30th, 40th, 50th, Over the Hill"
            value={milestone}
            onChangeText={setMilestone}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Venue Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venue Type</Text>
        <View style={styles.chipGrid}>
          {VENUE_TYPES.map((venue) => (
            <TouchableOpacity
              key={venue}
              style={[
                styles.chip,
                venueType === venue && styles.chipActive,
              ]}
              onPress={() => setVenueType(venue)}
            >
              <Text
                style={[
                  styles.chipText,
                  venueType === venue && styles.chipTextActive,
                ]}
              >
                {venue}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Party Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Party Theme</Text>
        <View style={styles.chipGrid}>
          {THEME_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.chip,
                theme === preset && styles.chipActive,
              ]}
              onPress={() => setTheme(preset)}
            >
              <Text
                style={[
                  styles.chipText,
                  theme === preset && styles.chipTextActive,
                ]}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {theme === 'Custom' && (
          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom theme..."
              value={customTheme}
              onChangeText={setCustomTheme}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Dress Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Cocktail Attire, Casual, Black Tie, Costume"
            value={dressCode}
            onChangeText={setDressCode}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Food & Drinks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food & Drinks</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Catering Style</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Buffet, Plated Dinner, Appetizers & Hors d'oeuvres"
            value={cateringStyle}
            onChangeText={setCateringStyle}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Menu Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuisine type, signature dishes, caterer details..."
            value={menuNotes}
            onChangeText={setMenuNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bar Service</Text>
          <View style={styles.chipGrid}>
            {['Full Bar', 'Beer & Wine', 'Signature Cocktails', 'Non-Alcoholic', 'BYOB'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  barService === option && styles.chipActive,
                ]}
                onPress={() => setBarService(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    barService === option && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cake Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Flavor, design, baker, special dietary options..."
            value={cakeDetails}
            onChangeText={setCakeDetails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dietary Restrictions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Vegetarian, vegan, gluten-free, allergies..."
            value={dietaryRestrictions}
            onChangeText={setDietaryRestrictions}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Entertainment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entertainment</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Entertainment Type</Text>
          <View style={styles.chipGrid}>
            {['DJ', 'Live Band', 'Karaoke', 'Comedy Show', 'None'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  entertainmentType === option && styles.chipActive,
                ]}
                onPress={() => setEntertainmentType(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    entertainmentType === option && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Music Preferences</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Preferred genres, must-play songs, do-not-play list..."
            value={musicPreferences}
            onChangeText={setMusicPreferences}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {(entertainmentType === 'DJ' || entertainmentType === 'Live Band') && (
          <View style={styles.field}>
            <Text style={styles.label}>DJ/Band Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Name, contact, setup requirements..."
              value={djBandDetails}
              onChangeText={setDjBandDetails}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
      </View>

      {/* Gift Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gift Preferences</Text>
        
        <View style={styles.chipGrid}>
          <TouchableOpacity
            style={[
              styles.chip,
              giftPreference === 'registry' && styles.chipActive,
            ]}
            onPress={() => setGiftPreference('registry')}
          >
            <Text
              style={[
                styles.chipText,
                giftPreference === 'registry' && styles.chipTextActive,
              ]}
            >
              Gift Registry
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chip,
              giftPreference === 'no-gifts' && styles.chipActive,
            ]}
            onPress={() => setGiftPreference('no-gifts')}
          >
            <Text
              style={[
                styles.chipText,
                giftPreference === 'no-gifts' && styles.chipTextActive,
              ]}
            >
              No Gifts Please
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chip,
              giftPreference === 'donation' && styles.chipActive,
            ]}
            onPress={() => setGiftPreference('donation')}
          >
            <Text
              style={[
                styles.chipText,
                giftPreference === 'donation' && styles.chipTextActive,
              ]}
            >
              Donate to Charity
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chip,
              giftPreference === 'experiences' && styles.chipActive,
            ]}
            onPress={() => setGiftPreference('experiences')}
          >
            <Text
              style={[
                styles.chipText,
                giftPreference === 'experiences' && styles.chipTextActive,
              ]}
            >
              Experience Gifts
            </Text>
          </TouchableOpacity>
        </View>

        {giftPreference === 'registry' && (
          <>
            <Text style={styles.helperText}>
              Add links to gift registries
            </Text>
            {registryLinks.map((link, index) => (
              <View key={index} style={styles.linkRow}>
                <TextInput
                  style={[styles.input, styles.linkInput]}
                  placeholder="https://..."
                  value={link}
                  onChangeText={(value) => updateRegistryLink(index, value)}
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
                {registryLinks.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeRegistryLink(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={addRegistryLink} style={styles.addButton}>
              <Ionicons name="add-circle" size={20} color="#9333ea" />
              <Text style={styles.addButtonText}>Add Another Registry</Text>
            </TouchableOpacity>
          </>
        )}

        {giftPreference === 'donation' && (
          <View style={styles.field}>
            <Text style={styles.label}>Charity/Donation Information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Preferred charity name and donation link..."
              value={donationInfo}
              onChangeText={setDonationInfo}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
      </View>

      {/* Special Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Features</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="camera" size={20} color="#9333ea" />
            <Text style={styles.toggleText}>Photo Booth</Text>
          </View>
          <Switch
            value={hasPhotoBooth}
            onValueChange={setHasPhotoBooth}
            trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
            thumbColor={hasPhotoBooth ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {hasPhotoBooth && (
          <View style={styles.field}>
            <Text style={styles.label}>Photo Booth Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Vendor, props, backdrop theme..."
              value={photoBoothDetails}
              onChangeText={setPhotoBoothDetails}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="wine" size={20} color="#9333ea" />
            <Text style={styles.toggleText}>Toasts/Speeches</Text>
          </View>
          <Switch
            value={hasToasts}
            onValueChange={setHasToasts}
            trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
            thumbColor={hasToasts ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {hasToasts && (
          <View style={styles.field}>
            <Text style={styles.label}>Toast Schedule</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Who will give toasts and when..."
              value={toastSchedule}
              onChangeText={setToastSchedule}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Special Requests</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any other special requirements or requests..."
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  chipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  linkInput: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9333ea',
  },
});
