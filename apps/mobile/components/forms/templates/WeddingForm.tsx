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

interface WeddingFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

export default function WeddingForm({ initialData = {}, onChange, onValidation }: WeddingFormProps) {
  // Couple Information
  const [partner1Name, setPartner1Name] = useState(initialData.partner1_name || '');
  const [partner2Name, setPartner2Name] = useState(initialData.partner2_name || '');
  const [weddingStyle, setWeddingStyle] = useState(initialData.wedding_style || '');
  
  // Ceremony Details
  const [ceremonyVenue, setCeremonyVenue] = useState(initialData.ceremony_venue || '');
  const [ceremonyType, setCeremonyType] = useState(initialData.ceremony_type || '');
  const [officiantName, setOfficiantName] = useState(initialData.officiant_name || '');
  const [ceremonyLength, setCeremonyLength] = useState(initialData.ceremony_length || '');
  const [customVows, setCustomVows] = useState(initialData.custom_vows || false);
  const [ceremonyMusic, setCeremonyMusic] = useState(initialData.ceremony_music || '');
  
  // Reception Details
  const [receptionVenue, setReceptionVenue] = useState(initialData.reception_venue || '');
  const [sameAsceremony, setSameAsCeremony] = useState(initialData.same_as_ceremony || false);
  const [receptionStyle, setReceptionStyle] = useState(initialData.reception_style || '');
  const [expectedGuestCount, setExpectedGuestCount] = useState(initialData.expected_guest_count || '');
  
  // Catering & Menu
  const [cateringStyle, setCateringStyle] = useState(initialData.catering_style || '');
  const [menuType, setMenuType] = useState(initialData.menu_type || '');
  const [mealChoices, setMealChoices] = useState<string[]>(initialData.meal_choices || []);
  const [barService, setBarService] = useState(initialData.bar_service || '');
  const [signatureCocktail, setSignatureCocktail] = useState(initialData.signature_cocktail || '');
  const [cakeDetails, setCakeDetails] = useState(initialData.cake_details || '');
  const [dietaryAccommodations, setDietaryAccommodations] = useState(initialData.dietary_accommodations || '');
  
  // Wedding Party
  const [weddingPartySize, setWeddingPartySize] = useState(initialData.wedding_party_size || '');
  const [bridesmaidsCount, setBridesmaidsCount] = useState(initialData.bridesmaids_count || '');
  const [groomsmenCount, setGroomsmenCount] = useState(initialData.groomsmen_count || '');
  const [flowerGirlRingBearer, setFlowerGirlRingBearer] = useState(initialData.flower_girl_ring_bearer || false);
  
  // Theme & Decor
  const [colorScheme, setColorScheme] = useState(initialData.color_scheme || '');
  const [theme, setTheme] = useState(initialData.theme || '');
  const [dressCode, setDressCode] = useState(initialData.dress_code || '');
  const [decorStyle, setDecorStyle] = useState(initialData.decor_style || '');
  
  // Entertainment & Music
  const [musicType, setMusicType] = useState(initialData.music_type || '');
  const [bandDjName, setBandDjName] = useState(initialData.band_dj_name || '');
  const [firstDanceSong, setFirstDanceSong] = useState(initialData.first_dance_song || '');
  const [specialDances, setSpecialDances] = useState(initialData.special_dances || '');
  const [doNotPlayList, setDoNotPlayList] = useState(initialData.do_not_play_list || '');
  
  // Photography & Videography
  const [photographerName, setPhotographerName] = useState(initialData.photographer_name || '');
  const [photographyPackage, setPhotographyPackage] = useState(initialData.photography_package || '');
  const [videographerName, setVideographerName] = useState(initialData.videographer_name || '');
  const [photoBoothIncluded, setPhotoBoothIncluded] = useState(initialData.photo_booth_included || false);
  const [droneFootage, setDroneFootage] = useState(initialData.drone_footage || false);
  
  // Special Events & Traditions
  const [bouquetToss, setBouquetToss] = useState(initialData.bouquet_toss || false);
  const [gartterToss, setGarterToss] = useState(initialData.garter_toss || false);
  const [toastsSpeeches, setToastsSpeeches] = useState(initialData.toasts_speeches || '');
  const [grandEntrance, setGrandEntrance] = useState(initialData.grand_entrance || false);
  const [cakeCutting, setCakeCutting] = useState(initialData.cake_cutting || false);
  const [culturalTraditions, setCulturalTraditions] = useState(initialData.cultural_traditions || '');
  
  // Guest Accommodations
  const [hotelBlocks, setHotelBlocks] = useState(initialData.hotel_blocks || '');
  const [transportationProvided, setTransportationProvided] = useState(initialData.transportation_provided || false);
  const [transportationDetails, setTransportationDetails] = useState(initialData.transportation_details || '');
  const [childcareProvided, setChildcareProvided] = useState(initialData.childcare_provided || false);
  const [kidsOnly, setKidsOnly] = useState(initialData.kids_only || false);
  
  // Registry & Gifts
  const [registryLinks, setRegistryLinks] = useState<string[]>(initialData.registry_links || ['']);
  const [honeyFundLink, setHoneyFundLink] = useState(initialData.honey_fund_link || '');
  const [giftPreference, setGiftPreference] = useState(initialData.gift_preference || '');
  
  // Seating
  const [seatingStyle, setSeatingStyle] = useState(initialData.seating_style || '');
  const [headTableType, setHeadTableType] = useState(initialData.head_table_type || '');
  const [guestTableSize, setGuestTableSize] = useState(initialData.guest_table_size || '');
  
  const weddingStyles = ['Traditional', 'Modern', 'Rustic', 'Beach', 'Garden', 'Vintage', 'Bohemian', 'Destination', 'Intimate', 'Grand Ballroom'];
  const ceremonyTypes = ['Religious', 'Civil', 'Spiritual', 'Interfaith', 'Secular', 'Elopement'];
  const receptionStyles = ['Sit-Down Dinner', 'Cocktail Reception', 'Buffet', 'Family Style', 'Food Stations', 'Brunch', 'Lunch'];
  const cateringStyles = ['Plated Service', 'Buffet', 'Family Style', 'Food Stations', 'Cocktail Style', 'Food Trucks'];
  const menuTypes = ['Plated Multi-Course', 'Buffet', 'Stations', 'Family Style', 'Cocktail Hour Only'];
  const barServices = ['Full Open Bar', 'Beer & Wine Only', 'Signature Cocktails', 'Cash Bar', 'Limited Bar', 'Dry Wedding'];
  const dressCodes = ['Black Tie', 'Black Tie Optional', 'Formal/Cocktail Attire', 'Semi-Formal', 'Dressy Casual', 'Beach Formal', 'Garden Party'];
  const musicTypes = ['Live Band', 'DJ', 'String Quartet', 'Jazz Ensemble', 'Acoustic Duo', 'Playlist/Spotify'];
  const seatingStyles = ['Assigned Seating', 'Open Seating', 'Lounge Style', 'Mix of Both'];
  const headTableTypes = ['Sweetheart Table', 'Head Table (Wedding Party)', 'Kings Table', 'No Head Table'];

  useEffect(() => {
    const formData: TemplateFormData = {
      partner1_name: partner1Name,
      partner2_name: partner2Name,
      wedding_style: weddingStyle,
      ceremony_venue: ceremonyVenue,
      ceremony_type: ceremonyType,
      officiant_name: officiantName,
      ceremony_length: ceremonyLength,
      custom_vows: customVows,
      ceremony_music: ceremonyMusic,
      reception_venue: sameAsceremony ? ceremonyVenue : receptionVenue,
      same_as_ceremony: sameAsceremony,
      reception_style: receptionStyle,
      expected_guest_count: expectedGuestCount,
      catering_style: cateringStyle,
      menu_type: menuType,
      meal_choices: mealChoices,
      bar_service: barService,
      signature_cocktail: signatureCocktail,
      cake_details: cakeDetails,
      dietary_accommodations: dietaryAccommodations,
      wedding_party_size: weddingPartySize,
      bridesmaids_count: bridesmaidsCount,
      groomsmen_count: groomsmenCount,
      flower_girl_ring_bearer: flowerGirlRingBearer,
      color_scheme: colorScheme,
      theme: theme,
      dress_code: dressCode,
      decor_style: decorStyle,
      music_type: musicType,
      band_dj_name: bandDjName,
      first_dance_song: firstDanceSong,
      special_dances: specialDances,
      do_not_play_list: doNotPlayList,
      photographer_name: photographerName,
      photography_package: photographyPackage,
      videographer_name: videographerName,
      photo_booth_included: photoBoothIncluded,
      drone_footage: droneFootage,
      bouquet_toss: bouquetToss,
      garter_toss: gartterToss,
      toasts_speeches: toastsSpeeches,
      grand_entrance: grandEntrance,
      cake_cutting: cakeCutting,
      cultural_traditions: culturalTraditions,
      hotel_blocks: hotelBlocks,
      transportation_provided: transportationProvided,
      transportation_details: transportationDetails,
      childcare_provided: childcareProvided,
      kids_only: kidsOnly,
      registry_links: registryLinks.filter(link => link.trim() !== ''),
      honey_fund_link: honeyFundLink,
      gift_preference: giftPreference,
      seating_style: seatingStyle,
      head_table_type: headTableType,
      guest_table_size: guestTableSize,
    };

    onChange(formData);

    // Validation: At least one partner name required
    const isValid = partner1Name.trim() !== '' || partner2Name.trim() !== '';
    onValidation(isValid);
  }, [
    partner1Name, partner2Name, weddingStyle, ceremonyVenue, ceremonyType, officiantName,
    ceremonyLength, customVows, ceremonyMusic, receptionVenue, sameAsceremony, receptionStyle,
    expectedGuestCount, cateringStyle, menuType, mealChoices, barService, signatureCocktail,
    cakeDetails, dietaryAccommodations, weddingPartySize, bridesmaidsCount, groomsmenCount,
    flowerGirlRingBearer, colorScheme, theme, dressCode, decorStyle, musicType, bandDjName,
    firstDanceSong, specialDances, doNotPlayList, photographerName, photographyPackage,
    videographerName, photoBoothIncluded, droneFootage, bouquetToss, gartterToss, toastsSpeeches,
    grandEntrance, cakeCutting, culturalTraditions, hotelBlocks, transportationProvided,
    transportationDetails, childcareProvided, kidsOnly, registryLinks, honeyFundLink,
    giftPreference, seatingStyle, headTableType, guestTableSize,
  ]);

  const renderChipGroup = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    allowMultiple: boolean = false,
  ) => (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = allowMultiple
          ? selectedValue.split(',').map(v => v.trim()).includes(option)
          : selectedValue === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const addRegistryLink = () => {
    setRegistryLinks([...registryLinks, '']);
  };

  const removeRegistryLink = (index: number) => {
    if (registryLinks.length > 1) {
      const updated = registryLinks.filter((_, i) => i !== index);
      setRegistryLinks(updated);
    }
  };

  const updateRegistryLink = (index: number, value: string) => {
    const updated = [...registryLinks];
    updated[index] = value;
    setRegistryLinks(updated);
  };

  const toggleMealChoice = (meal: string) => {
    if (mealChoices.includes(meal)) {
      setMealChoices(mealChoices.filter(m => m !== meal));
    } else {
      setMealChoices([...mealChoices, meal]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Section 1: Couple Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💑 Couple Information</Text>
        
        <Text style={styles.label}>Partner 1 Name *</Text>
        <TextInput
          style={styles.input}
          value={partner1Name}
          onChangeText={setPartner1Name}
          placeholder="e.g., Sarah Johnson"
        />

        <Text style={styles.label}>Partner 2 Name *</Text>
        <TextInput
          style={styles.input}
          value={partner2Name}
          onChangeText={setPartner2Name}
          placeholder="e.g., Michael Chen"
        />

        <Text style={styles.label}>Wedding Style</Text>
        {renderChipGroup(weddingStyles, weddingStyle, setWeddingStyle)}
      </View>

      {/* Section 2: Ceremony Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⛪ Ceremony Details</Text>
        
        <Text style={styles.label}>Ceremony Venue</Text>
        <TextInput
          style={styles.input}
          value={ceremonyVenue}
          onChangeText={setCeremonyVenue}
          placeholder="e.g., St. Mary's Church, Sunset Beach, The Garden Pavilion"
        />

        <Text style={styles.label}>Ceremony Type</Text>
        {renderChipGroup(ceremonyTypes, ceremonyType, setCeremonyType)}

        <Text style={styles.label}>Officiant Name</Text>
        <TextInput
          style={styles.input}
          value={officiantName}
          onChangeText={setOfficiantName}
          placeholder="e.g., Reverend John Smith"
        />

        <Text style={styles.label}>Ceremony Length</Text>
        <TextInput
          style={styles.input}
          value={ceremonyLength}
          onChangeText={setCeremonyLength}
          placeholder="e.g., 30 minutes"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Custom Vows</Text>
          <Switch
            value={customVows}
            onValueChange={setCustomVows}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={customVows ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <Text style={styles.label}>Ceremony Music Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={ceremonyMusic}
          onChangeText={setCeremonyMusic}
          placeholder="Processional, recessional, unity ceremony music..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Section 3: Reception Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎊 Reception Details</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Same venue as ceremony</Text>
          <Switch
            value={sameAsceremony}
            onValueChange={setSameAsCeremony}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={sameAsceremony ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {!sameAsceremony && (
          <>
            <Text style={styles.label}>Reception Venue</Text>
            <TextInput
              style={styles.input}
              value={receptionVenue}
              onChangeText={setReceptionVenue}
              placeholder="e.g., Grand Ballroom, Vineyard Estate"
            />
          </>
        )}

        <Text style={styles.label}>Reception Style</Text>
        {renderChipGroup(receptionStyles, receptionStyle, setReceptionStyle)}

        <Text style={styles.label}>Expected Guest Count</Text>
        <TextInput
          style={styles.input}
          value={expectedGuestCount}
          onChangeText={setExpectedGuestCount}
          placeholder="e.g., 150 guests"
          keyboardType="numeric"
        />
      </View>

      {/* Section 4: Catering & Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Catering & Menu</Text>
        
        <Text style={styles.label}>Catering Style</Text>
        {renderChipGroup(cateringStyles, cateringStyle, setCateringStyle)}

        <Text style={styles.label}>Menu Type</Text>
        {renderChipGroup(menuTypes, menuType, setMenuType)}

        <Text style={styles.label}>Meal Choices (for plated service)</Text>
        <View style={styles.chipContainer}>
          {['Chicken', 'Beef', 'Fish', 'Vegetarian', 'Vegan'].map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[styles.chip, mealChoices.includes(meal) && styles.chipSelected]}
              onPress={() => toggleMealChoice(meal)}
            >
              <Text style={[styles.chipText, mealChoices.includes(meal) && styles.chipTextSelected]}>
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Bar Service</Text>
        {renderChipGroup(barServices, barService, setBarService)}

        {barService !== 'Dry Wedding' && (
          <>
            <Text style={styles.label}>Signature Cocktail (optional)</Text>
            <TextInput
              style={styles.input}
              value={signatureCocktail}
              onChangeText={setSignatureCocktail}
              placeholder="e.g., Sarah's Sunset Spritz"
            />
          </>
        )}

        <Text style={styles.label}>Wedding Cake Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={cakeDetails}
          onChangeText={setCakeDetails}
          placeholder="Flavors, tiers, design, baker name..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Dietary Accommodations</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={dietaryAccommodations}
          onChangeText={setDietaryAccommodations}
          placeholder="Gluten-free, nut allergies, kosher, halal..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Section 5: Wedding Party */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👰🤵 Wedding Party</Text>
        
        <Text style={styles.label}>Total Wedding Party Size</Text>
        <TextInput
          style={styles.input}
          value={weddingPartySize}
          onChangeText={setWeddingPartySize}
          placeholder="e.g., 10 people"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Number of Bridesmaids/Bridesmen</Text>
        <TextInput
          style={styles.input}
          value={bridesmaidsCount}
          onChangeText={setBridesmaidsCount}
          placeholder="e.g., 5"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Number of Groomsmen/Groomsmaids</Text>
        <TextInput
          style={styles.input}
          value={groomsmenCount}
          onChangeText={setGroomsmenCount}
          placeholder="e.g., 5"
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Flower Girl / Ring Bearer</Text>
          <Switch
            value={flowerGirlRingBearer}
            onValueChange={setFlowerGirlRingBearer}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={flowerGirlRingBearer ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 6: Theme & Decor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Theme & Decor</Text>
        
        <Text style={styles.label}>Color Scheme</Text>
        <TextInput
          style={styles.input}
          value={colorScheme}
          onChangeText={setColorScheme}
          placeholder="e.g., Blush Pink & Gold, Navy & Burgundy"
        />

        <Text style={styles.label}>Theme Details</Text>
        <TextInput
          style={styles.input}
          value={theme}
          onChangeText={setTheme}
          placeholder="e.g., Enchanted Garden, Vintage Romance"
        />

        <Text style={styles.label}>Dress Code</Text>
        {renderChipGroup(dressCodes, dressCode, setDressCode)}

        <Text style={styles.label}>Decor Style Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={decorStyle}
          onChangeText={setDecorStyle}
          placeholder="Centerpieces, lighting, flowers, linens..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Section 7: Entertainment & Music */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎵 Entertainment & Music</Text>
        
        <Text style={styles.label}>Music Type</Text>
        {renderChipGroup(musicTypes, musicType, setMusicType)}

        <Text style={styles.label}>Band/DJ Name</Text>
        <TextInput
          style={styles.input}
          value={bandDjName}
          onChangeText={setBandDjName}
          placeholder="e.g., Elite Events DJ Service"
        />

        <Text style={styles.label}>First Dance Song</Text>
        <TextInput
          style={styles.input}
          value={firstDanceSong}
          onChangeText={setFirstDanceSong}
          placeholder="e.g., 'At Last' by Etta James"
        />

        <Text style={styles.label}>Special Dances</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={specialDances}
          onChangeText={setSpecialDances}
          placeholder="Father-daughter dance, mother-son dance, etc."
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Do Not Play List (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={doNotPlayList}
          onChangeText={setDoNotPlayList}
          placeholder="Songs to avoid..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Section 8: Photography & Videography */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Photography & Videography</Text>
        
        <Text style={styles.label}>Photographer Name</Text>
        <TextInput
          style={styles.input}
          value={photographerName}
          onChangeText={setPhotographerName}
          placeholder="e.g., Jessica Lee Photography"
        />

        <Text style={styles.label}>Photography Package</Text>
        <TextInput
          style={styles.input}
          value={photographyPackage}
          onChangeText={setPhotographyPackage}
          placeholder="e.g., 8 hours, 2 photographers, engagement session"
        />

        <Text style={styles.label}>Videographer Name (optional)</Text>
        <TextInput
          style={styles.input}
          value={videographerName}
          onChangeText={setVideographerName}
          placeholder="e.g., Cinematic Weddings Studio"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Photo Booth Included</Text>
          <Switch
            value={photoBoothIncluded}
            onValueChange={setPhotoBoothIncluded}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={photoBoothIncluded ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Drone Footage</Text>
          <Switch
            value={droneFootage}
            onValueChange={setDroneFootage}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={droneFootage ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 9: Special Events & Traditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Special Events & Traditions</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Bouquet Toss</Text>
          <Switch
            value={bouquetToss}
            onValueChange={setBouquetToss}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={bouquetToss ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Garter Toss</Text>
          <Switch
            value={gartterToss}
            onValueChange={setGarterToss}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={gartterToss ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Grand Entrance</Text>
          <Switch
            value={grandEntrance}
            onValueChange={setGrandEntrance}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={grandEntrance ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Cake Cutting Ceremony</Text>
          <Switch
            value={cakeCutting}
            onValueChange={setCakeCutting}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={cakeCutting ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <Text style={styles.label}>Toasts & Speeches Schedule</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={toastsSpeeches}
          onChangeText={setToastsSpeeches}
          placeholder="Best man, maid of honor, parents..."
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Cultural/Religious Traditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={culturalTraditions}
          onChangeText={setCulturalTraditions}
          placeholder="e.g., Tea ceremony, jumping the broom, hora dance..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Section 10: Guest Accommodations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏨 Guest Accommodations</Text>
        
        <Text style={styles.label}>Hotel Blocks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={hotelBlocks}
          onChangeText={setHotelBlocks}
          placeholder="Hotel names, group codes, room rates..."
          multiline
          numberOfLines={2}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Transportation Provided</Text>
          <Switch
            value={transportationProvided}
            onValueChange={setTransportationProvided}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={transportationProvided ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {transportationProvided && (
          <>
            <Text style={styles.label}>Transportation Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={transportationDetails}
              onChangeText={setTransportationDetails}
              placeholder="Shuttle schedule, pickup locations..."
              multiline
              numberOfLines={2}
            />
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Childcare Provided</Text>
          <Switch
            value={childcareProvided}
            onValueChange={setChildcareProvided}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={childcareProvided ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Adults Only (No Kids)</Text>
          <Switch
            value={kidsOnly}
            onValueChange={setKidsOnly}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={kidsOnly ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 11: Registry & Gifts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Registry & Gifts</Text>
        
        <Text style={styles.label}>Gift Registry Links</Text>
        {registryLinks.map((link, index) => (
          <View key={index} style={styles.arrayInputRow}>
            <TextInput
              style={[styles.input, styles.arrayInput]}
              value={link}
              onChangeText={(text) => updateRegistryLink(index, text)}
              placeholder="https://www.registry-site.com/your-registry"
            />
            {registryLinks.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeRegistryLink(index)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addRegistryLink}>
          <Ionicons name="add-circle" size={20} color="#9333ea" />
          <Text style={styles.addButtonText}>Add Another Registry</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Honeymoon Fund Link (optional)</Text>
        <TextInput
          style={styles.input}
          value={honeyFundLink}
          onChangeText={setHoneyFundLink}
          placeholder="e.g., Honeyfund, Zola cash fund"
        />

        <Text style={styles.label}>Gift Preference Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={giftPreference}
          onChangeText={setGiftPreference}
          placeholder="Your presence is the best present, or other gift preferences..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Section 12: Seating Arrangements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🪑 Seating Arrangements</Text>
        
        <Text style={styles.label}>Seating Style</Text>
        {renderChipGroup(seatingStyles, seatingStyle, setSeatingStyle)}

        <Text style={styles.label}>Head Table Type</Text>
        {renderChipGroup(headTableTypes, headTableType, setHeadTableType)}

        <Text style={styles.label}>Guest Table Size</Text>
        <TextInput
          style={styles.input}
          value={guestTableSize}
          onChangeText={setGuestTableSize}
          placeholder="e.g., 8-10 guests per table"
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrayInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
    borderStyle: 'dashed',
    backgroundColor: '#f9fafb',
  },
  addButtonText: {
    fontSize: 15,
    color: '#9333ea',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
