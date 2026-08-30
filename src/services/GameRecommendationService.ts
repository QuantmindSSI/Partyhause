import { aiGameEngine } from '@/services/ai/AIGameEngine';
import { EventDetails } from '@/types/eventDetails';
import { GameFeedback, GameRecommendation, GameTemplate } from '@/types/gameTypes';

/**
 * A complete, structurally valid EventDetails with neutral defaults.
 *
 * Used as the base for preview recommendations, where the caller supplies only
 * the handful of fields the user has filled in so far. Every field required by
 * EventDetails is present, so consumers can read nested properties without
 * optional chaining or runtime guards.
 *
 * @returns A fresh object on each call; callers mutate or spread over it.
 */
function createDefaultEventDetails(): EventDetails {
  const now = new Date();
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const seasonsByMonth = [
    'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    'summer', 'summer', 'fall', 'fall', 'fall', 'winter',
  ] as const;

  return {
    basicInfo: {
      name: 'Preview Event',
      eventType: 'casual',
      attendeeCount: 8,
      estimatedDuration: 3,
      startDate: now.toISOString(),
      endDate: threeHoursLater.toISOString(),
      venue: 'indoor',
    },
    atmosphere: {
      energyLevel: 'moderate',
      formality: 'casual',
      interactionStyle: 'social',
      mood: ['fun'],
      themes: [],
      musicPreference: 'background',
      lightingPreference: 'natural',
    },
    attendeeInfo: {
      ageRange: { min: 21, max: 45, primary: 'adults' },
      relationships: 'friends',
      culturalBackground: [],
      languagesSpoken: ['en'],
      specialNeeds: {
        accessibility: false,
        dietaryRestrictions: [],
        mobilityConsiderations: false,
        sensoryConsiderations: false,
      },
      personalities: {
        introvertRatio: 50,
        competitiveSpirit: 50,
        creativityLevel: 50,
        techSavviness: 50,
      },
    },
    preferences: {
      previousSuccessfulActivities: [],
      avoidActivities: [],
      mustHaveElements: [],
      gameCategories: {
        icebreakers: 'neutral',
        teamBuilding: 'neutral',
        competitive: 'neutral',
        creative: 'neutral',
        physical: 'neutral',
        mental: 'neutral',
        social: 'neutral',
      },
      hostingStyle: 'facilitator',
      riskTolerance: 'moderate',
    },
    contextualFactors: {
      season: seasonsByMonth[now.getMonth()],
      timeOfDay: 'evening',
      weatherDependency: false,
      technologyAvailable: {
        audioSystem: false,
        projector: false,
        microphones: false,
        lighting: false,
        internet: true,
        mobileDevices: true,
      },
      spaceConstraints: {
        indoor: true,
        outdoor: false,
        movementSpace: 'moderate',
        privateSpace: true,
        noiseRestrictions: false,
      },
    },
    aiInputs: {
      freeformDescription: '',
      inspirationSources: [],
      successCriteria: [],
      concerns: [],
      surpriseElements: false,
      customizationLevel: 'moderate',
    },
  };
}

export class GameRecommendationService {
  private static instance: GameRecommendationService;

  public static getInstance(): GameRecommendationService {
    if (!GameRecommendationService.instance) {
      GameRecommendationService.instance = new GameRecommendationService();
    }
    return GameRecommendationService.instance;
  }

  /**
   * Get AI-powered game recommendations based on event details
   */
  async getRecommendations(eventDetails: EventDetails, userId?: string): Promise<GameRecommendation[]> {
    try {
      // Analyze the event using AI
      const analysis = aiGameEngine.analyzeEvent(eventDetails);
      
      // Get personalized recommendations if user ID provided
      if (userId) {
        return aiGameEngine.getPersonalizedRecommendations(userId, eventDetails);
      }
      
      // Otherwise get general recommendations
      return aiGameEngine.findMatches(analysis);
    } catch (error) {
      console.error('Error getting game recommendations:', error);
      return this.getFallbackRecommendations(eventDetails);
    }
  }

  /**
   * Get trending games for inspiration
   */
  getTrendingGames(timeframe: 'week' | 'month' | 'season' = 'week'): GameTemplate[] {
    try {
      return aiGameEngine.getTrendingGames(timeframe);
    } catch (error) {
      console.error('Error getting trending games:', error);
      return [];
    }
  }

  /**
   * Submit feedback for a played game to improve recommendations
   */
  async submitGameFeedback(gameId: string, eventId: string, feedback: {
    userId: string;
    overall: number;
    funFactor: number;
    easeOfPlay: number;
    groupEngagement: number;
    wouldPlayAgain: boolean;
    comments?: string;
    modifications?: string;
    challengesFaced?: string;
  }): Promise<void> {
    try {
      // The literal below previously used an older, incompatible shape
      // (mostEnjoyedAspect/improvements/personalizedComments as free text, and
      // modifications/settingRating on `contextual`). GameFeedback actually
      // models the qualitative fields as string arrays. It was never caught
      // because this project was not type checked in CI. The free-text inputs
      // are mapped onto the array fields, dropping empties rather than
      // recording a meaningless [''].
      const toEntries = (value?: string): string[] => {
        const trimmed = value?.trim();
        return trimmed ? [trimmed] : [];
      };

      const gameFeedback: GameFeedback = {
        gameId,
        eventId,
        userId: feedback.userId,

        ratings: {
          overall: feedback.overall,
          funFactor: feedback.funFactor,
          engagement: feedback.groupEngagement,
          appropriateness: feedback.overall, // Using overall as proxy
          difficulty: 5, // Default medium difficulty
          duration: 5 // Default appropriate duration
        },

        qualitative: {
          whatWorked: toEntries(feedback.comments),
          whatDidntWork: toEntries(feedback.challengesFaced),
          suggestions: toEntries(feedback.modifications),
          wouldPlayAgain: feedback.wouldPlayAgain,
          wouldRecommend: feedback.wouldPlayAgain
        },

        contextual: {
          // Zero is a sentinel for "not captured": this method receives a
          // post-hoc survey, not live play telemetry.
          actualDuration: 0,
          actualParticipants: 0,
          adaptationsMade: toEntries(feedback.modifications),
          environmentalFactors: []
        },

        timestamp: new Date().toISOString()
      };

      aiGameEngine.learnFromFeedback(gameId, eventId, gameFeedback);
      
      // In a real app, this would also save to database
      console.log('Game feedback submitted:', gameFeedback);
    } catch (error) {
      console.error('Error submitting game feedback:', error);
    }
  }

  /**
   * Get game customizations based on specific event requirements
   */
  getGameCustomizations(game: GameTemplate, eventDetails: EventDetails) {
    try {
      return aiGameEngine.customizeGame(game, eventDetails);
    } catch (error) {
      console.error('Error getting game customizations:', error);
      return [];
    }
  }

  /**
   * Validate if event details are sufficient for good recommendations
   */
  validateEventDetailsForRecommendations(eventDetails: EventDetails): {
    isValid: boolean;
    missingFields: string[];
    recommendations: string[];
  } {
    const missingFields: string[] = [];
    const recommendations: string[] = [];

    // Check essential fields
    if (!eventDetails.basicInfo?.attendeeCount) {
      missingFields.push('attendeeCount');
      recommendations.push('Add expected number of attendees for better game sizing');
    }

    if (!eventDetails.atmosphere?.energyLevel) {
      missingFields.push('energyLevel');
      recommendations.push('Specify desired energy level (chill, moderate, high, very-high)');
    }

    if (!eventDetails.atmosphere?.interactionStyle) {
      missingFields.push('interactionStyle');
      recommendations.push('Choose interaction style (intimate, social, party, networking)');
    }

    if (!eventDetails.basicInfo?.estimatedDuration) {
      missingFields.push('estimatedDuration');
      recommendations.push('Add estimated event duration for appropriate game length');
    }

    // Check optional but helpful fields
    if (!eventDetails.attendeeInfo?.ageRange) {
      recommendations.push('Adding age range helps find age-appropriate games');
    }

    if (!eventDetails.attendeeInfo?.relationships) {
      recommendations.push('Specifying guest relationships improves game matching');
    }

    if (!eventDetails.contextualFactors?.spaceConstraints) {
      recommendations.push('Including space information helps avoid unsuitable games');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      recommendations
    };
  }

  /**
   * Get preview recommendations based on partial event data
   */
  getPreviewRecommendations(partialEventDetails: Partial<EventDetails>): GameTemplate[] {
    try {
      // Previously this built a partial object and asserted it was a full
      // EventDetails: `venue: 'Home'` is outside the venue union, `date` is not
      // a field (basicInfo needs startDate/endDate/eventType), and four sections
      // were filled with `{}`. aiGameEngine.analyzeEvent then read properties
      // that did not exist. Merge over a complete default instead, so the
      // preview path is structurally valid at runtime as well as at compile time.
      const previewEvent: EventDetails = {
        ...createDefaultEventDetails(),
        ...partialEventDetails,
        basicInfo: {
          ...createDefaultEventDetails().basicInfo,
          ...partialEventDetails.basicInfo,
        },
        atmosphere: {
          ...createDefaultEventDetails().atmosphere,
          ...partialEventDetails.atmosphere,
        },
      };

      const analysis = aiGameEngine.analyzeEvent(previewEvent);
      const recommendations = aiGameEngine.findMatches(analysis);
      
      // Return just the games, not full recommendations
      return recommendations.slice(0, 5).map(rec => rec.game);
    } catch (error) {
      console.error('Error getting preview recommendations:', error);
      return this.getFallbackGameList();
    }
  }

  /**
   * Search games by category, difficulty, or other criteria
   */
  searchGames(criteria: {
    category?: string;
    minPlayers?: number;
    maxPlayers?: number;
    energyLevel?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
  }): GameTemplate[] {
    // This would typically query a database
    // For now, returning mock filtered results
    return this.getFallbackGameList().filter(game => {
      if (criteria.category && game.category !== criteria.category) return false;
      if (criteria.minPlayers && game.requirements.maxPlayers < criteria.minPlayers) return false;
      if (criteria.maxPlayers && game.requirements.minPlayers > criteria.maxPlayers) return false;
      if (criteria.energyLevel && Math.abs(game.characteristics.energyLevel - criteria.energyLevel) > 3) return false;
      if (criteria.difficulty && game.metadata.difficulty !== criteria.difficulty) return false;
      if (criteria.tags && !criteria.tags.some(tag => game.tags.includes(tag))) return false;
      
      return true;
    });
  }

  /**
   * Get detailed game statistics and performance metrics
   */
  getGameStatistics(gameId: string) {
    // This would fetch from database in real implementation
    return {
      totalPlays: 1543,
      averageRating: 8.2,
      lastPlayed: '2024-01-15T18:30:00Z',
      popularWith: ['young-adults', 'teams', 'family-groups'],
      bestContexts: ['casual-party', 'team-building', 'family-reunion'],
      commonCustomizations: ['shorter-duration', 'larger-groups', 'theme-based'],
      recentFeedback: [
        'Great icebreaker!',
        'Perfect for our office party',
        'Kids loved the creativity aspect'
      ]
    };
  }

  /**
   * Fallback recommendations when AI fails
   */
  private getFallbackRecommendations(eventDetails: EventDetails): GameRecommendation[] {
    const fallbackGames = this.getFallbackGameList();
    
    return fallbackGames.map(game => ({
      game,
      matchScore: 75, // Default decent match
      confidence: 60,
      reasoning: ['Popular choice for similar events', 'Good all-around game'],
      adaptations: [],
      customizations: [],
      warnings: [],
      alternativeVersions: []
    }));
  }

  /**
   * Basic game list for fallback scenarios
   */
  private getFallbackGameList(): GameTemplate[] {
    // Return a curated list of popular, reliable games
    // This would come from a database in production
    return [
      // Games would be loaded from the AI engine's catalog
      // For now, return empty array as the AI engine has the games
    ];
  }
}

// Export singleton instance
export const gameRecommendationService = GameRecommendationService.getInstance();