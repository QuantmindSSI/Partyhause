export interface EventDetails {
  basicInfo: {
    name: string;
    eventType: 'birthday' | 'corporate' | 'wedding' | 'reunion' | 'casual' | 'celebration' | 'networking' | 'other';
    attendeeCount: number;
    estimatedDuration: number; // in hours
    startDate: string;
    endDate: string;
    venue: 'indoor' | 'outdoor' | 'mixed' | 'virtual';
    location?: {
      address: string;
      city: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    budget?: {
      range: 'low' | 'medium' | 'high' | 'unlimited';
      amount?: number;
      currency?: string;
    };
  };

  atmosphere: {
    energyLevel: 'chill' | 'moderate' | 'high' | 'very-high';
    formality: 'very-casual' | 'casual' | 'semi-formal' | 'formal' | 'black-tie';
    interactionStyle: 'intimate' | 'social' | 'competitive' | 'collaborative' | 'mixed';
    mood: string[]; // ['fun', 'relaxed', 'exciting', 'elegant', 'adventurous', etc.]
    themes?: string[]; // ['retro', 'tropical', 'minimalist', 'fantasy', etc.]
    musicPreference: 'background' | 'dancing' | 'live-performance' | 'none' | 'mixed';
    lightingPreference: 'bright' | 'dim' | 'colorful' | 'natural' | 'dramatic';
  };

  attendeeInfo: {
    ageRange: {
      min: number;
      max: number;
      primary: 'children' | 'teens' | 'young-adults' | 'adults' | 'seniors' | 'mixed';
    };
    relationships: 'family' | 'friends' | 'colleagues' | 'mixed' | 'strangers';
    culturalBackground: string[]; // for cultural sensitivity
    languagesSpoken: string[];
    specialNeeds: {
      accessibility: boolean;
      dietaryRestrictions: string[];
      mobilityConsiderations: boolean;
      sensoryConsiderations: boolean;
    };
    personalities: {
      introvertRatio: number; // 0-100
      competitiveSpirit: number; // 0-100
      creativityLevel: number; // 0-100
      techSavviness: number; // 0-100
    };
  };

  preferences: {
    previousSuccessfulActivities: string[];
    avoidActivities: string[];
    mustHaveElements: string[];
    gameCategories: {
      icebreakers: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      teamBuilding: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      competitive: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      creative: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      physical: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      mental: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
      social: 'love' | 'like' | 'neutral' | 'dislike' | 'avoid';
    };
    hostingStyle: 'hands-on' | 'facilitator' | 'organizer' | 'participant';
    riskTolerance: 'conservative' | 'moderate' | 'adventurous' | 'experimental';
  };

  contextualFactors: {
    season: 'spring' | 'summer' | 'fall' | 'winter';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'all-day';
    weatherDependency: boolean;
    technologyAvailable: {
      audioSystem: boolean;
      projector: boolean;
      microphones: boolean;
      lighting: boolean;
      internet: boolean;
      mobileDevices: boolean;
    };
    spaceConstraints: {
      indoor: boolean;
      outdoor: boolean;
      movementSpace: 'limited' | 'moderate' | 'spacious';
      privateSpace: boolean;
      noiseRestrictions: boolean;
    };
  };

  aiInputs: {
    freeformDescription: string; // Host's own description
    inspirationSources: string[]; // Movies, books, past events, etc.
    successCriteria: string[]; // What makes this event successful
    concerns: string[]; // What the host is worried about
    surpriseElements: boolean; // Does host want unexpected elements
    customizationLevel: 'minimal' | 'moderate' | 'extensive';
  };
}

export interface EventAnalysis {
  eventId: string;
  confidenceScore: number; // 0-100
  matchingFactors: {
    groupDynamics: number;
    energyAlignment: number;
    culturalFit: number;
    logisticalFeasibility: number;
    hostPreferences: number;
  };
  recommendedGameTypes: string[];
  cautionAreas: string[];
  enhancementSuggestions: string[];
}

export interface AIRecommendationContext {
  eventDetails: EventDetails;
  userHistory: GameHistory[];
  similarEvents: EventDetails[];
  seasonalTrends: any;
  communityPreferences: any;
}