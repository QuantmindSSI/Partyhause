import { EventDetails } from './eventDetails';

export interface GameHistory {
  gameId: string;
  eventId: string;
  playedAt: string;
  duration: number;
  participants: number;
  satisfaction: number; // 1-10
  feedback: string;
  adaptations: string[];
}

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  
  // Categorization
  category: 'icebreaker' | 'team-building' | 'party' | 'competitive' | 'creative' | 'physical' | 'mental' | 'social';
  subcategories: string[];
  tags: string[];
  
  // Requirements & Constraints
  requirements: {
    minPlayers: number;
    maxPlayers: number;
    optimalPlayers: number;
    duration: {
      min: number; // minutes
      max: number;
      optimal: number;
    };
    ageRange: {
      min: number;
      max: number;
      optimal: [number, number];
    };
    space: 'indoor' | 'outdoor' | 'both';
    spaceRequirement: 'minimal' | 'moderate' | 'large';
    equipment: string[];
    preparation: 'none' | 'minimal' | 'moderate' | 'extensive';
  };
  
  // Gameplay Characteristics
  characteristics: {
    energyLevel: number; // 1-10
    physicalActivity: number; // 1-10
    mentalChallenge: number; // 1-10
    socialInteraction: number; // 1-10
    creativity: number; // 1-10
    competition: number; // 1-10
    cooperation: number; // 1-10
    noiseLevel: number; // 1-10
    complexity: number; // 1-10
    formalityLevel: number; // 1-10
  };
  
  // Cultural & Contextual Factors
  cultural: {
    culturalSensitivity: string[];
    languageDependent: boolean;
    universalAppeal: number; // 1-10
    religiousConsiderations: string[];
    genderInclusive: boolean;
    ageInclusive: boolean;
  };
  
  // Game Content
  content: {
    rules: string;
    setup: string;
    materials: string[];
    variations: GameVariation[];
    adaptations: GameAdaptation[];
    facilitatorNotes: string[];
    troubleshooting: TroubleshootingTip[];
  };
  
  // AI Matching Data
  aiData: {
    successFactors: string[];
    failureRisks: string[];
    idealContexts: ContextMatch[];
    personalityTypes: string[]; // Myers-Briggs, etc.
    learningObjectives: string[];
    emotionalOutcomes: string[];
  };
  
  // Performance Metrics
  metrics: {
    averageRating: number;
    totalPlays: number;
    successRate: number;
    repeatRate: number;
    recommendationScore: number;
    lastUpdated: string;
    trendingScore: number;
  };
  
  // Media & Resources
  media: {
    images: string[];
    videos: string[];
    thumbnails: string[];
    instructionalContent: string[];
  };
  
  // Metadata
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    license: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    verified: boolean;
    featured: boolean;
    premium: boolean;
  };
}

export interface GameVariation {
  id: string;
  name: string;
  description: string;
  modifications: string[];
  when: string; // When to use this variation
  impact: {
    difficulty: number; // -3 to +3
    duration: number; // -50% to +200%
    engagement: number; // -3 to +3
  };
}

export interface GameAdaptation {
  id: string;
  name: string;
  purpose: string;
  targetAudience: string;
  modifications: string[];
  requirements: any;
}

export interface TroubleshootingTip {
  problem: string;
  solution: string;
  prevention: string;
}

export interface ContextMatch {
  context: string;
  suitabilityScore: number; // 1-10
  adaptationsNeeded: string[];
}

export interface GameRecommendation {
  game: GameTemplate;
  matchScore: number; // 0-100
  confidence: number; // 0-100
  reasoning: string[];
  adaptations: GameAdaptation[];
  customizations: GameCustomization[];
  warnings: string[];
  alternativeVersions: GameRecommendation[];
}

export interface GameCustomization {
  type: 'rules' | 'duration' | 'difficulty' | 'theme' | 'materials';
  description: string;
  impact: string;
  implementation: string;
}

// Event Analysis interface
export interface EventAnalysis {
  eventId: string;
  confidenceScore: number;
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

export interface AIGameMatcher {
  analyzeEvent(eventDetails: EventDetails): EventAnalysis;
  findMatches(analysis: EventAnalysis): GameRecommendation[];
  customizeGame(game: GameTemplate, eventDetails: EventDetails): GameCustomization[];
  learnFromFeedback(gameId: string, eventId: string, feedback: GameFeedback): void;
  getPersonalizedRecommendations(userId: string, eventDetails: EventDetails): GameRecommendation[];
  getTrendingGames(timeframe: 'week' | 'month' | 'season'): GameTemplate[];
}

export interface GameFeedback {
  gameId: string;
  eventId: string;
  userId: string;
  
  ratings: {
    overall: number; // 1-10
    funFactor: number;
    engagement: number;
    appropriateness: number;
    difficulty: number;
    duration: number;
  };
  
  qualitative: {
    whatWorked: string[];
    whatDidntWork: string[];
    suggestions: string[];
    wouldPlayAgain: boolean;
    wouldRecommend: boolean;
  };
  
  contextual: {
    actualParticipants: number;
    actualDuration: number;
    adaptationsMade: string[];
    environmentalFactors: string[];
  };
  
  timestamp: string;
}