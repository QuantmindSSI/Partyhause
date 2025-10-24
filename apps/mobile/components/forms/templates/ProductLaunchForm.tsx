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

interface ProductLaunchFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

interface MediaContact {
  id: string;
  name: string;
  outlet: string;
  email: string;
}

export default function ProductLaunchForm({ initialData = {}, onChange, onValidation }: ProductLaunchFormProps) {
  // Product Details
  const [productName, setProductName] = useState(initialData.product_name || '');
  const [productCategory, setProductCategory] = useState(initialData.product_category || '');
  const [productDescription, setProductDescription] = useState(initialData.product_description || '');
  const [productPrice, setProductPrice] = useState(initialData.product_price || '');
  const [launchDate, setLaunchDate] = useState(initialData.launch_date || '');
  const [targetMarket, setTargetMarket] = useState(initialData.target_market || '');
  
  // Launch Event Details
  const [launchVenue, setLaunchVenue] = useState(initialData.launch_venue || '');
  const [launchFormat, setLaunchFormat] = useState<string[]>(initialData.launch_format || []);
  const [expectedAttendees, setExpectedAttendees] = useState(initialData.expected_attendees || '');
  const [vipInvites, setVipInvites] = useState(initialData.vip_invites || '');
  const [livestreaming, setLivestreaming] = useState(initialData.livestreaming || false);
  const [streamingPlatform, setStreamingPlatform] = useState(initialData.streaming_platform || '');
  
  // Product Demonstrations
  const [demoStations, setDemoStations] = useState(initialData.demo_stations || '');
  const [demoSchedule, setDemoSchedule] = useState(initialData.demo_schedule || '');
  const [handsOnDemos, setHandsOnDemos] = useState(initialData.hands_on_demos || false);
  const [productSamples, setProductSamples] = useState(initialData.product_samples || false);
  const [sampleQuantity, setSampleQuantity] = useState(initialData.sample_quantity || '');
  const [interactiveExperiences, setInteractiveExperiences] = useState(initialData.interactive_experiences || '');
  
  // Media & Press
  const [pressRelease, setPressRelease] = useState(initialData.press_release || false);
  const [mediaKit, setMediaKit] = useState(initialData.media_kit || false);
  const [mediaKitContents, setMediaKitContents] = useState<string[]>(initialData.media_kit_contents || []);
  const [pressConference, setPressConference] = useState(initialData.press_conference || false);
  const [pressConferenceTime, setPressConferenceTime] = useState(initialData.press_conference_time || '');
  const [mediaContacts, setMediaContacts] = useState<MediaContact[]>(initialData.media_contacts || []);
  const [exclusiveInterviews, setExclusiveInterviews] = useState(initialData.exclusive_interviews || false);
  
  // Influencer & Social Media
  const [influencerInvites, setInfluencerInvites] = useState(initialData.influencer_invites || '');
  const [influencerTiers, setInfluencerTiers] = useState<string[]>(initialData.influencer_tiers || []);
  const [socialMediaCampaign, setSocialMediaCampaign] = useState(initialData.social_media_campaign || false);
  const [hashtags, setHashtags] = useState(initialData.hashtags || '');
  const [ugcEncouragement, setUgcEncouragement] = useState(initialData.ugc_encouragement || false);
  const [photoOpportunities, setPhotoOpportunities] = useState(initialData.photo_opportunities || '');
  const [socialMediaWall, setSocialMediaWall] = useState(initialData.social_media_wall || false);
  
  // Branding & Decor
  const [brandColors, setBrandColors] = useState(initialData.brand_colors || '');
  const [logoPlacement, setLogoPlacement] = useState<string[]>(initialData.logo_placement || []);
  const [signage, setSignage] = useState(initialData.signage || '');
  const [photoBackdrop, setPhotoBackdrop] = useState(initialData.photo_backdrop || false);
  const [backdropTheme, setBackdropTheme] = useState(initialData.backdrop_theme || '');
  const [productDisplays, setProductDisplays] = useState(initialData.product_displays || '');
  const [lightingDesign, setLightingDesign] = useState(initialData.lighting_design || '');
  
  // Presentation & Entertainment
  const [keynotePresentation, setKeynotePresentation] = useState(initialData.keynote_presentation || false);
  const [keynoteSpeakers, setKeynoteSpeakers] = useState(initialData.keynote_speakers || '');
  const [productVideoPlayback, setProductVideoPlayback] = useState(initialData.product_video_playback || false);
  const [videoLength, setVideoLength] = useState(initialData.video_length || '');
  const [liveEntertainment, setLiveEntertainment] = useState(initialData.live_entertainment || false);
  const [entertainmentType, setEntertainmentType] = useState(initialData.entertainment_type || '');
  const [dj, setDj] = useState(initialData.dj || false);
  const [musicStyle, setMusicStyle] = useState(initialData.music_style || '');
  
  // Catering & Hospitality
  const [cateringStyle, setCateringStyle] = useState(initialData.catering_style || '');
  const [foodOptions, setFoodOptions] = useState<string[]>(initialData.food_options || []);
  const [beverageService, setBeverageService] = useState<string[]>(initialData.beverage_service || []);
  const [dietaryAccommodations, setDietaryAccommodations] = useState(initialData.dietary_accommodations || '');
  const [signatureCocktail, setSignatureCocktail] = useState(initialData.signature_cocktail || false);
  const [cocktailName, setCocktailName] = useState(initialData.cocktail_name || '');
  const [brandedRefreshments, setBrandedRefreshments] = useState(initialData.branded_refreshments || false);
  
  // Giveaways & Swag
  const [swagBags, setSwagBags] = useState(initialData.swag_bags || false);
  const [swagItems, setSwagItems] = useState(initialData.swag_items || '');
  const [brandedMerchandise, setBrandedMerchandise] = useState<string[]>(initialData.branded_merchandise || []);
  const [raffle, setRaffle] = useState(initialData.raffle || false);
  const [rafflePrizes, setRafflePrizes] = useState(initialData.raffle_prizes || '');
  const [exclusiveOffers, setExclusiveOffers] = useState(initialData.exclusive_offers || false);
  const [offerDetails, setOfferDetails] = useState(initialData.offer_details || '');
  const [earlyBirdDiscount, setEarlyBirdDiscount] = useState(initialData.early_bird_discount || '');
  
  // Technology & AV
  const [avSetup, setAvSetup] = useState<string[]>(initialData.av_setup || []);
  const [presentationScreen, setPresentationScreen] = useState(initialData.presentation_screen || false);
  const [screenSize, setScreenSize] = useState(initialData.screen_size || '');
  const [soundSystem, setSoundSystem] = useState(initialData.sound_system || false);
  const [wirelessMics, setWirelessMics] = useState(initialData.wireless_mics || '');
  const [wifiRequired, setWifiRequired] = useState(initialData.wifi_required || false);
  const [wifiCapacity, setWifiCapacity] = useState(initialData.wifi_capacity || '');
  const [chargingStations, setChargingStations] = useState(initialData.charging_stations || false);
  
  // Post-Launch Activities
  const [followUpEmails, setFollowUpEmails] = useState(initialData.follow_up_emails || false);
  const [surveyFeedback, setSurveyFeedback] = useState(initialData.survey_feedback || false);
  const [contentSharing, setContentSharing] = useState(initialData.content_sharing || false);
  const [contentTypes, setContentTypes] = useState<string[]>(initialData.content_types || []);
  const [salesActivation, setSalesActivation] = useState(initialData.sales_activation || false);
  const [salesChannels, setSalesChannels] = useState(initialData.sales_channels || '');
  const [preOrders, setPreOrders] = useState(initialData.pre_orders || false);

  // Multi-select options
  const launchFormatOptions = ['In-Person', 'Virtual', 'Hybrid', 'Pop-Up Store', 'Showroom', 'Trade Show Booth'];
  const mediaKitContentOptions = ['Product Photos', 'Press Release', 'Fact Sheet', 'Executive Bios', 'Product Specs', 'Brand Guidelines', 'B-Roll Footage'];
  const influencerTierOptions = ['Mega (1M+)', 'Macro (100K-1M)', 'Micro (10K-100K)', 'Nano (<10K)'];
  const logoPlacementOptions = ['Entrance', 'Stage Backdrop', 'Demo Stations', 'Swag Bags', 'Catering Stations', 'Photo Backdrop'];
  const foodOptionsList = ['Hors d\'oeuvres', 'Buffet', 'Plated Meal', 'Food Stations', 'Dessert Bar', 'Canapés'];
  const beverageServiceOptions = ['Open Bar', 'Cash Bar', 'Signature Cocktails', 'Wine & Beer', 'Non-Alcoholic Only', 'Coffee/Tea Station'];
  const brandedMerchandiseOptions = ['T-Shirts', 'Tote Bags', 'Water Bottles', 'Notebooks', 'Pens', 'USB Drives', 'Phone Accessories', 'Hats/Caps'];
  const avSetupOptions = ['Microphone', 'Speakers', 'Projector', 'LED Screen', 'Lighting', 'Video Recording', 'Live Streaming Equipment'];
  const contentTypeOptions = ['Photos', 'Videos', 'Recap Article', 'Social Media Posts', 'Press Coverage', 'Testimonials'];

  const toggleLaunchFormat = (format: string) => {
    setLaunchFormat(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleMediaKitContent = (content: string) => {
    setMediaKitContents(prev => 
      prev.includes(content) ? prev.filter(c => c !== content) : [...prev, content]
    );
  };

  const toggleInfluencerTier = (tier: string) => {
    setInfluencerTiers(prev => 
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const toggleLogoPlacement = (placement: string) => {
    setLogoPlacement(prev => 
      prev.includes(placement) ? prev.filter(p => p !== placement) : [...prev, placement]
    );
  };

  const toggleFoodOption = (option: string) => {
    setFoodOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const toggleBeverageService = (service: string) => {
    setBeverageService(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const toggleBrandedMerchandise = (item: string) => {
    setBrandedMerchandise(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleAvSetup = (equipment: string) => {
    setAvSetup(prev => 
      prev.includes(equipment) ? prev.filter(e => e !== equipment) : [...prev, equipment]
    );
  };

  const toggleContentType = (type: string) => {
    setContentTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addMediaContact = () => {
    const newContact: MediaContact = {
      id: Date.now().toString(),
      name: '',
      outlet: '',
      email: '',
    };
    setMediaContacts([...mediaContacts, newContact]);
  };

  const removeMediaContact = (id: string) => {
    setMediaContacts(mediaContacts.filter(contact => contact.id !== id));
  };

  const updateMediaContact = (id: string, field: keyof MediaContact, value: string) => {
    setMediaContacts(mediaContacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  useEffect(() => {
    const formData: TemplateFormData = {
      // Product Details
      product_name: productName,
      product_category: productCategory,
      product_description: productDescription,
      product_price: productPrice,
      launch_date: launchDate,
      target_market: targetMarket,
      
      // Launch Event Details
      launch_venue: launchVenue,
      launch_format: launchFormat,
      expected_attendees: expectedAttendees,
      vip_invites: vipInvites,
      livestreaming: livestreaming,
      streaming_platform: streamingPlatform,
      
      // Product Demonstrations
      demo_stations: demoStations,
      demo_schedule: demoSchedule,
      hands_on_demos: handsOnDemos,
      product_samples: productSamples,
      sample_quantity: sampleQuantity,
      interactive_experiences: interactiveExperiences,
      
      // Media & Press
      press_release: pressRelease,
      media_kit: mediaKit,
      media_kit_contents: mediaKitContents,
      press_conference: pressConference,
      press_conference_time: pressConferenceTime,
      media_contacts: mediaContacts,
      exclusive_interviews: exclusiveInterviews,
      
      // Influencer & Social Media
      influencer_invites: influencerInvites,
      influencer_tiers: influencerTiers,
      social_media_campaign: socialMediaCampaign,
      hashtags: hashtags,
      ugc_encouragement: ugcEncouragement,
      photo_opportunities: photoOpportunities,
      social_media_wall: socialMediaWall,
      
      // Branding & Decor
      brand_colors: brandColors,
      logo_placement: logoPlacement,
      signage: signage,
      photo_backdrop: photoBackdrop,
      backdrop_theme: backdropTheme,
      product_displays: productDisplays,
      lighting_design: lightingDesign,
      
      // Presentation & Entertainment
      keynote_presentation: keynotePresentation,
      keynote_speakers: keynoteSpeakers,
      product_video_playback: productVideoPlayback,
      video_length: videoLength,
      live_entertainment: liveEntertainment,
      entertainment_type: entertainmentType,
      dj: dj,
      music_style: musicStyle,
      
      // Catering & Hospitality
      catering_style: cateringStyle,
      food_options: foodOptions,
      beverage_service: beverageService,
      dietary_accommodations: dietaryAccommodations,
      signature_cocktail: signatureCocktail,
      cocktail_name: cocktailName,
      branded_refreshments: brandedRefreshments,
      
      // Giveaways & Swag
      swag_bags: swagBags,
      swag_items: swagItems,
      branded_merchandise: brandedMerchandise,
      raffle: raffle,
      raffle_prizes: rafflePrizes,
      exclusive_offers: exclusiveOffers,
      offer_details: offerDetails,
      early_bird_discount: earlyBirdDiscount,
      
      // Technology & AV
      av_setup: avSetup,
      presentation_screen: presentationScreen,
      screen_size: screenSize,
      sound_system: soundSystem,
      wireless_mics: wirelessMics,
      wifi_required: wifiRequired,
      wifi_capacity: wifiCapacity,
      charging_stations: chargingStations,
      
      // Post-Launch Activities
      follow_up_emails: followUpEmails,
      survey_feedback: surveyFeedback,
      content_sharing: contentSharing,
      content_types: contentTypes,
      sales_activation: salesActivation,
      sales_channels: salesChannels,
      pre_orders: preOrders,
    };

    onChange(formData);

    // Validation: Product name required
    const isValid = productName.trim().length > 0;
    onValidation(isValid);
  }, [
    productName, productCategory, productDescription, productPrice, launchDate, targetMarket,
    launchVenue, launchFormat, expectedAttendees, vipInvites, livestreaming, streamingPlatform,
    demoStations, demoSchedule, handsOnDemos, productSamples, sampleQuantity, interactiveExperiences,
    pressRelease, mediaKit, mediaKitContents, pressConference, pressConferenceTime, mediaContacts, exclusiveInterviews,
    influencerInvites, influencerTiers, socialMediaCampaign, hashtags, ugcEncouragement, photoOpportunities, socialMediaWall,
    brandColors, logoPlacement, signage, photoBackdrop, backdropTheme, productDisplays, lightingDesign,
    keynotePresentation, keynoteSpeakers, productVideoPlayback, videoLength, liveEntertainment, entertainmentType, dj, musicStyle,
    cateringStyle, foodOptions, beverageService, dietaryAccommodations, signatureCocktail, cocktailName, brandedRefreshments,
    swagBags, swagItems, brandedMerchandise, raffle, rafflePrizes, exclusiveOffers, offerDetails, earlyBirdDiscount,
    avSetup, presentationScreen, screenSize, soundSystem, wirelessMics, wifiRequired, wifiCapacity, chargingStations,
    followUpEmails, surveyFeedback, contentSharing, contentTypes, salesActivation, salesChannels, preOrders,
  ]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Product Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter product name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Category</Text>
          <TextInput
            style={styles.input}
            value={productCategory}
            onChangeText={setProductCategory}
            placeholder="e.g., Tech, Fashion, Food & Beverage"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={productDescription}
            onChangeText={setProductDescription}
            placeholder="Brief product description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Price</Text>
          <TextInput
            style={styles.input}
            value={productPrice}
            onChangeText={setProductPrice}
            placeholder="$0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Launch Date</Text>
          <TextInput
            style={styles.input}
            value={launchDate}
            onChangeText={setLaunchDate}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Market</Text>
          <TextInput
            style={styles.input}
            value={targetMarket}
            onChangeText={setTargetMarket}
            placeholder="e.g., Millennials, Tech Professionals, Health Conscious"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Launch Event Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Launch Event Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Launch Venue</Text>
          <TextInput
            style={styles.input}
            value={launchVenue}
            onChangeText={setLaunchVenue}
            placeholder="Enter venue name or address"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Launch Format</Text>
          <View style={styles.chipContainer}>
            {launchFormatOptions.map(format => (
              <TouchableOpacity
                key={format}
                style={[styles.chip, launchFormat.includes(format) && styles.chipSelected]}
                onPress={() => toggleLaunchFormat(format)}
              >
                <Text style={[styles.chipText, launchFormat.includes(format) && styles.chipTextSelected]}>
                  {format}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Attendees</Text>
          <TextInput
            style={styles.input}
            value={expectedAttendees}
            onChangeText={setExpectedAttendees}
            placeholder="Number of attendees"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>VIP Invites</Text>
          <TextInput
            style={styles.input}
            value={vipInvites}
            onChangeText={setVipInvites}
            placeholder="Number of VIP guests"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Livestreaming</Text>
          <Switch
            value={livestreaming}
            onValueChange={setLivestreaming}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={livestreaming ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {livestreaming && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Streaming Platform</Text>
            <TextInput
              style={styles.input}
              value={streamingPlatform}
              onChangeText={setStreamingPlatform}
              placeholder="e.g., YouTube, Facebook Live, Zoom"
              placeholderTextColor="#999"
            />
          </View>
        )}
      </View>

      {/* Product Demonstrations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Demonstrations</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Demo Stations</Text>
          <TextInput
            style={styles.input}
            value={demoStations}
            onChangeText={setDemoStations}
            placeholder="Number of demo stations"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Demo Schedule</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={demoSchedule}
            onChangeText={setDemoSchedule}
            placeholder="e.g., Every 30 minutes, 10am-4pm"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Hands-On Demos</Text>
          <Switch
            value={handsOnDemos}
            onValueChange={setHandsOnDemos}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={handsOnDemos ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Product Samples</Text>
          <Switch
            value={productSamples}
            onValueChange={setProductSamples}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={productSamples ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {productSamples && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sample Quantity</Text>
            <TextInput
              style={styles.input}
              value={sampleQuantity}
              onChangeText={setSampleQuantity}
              placeholder="Number of samples to distribute"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interactive Experiences</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={interactiveExperiences}
            onChangeText={setInteractiveExperiences}
            placeholder="e.g., AR/VR demos, Photo booth, Games"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Media & Press Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media & Press</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Press Release</Text>
          <Switch
            value={pressRelease}
            onValueChange={setPressRelease}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={pressRelease ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Media Kit</Text>
          <Switch
            value={mediaKit}
            onValueChange={setMediaKit}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={mediaKit ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {mediaKit && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Media Kit Contents</Text>
            <View style={styles.chipContainer}>
              {mediaKitContentOptions.map(content => (
                <TouchableOpacity
                  key={content}
                  style={[styles.chip, mediaKitContents.includes(content) && styles.chipSelected]}
                  onPress={() => toggleMediaKitContent(content)}
                >
                  <Text style={[styles.chipText, mediaKitContents.includes(content) && styles.chipTextSelected]}>
                    {content}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Press Conference</Text>
          <Switch
            value={pressConference}
            onValueChange={setPressConference}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={pressConference ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {pressConference && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Press Conference Time</Text>
            <TextInput
              style={styles.input}
              value={pressConferenceTime}
              onChangeText={setPressConferenceTime}
              placeholder="e.g., 10:00 AM"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Media Contacts</Text>
            <TouchableOpacity onPress={addMediaContact} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {mediaContacts.map((contact, index) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactNumber}>Contact {index + 1}</Text>
                <TouchableOpacity onPress={() => removeMediaContact(contact.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                value={contact.name}
                onChangeText={(text) => updateMediaContact(contact.id, 'name', text)}
                placeholder="Contact name"
                placeholderTextColor="#999"
              />
              
              <TextInput
                style={styles.input}
                value={contact.outlet}
                onChangeText={(text) => updateMediaContact(contact.id, 'outlet', text)}
                placeholder="Media outlet"
                placeholderTextColor="#999"
              />
              
              <TextInput
                style={styles.input}
                value={contact.email}
                onChangeText={(text) => updateMediaContact(contact.id, 'email', text)}
                placeholder="Email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Exclusive Interviews</Text>
          <Switch
            value={exclusiveInterviews}
            onValueChange={setExclusiveInterviews}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={exclusiveInterviews ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Influencer & Social Media Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Influencer & Social Media</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Influencer Invites</Text>
          <TextInput
            style={styles.input}
            value={influencerInvites}
            onChangeText={setInfluencerInvites}
            placeholder="Number of influencers to invite"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Influencer Tiers</Text>
          <View style={styles.chipContainer}>
            {influencerTierOptions.map(tier => (
              <TouchableOpacity
                key={tier}
                style={[styles.chip, influencerTiers.includes(tier) && styles.chipSelected]}
                onPress={() => toggleInfluencerTier(tier)}
              >
                <Text style={[styles.chipText, influencerTiers.includes(tier) && styles.chipTextSelected]}>
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Social Media Campaign</Text>
          <Switch
            value={socialMediaCampaign}
            onValueChange={setSocialMediaCampaign}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={socialMediaCampaign ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hashtags</Text>
          <TextInput
            style={styles.input}
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="e.g., #ProductLaunch #Innovation"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>UGC Encouragement</Text>
          <Switch
            value={ugcEncouragement}
            onValueChange={setUgcEncouragement}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={ugcEncouragement ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photo Opportunities</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={photoOpportunities}
            onChangeText={setPhotoOpportunities}
            placeholder="Describe Instagram-worthy moments"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Social Media Wall</Text>
          <Switch
            value={socialMediaWall}
            onValueChange={setSocialMediaWall}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={socialMediaWall ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Branding & Decor Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Branding & Decor</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand Colors</Text>
          <TextInput
            style={styles.input}
            value={brandColors}
            onChangeText={setBrandColors}
            placeholder="e.g., Navy Blue, Gold, White"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Logo Placement</Text>
          <View style={styles.chipContainer}>
            {logoPlacementOptions.map(placement => (
              <TouchableOpacity
                key={placement}
                style={[styles.chip, logoPlacement.includes(placement) && styles.chipSelected]}
                onPress={() => toggleLogoPlacement(placement)}
              >
                <Text style={[styles.chipText, logoPlacement.includes(placement) && styles.chipTextSelected]}>
                  {placement}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Signage</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={signage}
            onChangeText={setSignage}
            placeholder="Describe signage needs"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Photo Backdrop</Text>
          <Switch
            value={photoBackdrop}
            onValueChange={setPhotoBackdrop}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={photoBackdrop ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {photoBackdrop && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Backdrop Theme</Text>
            <TextInput
              style={styles.input}
              value={backdropTheme}
              onChangeText={setBackdropTheme}
              placeholder="e.g., Product-themed, Brand colors"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Displays</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={productDisplays}
            onChangeText={setProductDisplays}
            placeholder="Describe product display requirements"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lighting Design</Text>
          <TextInput
            style={styles.input}
            value={lightingDesign}
            onChangeText={setLightingDesign}
            placeholder="e.g., Spotlights on products, Ambient mood lighting"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Presentation & Entertainment Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presentation & Entertainment</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Keynote Presentation</Text>
          <Switch
            value={keynotePresentation}
            onValueChange={setKeynotePresentation}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={keynotePresentation ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {keynotePresentation && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Keynote Speakers</Text>
            <TextInput
              style={styles.input}
              value={keynoteSpeakers}
              onChangeText={setKeynoteSpeakers}
              placeholder="Names of speakers"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Product Video Playback</Text>
          <Switch
            value={productVideoPlayback}
            onValueChange={setProductVideoPlayback}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={productVideoPlayback ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {productVideoPlayback && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Video Length</Text>
            <TextInput
              style={styles.input}
              value={videoLength}
              onChangeText={setVideoLength}
              placeholder="e.g., 2 minutes"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Live Entertainment</Text>
          <Switch
            value={liveEntertainment}
            onValueChange={setLiveEntertainment}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={liveEntertainment ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {liveEntertainment && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Entertainment Type</Text>
            <TextInput
              style={styles.input}
              value={entertainmentType}
              onChangeText={setEntertainmentType}
              placeholder="e.g., Live band, Magician, Dancers"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>DJ</Text>
          <Switch
            value={dj}
            onValueChange={setDj}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={dj ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {dj && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Music Style</Text>
            <TextInput
              style={styles.input}
              value={musicStyle}
              onChangeText={setMusicStyle}
              placeholder="e.g., Electronic, Pop, Jazz"
              placeholderTextColor="#999"
            />
          </View>
        )}
      </View>

      {/* Catering & Hospitality Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catering & Hospitality</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catering Style</Text>
          <TextInput
            style={styles.input}
            value={cateringStyle}
            onChangeText={setCateringStyle}
            placeholder="e.g., Cocktail reception, Sit-down dinner"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Food Options</Text>
          <View style={styles.chipContainer}>
            {foodOptionsList.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, foodOptions.includes(option) && styles.chipSelected]}
                onPress={() => toggleFoodOption(option)}
              >
                <Text style={[styles.chipText, foodOptions.includes(option) && styles.chipTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Beverage Service</Text>
          <View style={styles.chipContainer}>
            {beverageServiceOptions.map(service => (
              <TouchableOpacity
                key={service}
                style={[styles.chip, beverageService.includes(service) && styles.chipSelected]}
                onPress={() => toggleBeverageService(service)}
              >
                <Text style={[styles.chipText, beverageService.includes(service) && styles.chipTextSelected]}>
                  {service}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dietary Accommodations</Text>
          <TextInput
            style={styles.input}
            value={dietaryAccommodations}
            onChangeText={setDietaryAccommodations}
            placeholder="e.g., Vegan, Gluten-free, Kosher"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Signature Cocktail</Text>
          <Switch
            value={signatureCocktail}
            onValueChange={setSignatureCocktail}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={signatureCocktail ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {signatureCocktail && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cocktail Name</Text>
            <TextInput
              style={styles.input}
              value={cocktailName}
              onChangeText={setCocktailName}
              placeholder="Name of signature cocktail"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Branded Refreshments</Text>
          <Switch
            value={brandedRefreshments}
            onValueChange={setBrandedRefreshments}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={brandedRefreshments ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Giveaways & Swag Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giveaways & Swag</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Swag Bags</Text>
          <Switch
            value={swagBags}
            onValueChange={setSwagBags}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={swagBags ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {swagBags && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Swag Items</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={swagItems}
              onChangeText={setSwagItems}
              placeholder="List items in swag bag"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branded Merchandise</Text>
          <View style={styles.chipContainer}>
            {brandedMerchandiseOptions.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, brandedMerchandise.includes(item) && styles.chipSelected]}
                onPress={() => toggleBrandedMerchandise(item)}
              >
                <Text style={[styles.chipText, brandedMerchandise.includes(item) && styles.chipTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Raffle</Text>
          <Switch
            value={raffle}
            onValueChange={setRaffle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={raffle ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {raffle && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Raffle Prizes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rafflePrizes}
              onChangeText={setRafflePrizes}
              placeholder="List raffle prizes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Exclusive Offers</Text>
          <Switch
            value={exclusiveOffers}
            onValueChange={setExclusiveOffers}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={exclusiveOffers ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {exclusiveOffers && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Offer Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={offerDetails}
              onChangeText={setOfferDetails}
              placeholder="Describe exclusive offer for attendees"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Early Bird Discount</Text>
          <TextInput
            style={styles.input}
            value={earlyBirdDiscount}
            onChangeText={setEarlyBirdDiscount}
            placeholder="e.g., 20% off for first 100 buyers"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Technology & AV Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technology & AV</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>AV Setup Required</Text>
          <View style={styles.chipContainer}>
            {avSetupOptions.map(equipment => (
              <TouchableOpacity
                key={equipment}
                style={[styles.chip, avSetup.includes(equipment) && styles.chipSelected]}
                onPress={() => toggleAvSetup(equipment)}
              >
                <Text style={[styles.chipText, avSetup.includes(equipment) && styles.chipTextSelected]}>
                  {equipment}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Presentation Screen</Text>
          <Switch
            value={presentationScreen}
            onValueChange={setPresentationScreen}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={presentationScreen ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {presentationScreen && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Screen Size</Text>
            <TextInput
              style={styles.input}
              value={screenSize}
              onChangeText={setScreenSize}
              placeholder="e.g., 10ft x 8ft"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Sound System</Text>
          <Switch
            value={soundSystem}
            onValueChange={setSoundSystem}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={soundSystem ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {soundSystem && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wireless Mics</Text>
            <TextInput
              style={styles.input}
              value={wirelessMics}
              onChangeText={setWirelessMics}
              placeholder="Number of wireless microphones"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>WiFi Required</Text>
          <Switch
            value={wifiRequired}
            onValueChange={setWifiRequired}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={wifiRequired ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {wifiRequired && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WiFi Capacity</Text>
            <TextInput
              style={styles.input}
              value={wifiCapacity}
              onChangeText={setWifiCapacity}
              placeholder="Expected number of connected devices"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Charging Stations</Text>
          <Switch
            value={chargingStations}
            onValueChange={setChargingStations}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={chargingStations ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Post-Launch Activities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Post-Launch Activities</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Follow-Up Emails</Text>
          <Switch
            value={followUpEmails}
            onValueChange={setFollowUpEmails}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={followUpEmails ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Survey Feedback</Text>
          <Switch
            value={surveyFeedback}
            onValueChange={setSurveyFeedback}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={surveyFeedback ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Content Sharing</Text>
          <Switch
            value={contentSharing}
            onValueChange={setContentSharing}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={contentSharing ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {contentSharing && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content Types to Share</Text>
            <View style={styles.chipContainer}>
              {contentTypeOptions.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, contentTypes.includes(type) && styles.chipSelected]}
                  onPress={() => toggleContentType(type)}
                >
                  <Text style={[styles.chipText, contentTypes.includes(type) && styles.chipTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Sales Activation</Text>
          <Switch
            value={salesActivation}
            onValueChange={setSalesActivation}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={salesActivation ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {salesActivation && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sales Channels</Text>
            <TextInput
              style={styles.input}
              value={salesChannels}
              onChangeText={setSalesChannels}
              placeholder="e.g., Website, Amazon, Retail stores"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Pre-Orders</Text>
          <Switch
            value={preOrders}
            onValueChange={setPreOrders}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={preOrders ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>
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
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 4,
  },
  contactCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
