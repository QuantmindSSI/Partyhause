import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemplateFormData } from '../TemplateForm';

interface BirthdayFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const THEME_PRESETS = [
  'Superhero',
  'Princess Tea Party',
  'Science Lab',
  'Sports',
  'Art Studio',
  'Gaming/Esports',
  'Movie Theater',
  'Petting Zoo/Farm',
  'Pool Party',
  'Custom',
];

const VENUE_TYPES = [
  'Home (Indoor)',
  'Home (Backyard)',
  'Home (Pool)',
  'Indoor Play Center',
  'Sports Complex',
  'Art Studio',
  'Gaming Lounge',
  'Movie Theater',
  'Farm/Petting Zoo',
  'Community Pool',
  'Other',
];

const ACTIVITY_OPTIONS = [
  'Bounce House',
  'Face Painting',
  'Balloon Animals',
  'Magic Show',
  'Character Performer',
  'Craft Station',
  'Science Experiments',
  'Sports Games',
  'Video Game Tournament',
  'Movie Screening',
  'Pool Games',
  'Scavenger Hunt',
  'Obstacle Course',
  'Petting Zoo',
  'Pony Rides',
];

export default function BirthdayForm({ initialData = {}, onChange, onValidation }: BirthdayFormProps) {
  // Basic Info
  const [birthdayPerson, setBirthdayPerson] = useState(initialData.birthday_person || '');
  const [age, setAge] = useState(initialData.age?.toString() || '');
  const [milestone, setMilestone] = useState(initialData.milestone || '');
  const [expectedGuestCount, setExpectedGuestCount] = useState(initialData.expected_guest_count?.toString() || '');
  const [ageRange, setAgeRange] = useState(initialData.age_range || '');
  
  // Venue & Theme
  const [venueType, setVenueType] = useState(initialData.venue_type || '');
  const [theme, setTheme] = useState(initialData.theme || '');
  const [customTheme, setCustomTheme] = useState(initialData.custom_theme || '');
  const [dressCode, setDressCode] = useState(initialData.dress_code || '');
  
  // Activities
  const [selectedActivities, setSelectedActivities] = useState<string[]>(initialData.selected_activities || []);
  const [customActivities, setCustomActivities] = useState(initialData.custom_activities || '');
  const [entertainmentNotes, setEntertainmentNotes] = useState(initialData.entertainment_notes || '');
  
  // Food & Cake
  const [cakeDetails, setCakeDetails] = useState(initialData.cake_details || '');
  const [foodMenu, setFoodMenu] = useState(initialData.food_menu || '');
  const [allergyNotes, setAllergyNotes] = useState(initialData.allergy_notes || '');
  
  // Gift Registry
  const [giftPreference, setGiftPreference] = useState(initialData.gift_preference || 'registry');
  const [registryLinks, setRegistryLinks] = useState<string[]>(initialData.registry_links || ['']);
  const [giftWishes, setGiftWishes] = useState(initialData.gift_wishes || '');
  const [donationInfo, setDonationInfo] = useState(initialData.donation_info || '');
  
  // Parent Logistics
  const [parentStayRequired, setParentStayRequired] = useState(initialData.parent_stay_required || false);
  const [supervisionRatio, setSupervisionRatio] = useState(initialData.supervision_ratio || '');
  const [pickupTime, setPickupTime] = useState(initialData.pickup_time || '');
  
  // Safety & Special Needs
  const [safetyRequirements, setSafetyRequirements] = useState(initialData.safety_requirements || '');
  const [equipmentProvided, setEquipmentProvided] = useState(initialData.equipment_provided || '');
  const [whatToBring, setWhatToBring] = useState(initialData.what_to_bring || '');
  
  // Venue-Specific
  const [venuePackage, setVenuePackage] = useState(initialData.venue_package || '');
  const [venueRules, setVenueRules] = useState(initialData.venue_rules || '');
  const [backupPlan, setBackupPlan] = useState(initialData.backup_plan || '');
  
  // Photography
  const [photographyArrangement, setPhotographyArrangement] = useState(initialData.photography_arrangement || 'parent-volunteers');
  const [photographerDetails, setPhotographerDetails] = useState(initialData.photographer_details || '');

  useEffect(() => {
    const formData: TemplateFormData = {
      // Basic Info
      birthday_person: birthdayPerson,
      age: age ? parseInt(age) : null,
      milestone,
      expected_guest_count: expectedGuestCount ? parseInt(expectedGuestCount) : null,
      age_range: ageRange,
      
      // Venue & Theme
      venue_type: venueType,
      theme: theme === 'Custom' ? customTheme : theme,
      dress_code: dressCode,
      
      // Activities
      selected_activities: selectedActivities,
      custom_activities: customActivities,
      entertainment_notes: entertainmentNotes,
      
      // Food & Cake
      cake_details: cakeDetails,
      food_menu: foodMenu,
      allergy_notes: allergyNotes,
      
      // Gift Registry
      gift_preference: giftPreference,
      registry_links: giftPreference === 'registry' ? registryLinks.filter(link => link.trim()) : [],
      gift_wishes: giftWishes,
      donation_info: donationInfo,
      
      // Parent Logistics
      parent_stay_required: parentStayRequired,
      supervision_ratio: supervisionRatio,
      pickup_time: pickupTime,
      
      // Safety & Special Needs
      safety_requirements: safetyRequirements,
      equipment_provided: equipmentProvided,
      what_to_bring: whatToBring,
      
      // Venue-Specific
      venue_package: venuePackage,
      venue_rules: venueRules,
      backup_plan: backupPlan,
      
      // Photography
      photography_arrangement: photographyArrangement,
      photographer_details: photographerDetails,
    };

    onChange(formData);

    // Validation: birthday person is required
    const isValid = birthdayPerson.trim().length > 0;
    onValidation(isValid);
  }, [
    birthdayPerson, age, milestone, expectedGuestCount, ageRange,
    venueType, theme, customTheme, dressCode,
    selectedActivities, customActivities, entertainmentNotes,
    cakeDetails, foodMenu, allergyNotes,
    giftPreference, registryLinks, giftWishes, donationInfo,
    parentStayRequired, supervisionRatio, pickupTime,
    safetyRequirements, equipmentProvided, whatToBring,
    venuePackage, venueRules, backupPlan,
    photographyArrangement, photographerDetails,
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

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Birthday Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Birthday Child Info</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Birthday Child's Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Emma"
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
              placeholder="e.g., 7"
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
              placeholder="e.g., 15"
              value={expectedGuestCount}
              onChangeText={setExpectedGuestCount}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Guest Age Range</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5-8 years old"
            value={ageRange}
            onChangeText={setAgeRange}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Special Milestone (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1st Birthday, Sweet 16"
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

        {(venueType === 'Indoor Play Center' || venueType === 'Sports Complex' || venueType === 'Art Studio') && (
          <View style={styles.field}>
            <Text style={styles.label}>Venue Package/Tier</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Basic Package, Premium 2-hour"
              value={venuePackage}
              onChangeText={setVenuePackage}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {venueType && venueType !== 'Home (Indoor)' && venueType !== 'Home (Backyard)' && (
          <View style={styles.field}>
            <Text style={styles.label}>Venue Rules/Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Sock requirement, waiver forms needed, time restrictions..."
              value={venueRules}
              onChangeText={setVenueRules}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {(venueType === 'Home (Backyard)' || venueType === 'Home (Pool)') && (
          <View style={styles.field}>
            <Text style={styles.label}>Weather Backup Plan</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Move indoors, Reschedule date"
              value={backupPlan}
              onChangeText={setBackupPlan}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
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
          <Text style={styles.label}>Dress Code/Costume Requirements</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Come as your favorite superhero, Casual"
            value={dressCode}
            onChangeText={setDressCode}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Activities & Entertainment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities & Entertainment</Text>
        <Text style={styles.helperText}>Select all that apply</Text>
        
        <View style={styles.chipGrid}>
          {ACTIVITY_OPTIONS.map((activity) => (
            <TouchableOpacity
              key={activity}
              style={[
                styles.chip,
                selectedActivities.includes(activity) && styles.chipActive,
              ]}
              onPress={() => toggleActivity(activity)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedActivities.includes(activity) && styles.chipTextActive,
                ]}
              >
                {activity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Additional Custom Activities</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="List any other activities or games..."
            value={customActivities}
            onChangeText={setCustomActivities}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Entertainment Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Character performer names, magician contact, DJ info..."
            value={entertainmentNotes}
            onChangeText={setEntertainmentNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Food & Cake */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food & Cake</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Food Menu</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Pizza, juice boxes, fruit platter, veggie tray..."
            value={foodMenu}
            onChangeText={setFoodMenu}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cake Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Flavor, design, dietary options (gluten-free, vegan)..."
            value={cakeDetails}
            onChangeText={setCakeDetails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Allergy & Dietary Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Common allergies to avoid, nut-free facility..."
            value={allergyNotes}
            onChangeText={setAllergyNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
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
              giftPreference === 'wishes' && styles.chipActive,
            ]}
            onPress={() => setGiftPreference('wishes')}
          >
            <Text
              style={[
                styles.chipText,
                giftPreference === 'wishes' && styles.chipTextActive,
              ]}
            >
              Gift Wish List
            </Text>
          </TouchableOpacity>
        </View>

        {giftPreference === 'registry' && (
          <>
            <Text style={styles.helperText}>
              Add links to gift registries (Amazon, Target, etc.)
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

        {giftPreference === 'wishes' && (
          <View style={styles.field}>
            <Text style={styles.label}>Gift Ideas/Wishes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List gift ideas (one per line)..."
              value={giftWishes}
              onChangeText={setGiftWishes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
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

      {/* Parent Logistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parent Logistics</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="people" size={20} color="#9333ea" />
            <Text style={styles.toggleText}>Parents Must Stay</Text>
          </View>
          <Switch
            value={parentStayRequired}
            onValueChange={setParentStayRequired}
            trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
            thumbColor={parentStayRequired ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Supervision Ratio</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1 adult per 5 kids"
            value={supervisionRatio}
            onChangeText={setSupervisionRatio}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pickup Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 4:00 PM sharp"
            value={pickupTime}
            onChangeText={setPickupTime}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Safety & What to Bring */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety & Requirements</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Safety Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Lifeguard on duty, safety goggles provided, pool floaties allowed..."
            value={safetyRequirements}
            onChangeText={setSafetyRequirements}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Equipment Provided</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Sports equipment, craft supplies, game consoles..."
            value={equipmentProvided}
            onChangeText={setEquipmentProvided}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>What Guests Should Bring</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Swimsuit & towel, socks, old clothes for art..."
            value={whatToBring}
            onChangeText={setWhatToBring}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Photography */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photography</Text>
        
        <View style={styles.chipGrid}>
          <TouchableOpacity
            style={[
              styles.chip,
              photographyArrangement === 'professional' && styles.chipActive,
            ]}
            onPress={() => setPhotographyArrangement('professional')}
          >
            <Text
              style={[
                styles.chipText,
                photographyArrangement === 'professional' && styles.chipTextActive,
              ]}
            >
              Professional Photographer
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chip,
              photographyArrangement === 'parent-volunteers' && styles.chipActive,
            ]}
            onPress={() => setPhotographyArrangement('parent-volunteers')}
          >
            <Text
              style={[
                styles.chipText,
                photographyArrangement === 'parent-volunteers' && styles.chipTextActive,
              ]}
            >
              Parent Volunteers
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chip,
              photographyArrangement === 'none' && styles.chipActive,
            ]}
            onPress={() => setPhotographyArrangement('none')}
          >
            <Text
              style={[
                styles.chipText,
                photographyArrangement === 'none' && styles.chipTextActive,
              ]}
            >
              No Photos
            </Text>
          </TouchableOpacity>
        </View>

        {photographyArrangement === 'professional' && (
          <View style={styles.field}>
            <Text style={styles.label}>Photographer Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Photographer name, contact, package details..."
              value={photographerDetails}
              onChangeText={setPhotographerDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
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
