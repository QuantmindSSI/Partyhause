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

interface ConferenceFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

export default function ConferenceForm({ initialData = {}, onChange, onValidation }: ConferenceFormProps) {
  // Conference Basics
  const [conferenceName, setConferenceName] = useState(initialData.conference_name || '');
  const [conferenceType, setConferenceType] = useState(initialData.conference_type || '');
  const [industry, setIndustry] = useState(initialData.industry || '');
  const [expectedAttendees, setExpectedAttendees] = useState(initialData.expected_attendees || '');
  const [targetAudience, setTargetAudience] = useState(initialData.target_audience || '');
  
  // Venue & Format
  const [venueType, setVenueType] = useState(initialData.venue_type || '');
  const [venueName, setVenueName] = useState(initialData.venue_name || '');
  const [conferenceFormat, setConferenceFormat] = useState(initialData.conference_format || '');
  const [numberOfDays, setNumberOfDays] = useState(initialData.number_of_days || '');
  const [hybridEvent, setHybridEvent] = useState(initialData.hybrid_event || false);
  const [virtualPlatform, setVirtualPlatform] = useState(initialData.virtual_platform || '');
  
  // Sessions & Tracks
  const [numberOfTracks, setNumberOfTracks] = useState(initialData.number_of_tracks || '');
  const [trackNames, setTrackNames] = useState(initialData.track_names || '');
  const [sessionTypes, setSessionTypes] = useState<string[]>(initialData.session_types || []);
  const [breakoutRooms, setBreakoutRooms] = useState(initialData.breakout_rooms || '');
  const [workshopSessions, setWorkshopSessions] = useState(initialData.workshop_sessions || false);
  const [panelDiscussions, setPanelDiscussions] = useState(initialData.panel_discussions || false);
  
  // Speakers & Presenters
  const [keynoteCount, setKeynoteCount] = useState(initialData.keynote_count || '');
  const [keynoteSpeakers, setKeynoteSpeakers] = useState(initialData.keynote_speakers || '');
  const [sessionSpeakers, setSessionSpeakers] = useState(initialData.session_speakers || '');
  const [speakerSubmissions, setSpeakerSubmissions] = useState(initialData.speaker_submissions || false);
  const [qaSessions, setQaSessions] = useState(initialData.qa_sessions || false);
  
  // Registration & Badges
  const [registrationTiers, setRegistrationTiers] = useState<string[]>(initialData.registration_tiers || []);
  const [earlyBirdPricing, setEarlyBirdPricing] = useState(initialData.early_bird_pricing || false);
  const [badgeTypes, setBadgeTypes] = useState(initialData.badge_types || '');
  const [checkInMethod, setCheckInMethod] = useState(initialData.check_in_method || '');
  const [nameBadgePrinting, setNameBadgePrinting] = useState(initialData.name_badge_printing || false);
  
  // CEU & Certifications
  const [ceuOffered, setCeuOffered] = useState(initialData.ceu_offered || false);
  const [ceuProvider, setCeuProvider] = useState(initialData.ceu_provider || '');
  const [ceuCredits, setCeuCredits] = useState(initialData.ceu_credits || '');
  const [certificateOfAttendance, setCertificateOfAttendance] = useState(initialData.certificate_of_attendance || false);
  const [attendanceTracking, setAttendanceTracking] = useState(initialData.attendance_tracking || '');
  
  // Meals & Catering
  const [mealsIncluded, setMealsIncluded] = useState<string[]>(initialData.meals_included || []);
  const [cateringStyle, setCateringStyle] = useState(initialData.catering_style || '');
  const [dietaryOptions, setDietaryOptions] = useState(initialData.dietary_options || '');
  const [beverageService, setBeverageService] = useState(initialData.beverage_service || '');
  const [networkingReceptions, setNetworkingReceptions] = useState(initialData.networking_receptions || false);
  
  // Networking & Activities
  const [networkingBreaks, setNetworkingBreaks] = useState(initialData.networking_breaks || false);
  const [exhibitHall, setExhibitHall] = useState(initialData.exhibit_hall || false);
  const [boothCount, setBoothCount] = useState(initialData.booth_count || '');
  const [sponsorOpportunities, setSponsorOpportunities] = useState(initialData.sponsor_opportunities || '');
  const [meetingRooms, setMeetingRooms] = useState(initialData.meeting_rooms || false);
  const [socialEvents, setSocialEvents] = useState(initialData.social_events || '');
  
  // Technology & AV
  const [conferenceApp, setConferenceApp] = useState(initialData.conference_app || false);
  const [appFeatures, setAppFeatures] = useState(initialData.app_features || '');
  const [liveStreaming, setLiveStreaming] = useState(initialData.live_streaming || false);
  const [sessionRecording, setSessionRecording] = useState(initialData.session_recording || false);
  const [avRequirements, setAvRequirements] = useState(initialData.av_requirements || '');
  const [wifiAvailable, setWifiAvailable] = useState(initialData.wifi_available || false);

  const conferenceTypes = ['Academic', 'Industry/Professional', 'Trade Show', 'Summit', 'Symposium', 'Workshop Series', 'Annual Meeting', 'User Conference'];
  const venueTypes = ['Convention Center', 'Hotel Conference Center', 'University Campus', 'Corporate Campus', 'Resort', 'Virtual Only', 'Hybrid'];
  const formats = ['Single Track', 'Multi-Track', 'Unconference', 'Workshop-Focused', 'Exhibition-Focused', 'Hybrid Sessions'];
  const sessionTypeOptions = ['Keynote', 'Panel Discussion', 'Workshop', 'Lightning Talk', 'Poster Session', 'Demo', 'Roundtable', 'Networking Session'];
  const registrationTierOptions = ['Early Bird', 'Standard', 'Late Registration', 'Student/Academic', 'VIP', 'Speaker', 'Exhibitor', 'Virtual Only'];
  const checkInMethods = ['QR Code Scan', 'RFID Badge', 'Mobile App Check-in', 'Manual Badge Pickup', 'Self-Service Kiosk'];
  const mealOptions = ['Breakfast', 'Morning Coffee Break', 'Lunch', 'Afternoon Coffee Break', 'Dinner', 'Welcome Reception', 'Closing Reception'];

  useEffect(() => {
    const formData: TemplateFormData = {
      conference_name: conferenceName,
      conference_type: conferenceType,
      industry: industry,
      expected_attendees: expectedAttendees,
      target_audience: targetAudience,
      venue_type: venueType,
      venue_name: venueName,
      conference_format: conferenceFormat,
      number_of_days: numberOfDays,
      hybrid_event: hybridEvent,
      virtual_platform: virtualPlatform,
      number_of_tracks: numberOfTracks,
      track_names: trackNames,
      session_types: sessionTypes,
      breakout_rooms: breakoutRooms,
      workshop_sessions: workshopSessions,
      panel_discussions: panelDiscussions,
      keynote_count: keynoteCount,
      keynote_speakers: keynoteSpeakers,
      session_speakers: sessionSpeakers,
      speaker_submissions: speakerSubmissions,
      qa_sessions: qaSessions,
      registration_tiers: registrationTiers,
      early_bird_pricing: earlyBirdPricing,
      badge_types: badgeTypes,
      check_in_method: checkInMethod,
      name_badge_printing: nameBadgePrinting,
      ceu_offered: ceuOffered,
      ceu_provider: ceuProvider,
      ceu_credits: ceuCredits,
      certificate_of_attendance: certificateOfAttendance,
      attendance_tracking: attendanceTracking,
      meals_included: mealsIncluded,
      catering_style: cateringStyle,
      dietary_options: dietaryOptions,
      beverage_service: beverageService,
      networking_receptions: networkingReceptions,
      networking_breaks: networkingBreaks,
      exhibit_hall: exhibitHall,
      booth_count: boothCount,
      sponsor_opportunities: sponsorOpportunities,
      meeting_rooms: meetingRooms,
      social_events: socialEvents,
      conference_app: conferenceApp,
      app_features: appFeatures,
      live_streaming: liveStreaming,
      session_recording: sessionRecording,
      av_requirements: avRequirements,
      wifi_available: wifiAvailable,
    };

    onChange(formData);

    // Validation: Conference name required
    const isValid = conferenceName.trim() !== '';
    onValidation(isValid);
  }, [
    conferenceName, conferenceType, industry, expectedAttendees, targetAudience, venueType,
    venueName, conferenceFormat, numberOfDays, hybridEvent, virtualPlatform, numberOfTracks,
    trackNames, sessionTypes, breakoutRooms, workshopSessions, panelDiscussions, keynoteCount,
    keynoteSpeakers, sessionSpeakers, speakerSubmissions, qaSessions, registrationTiers,
    earlyBirdPricing, badgeTypes, checkInMethod, nameBadgePrinting, ceuOffered, ceuProvider,
    ceuCredits, certificateOfAttendance, attendanceTracking, mealsIncluded, cateringStyle,
    dietaryOptions, beverageService, networkingReceptions, networkingBreaks, exhibitHall,
    boothCount, sponsorOpportunities, meetingRooms, socialEvents, conferenceApp, appFeatures,
    liveStreaming, sessionRecording, avRequirements, wifiAvailable,
  ]);

  const renderChipGroup = (
    options: string[],
    selectedValue: string | string[],
    onSelect: (value: string) => void,
    allowMultiple: boolean = false,
  ) => (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = allowMultiple
          ? Array.isArray(selectedValue) && selectedValue.includes(option)
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

  const toggleSessionType = (type: string) => {
    if (sessionTypes.includes(type)) {
      setSessionTypes(sessionTypes.filter(t => t !== type));
    } else {
      setSessionTypes([...sessionTypes, type]);
    }
  };

  const toggleRegistrationTier = (tier: string) => {
    if (registrationTiers.includes(tier)) {
      setRegistrationTiers(registrationTiers.filter(t => t !== tier));
    } else {
      setRegistrationTiers([...registrationTiers, tier]);
    }
  };

  const toggleMeal = (meal: string) => {
    if (mealsIncluded.includes(meal)) {
      setMealsIncluded(mealsIncluded.filter(m => m !== meal));
    } else {
      setMealsIncluded([...mealsIncluded, meal]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Section 1: Conference Basics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Conference Basics</Text>
        
        <Text style={styles.label}>Conference Name *</Text>
        <TextInput
          style={styles.input}
          value={conferenceName}
          onChangeText={setConferenceName}
          placeholder="e.g., TechSummit 2025"
        />

        <Text style={styles.label}>Conference Type</Text>
        {renderChipGroup(conferenceTypes, conferenceType, setConferenceType)}

        <Text style={styles.label}>Industry/Field</Text>
        <TextInput
          style={styles.input}
          value={industry}
          onChangeText={setIndustry}
          placeholder="e.g., Technology, Healthcare, Education"
        />

        <Text style={styles.label}>Expected Attendees</Text>
        <TextInput
          style={styles.input}
          value={expectedAttendees}
          onChangeText={setExpectedAttendees}
          placeholder="e.g., 500-1000 attendees"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Target Audience</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={targetAudience}
          onChangeText={setTargetAudience}
          placeholder="Professionals, students, researchers, executives..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Section 2: Venue & Format */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Venue & Format</Text>
        
        <Text style={styles.label}>Venue Type</Text>
        {renderChipGroup(venueTypes, venueType, setVenueType)}

        <Text style={styles.label}>Venue Name</Text>
        <TextInput
          style={styles.input}
          value={venueName}
          onChangeText={setVenueName}
          placeholder="e.g., San Francisco Convention Center"
        />

        <Text style={styles.label}>Conference Format</Text>
        {renderChipGroup(formats, conferenceFormat, setConferenceFormat)}

        <Text style={styles.label}>Number of Days</Text>
        <TextInput
          style={styles.input}
          value={numberOfDays}
          onChangeText={setNumberOfDays}
          placeholder="e.g., 3 days"
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Hybrid Event (In-person + Virtual)</Text>
          <Switch
            value={hybridEvent}
            onValueChange={setHybridEvent}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={hybridEvent ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {hybridEvent && (
          <>
            <Text style={styles.label}>Virtual Platform</Text>
            <TextInput
              style={styles.input}
              value={virtualPlatform}
              onChangeText={setVirtualPlatform}
              placeholder="e.g., Zoom, Hopin, vFairs"
            />
          </>
        )}
      </View>

      {/* Section 3: Sessions & Tracks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Sessions & Tracks</Text>
        
        <Text style={styles.label}>Number of Tracks (Concurrent Sessions)</Text>
        <TextInput
          style={styles.input}
          value={numberOfTracks}
          onChangeText={setNumberOfTracks}
          placeholder="e.g., 4 tracks"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Track Names</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={trackNames}
          onChangeText={setTrackNames}
          placeholder="e.g., AI & Machine Learning, Cloud Infrastructure, Security, DevOps"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Session Types (Multi-Select)</Text>
        <View style={styles.chipContainer}>
          {sessionTypeOptions.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, sessionTypes.includes(type) && styles.chipSelected]}
              onPress={() => toggleSessionType(type)}
            >
              <Text style={[styles.chipText, sessionTypes.includes(type) && styles.chipTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Number of Breakout Rooms</Text>
        <TextInput
          style={styles.input}
          value={breakoutRooms}
          onChangeText={setBreakoutRooms}
          placeholder="e.g., 6 rooms"
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Workshop Sessions</Text>
          <Switch
            value={workshopSessions}
            onValueChange={setWorkshopSessions}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={workshopSessions ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Panel Discussions</Text>
          <Switch
            value={panelDiscussions}
            onValueChange={setPanelDiscussions}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={panelDiscussions ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 4: Speakers & Presenters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎤 Speakers & Presenters</Text>
        
        <Text style={styles.label}>Number of Keynote Sessions</Text>
        <TextInput
          style={styles.input}
          value={keynoteCount}
          onChangeText={setKeynoteCount}
          placeholder="e.g., 3 keynotes"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Keynote Speakers</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={keynoteSpeakers}
          onChangeText={setKeynoteSpeakers}
          placeholder="Dr. Jane Smith (AI Expert), John Doe (CEO, TechCorp)..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Session Speakers/Presenters</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={sessionSpeakers}
          onChangeText={setSessionSpeakers}
          placeholder="List of confirmed speakers and their session topics..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Open Speaker Submissions</Text>
          <Switch
            value={speakerSubmissions}
            onValueChange={setSpeakerSubmissions}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={speakerSubmissions ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Q&A Sessions After Presentations</Text>
          <Switch
            value={qaSessions}
            onValueChange={setQaSessions}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={qaSessions ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 5: Registration & Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎟️ Registration & Badges</Text>
        
        <Text style={styles.label}>Registration Tiers (Multi-Select)</Text>
        <View style={styles.chipContainer}>
          {registrationTierOptions.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={[styles.chip, registrationTiers.includes(tier) && styles.chipSelected]}
              onPress={() => toggleRegistrationTier(tier)}
            >
              <Text style={[styles.chipText, registrationTiers.includes(tier) && styles.chipTextSelected]}>
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Early Bird Pricing</Text>
          <Switch
            value={earlyBirdPricing}
            onValueChange={setEarlyBirdPricing}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={earlyBirdPricing ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <Text style={styles.label}>Badge Types/Access Levels</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={badgeTypes}
          onChangeText={setBadgeTypes}
          placeholder="Full Access, Expo Only, Speaker, VIP, Press..."
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Check-In Method</Text>
        {renderChipGroup(checkInMethods, checkInMethod, setCheckInMethod)}

        <View style={styles.switchRow}>
          <Text style={styles.label}>On-Site Name Badge Printing</Text>
          <Switch
            value={nameBadgePrinting}
            onValueChange={setNameBadgePrinting}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={nameBadgePrinting ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 6: CEU & Certifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📜 CEU & Certifications</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Continuing Education Units (CEU) Offered</Text>
          <Switch
            value={ceuOffered}
            onValueChange={setCeuOffered}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={ceuOffered ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {ceuOffered && (
          <>
            <Text style={styles.label}>CEU Provider/Accreditation</Text>
            <TextInput
              style={styles.input}
              value={ceuProvider}
              onChangeText={setCeuProvider}
              placeholder="e.g., IACET, AMA PRA Category 1"
            />

            <Text style={styles.label}>CEU Credits Available</Text>
            <TextInput
              style={styles.input}
              value={ceuCredits}
              onChangeText={setCeuCredits}
              placeholder="e.g., 12 CEU credits, 8 CME credits"
            />

            <Text style={styles.label}>Attendance Tracking Method</Text>
            <TextInput
              style={styles.input}
              value={attendanceTracking}
              onChangeText={setAttendanceTracking}
              placeholder="Badge scanning, mobile app check-in, manual sign-in"
            />
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Certificate of Attendance</Text>
          <Switch
            value={certificateOfAttendance}
            onValueChange={setCertificateOfAttendance}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={certificateOfAttendance ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 7: Meals & Catering */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Meals & Catering</Text>
        
        <Text style={styles.label}>Meals Included (Multi-Select)</Text>
        <View style={styles.chipContainer}>
          {mealOptions.map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[styles.chip, mealsIncluded.includes(meal) && styles.chipSelected]}
              onPress={() => toggleMeal(meal)}
            >
              <Text style={[styles.chipText, mealsIncluded.includes(meal) && styles.chipTextSelected]}>
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Catering Style</Text>
        <TextInput
          style={styles.input}
          value={cateringStyle}
          onChangeText={setCateringStyle}
          placeholder="Buffet, plated service, boxed meals, food stations"
        />

        <Text style={styles.label}>Dietary Options</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={dietaryOptions}
          onChangeText={setDietaryOptions}
          placeholder="Vegetarian, vegan, gluten-free, kosher, halal..."
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Beverage Service</Text>
        <TextInput
          style={styles.input}
          value={beverageService}
          onChangeText={setBeverageService}
          placeholder="Coffee/tea all day, water stations, lunch beverages"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Networking Receptions (Evening Events)</Text>
          <Switch
            value={networkingReceptions}
            onValueChange={setNetworkingReceptions}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={networkingReceptions ? '#9333ea' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Section 8: Networking & Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤝 Networking & Activities</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Dedicated Networking Breaks</Text>
          <Switch
            value={networkingBreaks}
            onValueChange={setNetworkingBreaks}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={networkingBreaks ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Exhibit Hall/Expo</Text>
          <Switch
            value={exhibitHall}
            onValueChange={setExhibitHall}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={exhibitHall ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {exhibitHall && (
          <>
            <Text style={styles.label}>Number of Exhibitor Booths</Text>
            <TextInput
              style={styles.input}
              value={boothCount}
              onChangeText={setBoothCount}
              placeholder="e.g., 50 booths"
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>Sponsor Opportunities</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={sponsorOpportunities}
          onChangeText={setSponsorOpportunities}
          placeholder="Platinum, Gold, Silver, Lunch Sponsor, Badge Sponsor..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Private Meeting Rooms Available</Text>
          <Switch
            value={meetingRooms}
            onValueChange={setMeetingRooms}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={meetingRooms ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <Text style={styles.label}>Social Events</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={socialEvents}
          onChangeText={setSocialEvents}
          placeholder="Welcome party, gala dinner, after-hours activities..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Section 9: Technology & AV */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💻 Technology & AV</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Conference Mobile App</Text>
          <Switch
            value={conferenceApp}
            onValueChange={setConferenceApp}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={conferenceApp ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {conferenceApp && (
          <>
            <Text style={styles.label}>App Features</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={appFeatures}
              onChangeText={setAppFeatures}
              placeholder="Schedule, maps, networking, live polls, Q&A..."
              multiline
              numberOfLines={2}
            />
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Live Streaming of Sessions</Text>
          <Switch
            value={liveStreaming}
            onValueChange={setLiveStreaming}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={liveStreaming ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Session Recording Available</Text>
          <Switch
            value={sessionRecording}
            onValueChange={setSessionRecording}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={sessionRecording ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        <Text style={styles.label}>AV Requirements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={avRequirements}
          onChangeText={setAvRequirements}
          placeholder="Projectors, mics, sound systems, recording equipment..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Free WiFi for Attendees</Text>
          <Switch
            value={wifiAvailable}
            onValueChange={setWifiAvailable}
            trackColor={{ false: '#d1d5db', true: '#c084fc' }}
            thumbColor={wifiAvailable ? '#9333ea' : '#f3f4f6'}
          />
        </View>
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
  bottomPadding: {
    height: 40,
  },
});
