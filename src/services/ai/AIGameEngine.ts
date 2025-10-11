import { GameTemplate, GameRecommendation, GameCustomization, GameFeedback, AIGameMatcher } from '@/types/gameTypes';
import { EventDetails, EventAnalysis } from '@/types/eventDetails';

export class AIGameEngine implements AIGameMatcher {
  private gamesCatalog: GameTemplate[] = [];
  private userHistory: Map<string, GameFeedback[]> = new Map();
  private eventHistory: Map<string, EventAnalysis> = new Map();

  constructor() {
    this.initializeGamesCatalog();
  }

  // Initialize with sample games
  private initializeGamesCatalog() {
    this.gamesCatalog = [
      {
        id: 'two-truths-one-lie',
        name: 'Two Truths and a Lie',
        description: 'Players share three statements about themselves, two true and one false. Others guess which is the lie.',
        shortDescription: 'Share facts about yourself - can others spot the lie?',
        category: 'icebreaker',
        subcategories: ['getting-to-know-you', 'conversation-starter'],
        tags: ['verbal', 'personal', 'guessing', 'simple'],
        
        requirements: {
          minPlayers: 3,
          maxPlayers: 20,
          optimalPlayers: 8,
          duration: { min: 10, max: 30, optimal: 15 },
          ageRange: { min: 12, max: 99, optimal: [16, 65] },
          space: 'both',
          spaceRequirement: 'minimal',
          equipment: [],
          preparation: 'none'
        },
        
        characteristics: {
          energyLevel: 4,
          physicalActivity: 1,
          mentalChallenge: 5,
          socialInteraction: 8,
          creativity: 6,
          competition: 3,
          cooperation: 7,
          noiseLevel: 4,
          complexity: 2,
          formalityLevel: 3
        },
        
        cultural: {
          culturalSensitivity: ['personal-sharing'],
          languageDependent: true,
          universalAppeal: 9,
          religiousConsiderations: [],
          genderInclusive: true,
          ageInclusive: true
        },
        
        content: {
          rules: `Each player thinks of three statements about themselves - two must be true, one must be false. Players take turns sharing their statements. After each person shares, others guess which statement is the lie. Reveal the answer and move to the next player.`,
          setup: 'Arrange players in a circle or where everyone can see each other.',
          materials: [],
          variations: [
            {
              id: 'themed-version',
              name: 'Themed Two Truths',
              description: 'Focus on specific themes like travels, childhood, or work experiences',
              modifications: ['Add theme constraints', 'Provide theme prompts'],
              when: 'When you want to explore specific aspects of people\'s lives',
              impact: { difficulty: 1, duration: 0, engagement: 1 }
            }
          ],
          adaptations: [
            {
              id: 'virtual-adaptation',
              name: 'Virtual Version',
              purpose: 'Online/remote play',
              targetAudience: 'Remote teams',
              modifications: ['Use video chat', 'Screen sharing for guesses'],
              requirements: { technology: ['video-conference'] }
            }
          ],
          facilitatorNotes: [
            'Encourage creative and interesting lies',
            'Set boundaries on personal information',
            'Be ready to help shy participants'
          ],
          troubleshooting: [
            {
              problem: 'Players share too personal information',
              solution: 'Set clear boundaries at the start',
              prevention: 'Give examples of appropriate sharing levels'
            }
          ]
        },
        
        aiData: {
          successFactors: ['right group size', 'comfortable environment', 'good facilitation'],
          failureRisks: ['overly personal sharing', 'shy participants', 'cultural barriers'],
          idealContexts: [
            { context: 'team building', suitabilityScore: 9, adaptationsNeeded: [] },
            { context: 'casual party', suitabilityScore: 8, adaptationsNeeded: [] }
          ],
          personalityTypes: ['extroverted', 'social', 'creative'],
          learningObjectives: ['getting to know each other', 'building trust'],
          emotionalOutcomes: ['connection', 'laughter', 'surprise']
        },
        
        metrics: {
          averageRating: 8.2,
          totalPlays: 15420,
          successRate: 0.89,
          repeatRate: 0.34,
          recommendationScore: 8.7,
          lastUpdated: new Date().toISOString(),
          trendingScore: 7.5
        },
        
        media: {
          images: ['/games/two-truths-lie-1.jpg'],
          videos: [],
          thumbnails: ['/games/thumbs/two-truths-lie.jpg'],
          instructionalContent: []
        },
        
        metadata: {
          createdBy: 'partyhaus-team',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          version: '1.0',
          license: 'Creative Commons',
          difficulty: 'beginner',
          verified: true,
          featured: true,
          premium: false
        }
      },
      
      // Add more games here...
      {
        id: 'charades',
        name: 'Charades',
        description: 'Act out words or phrases without speaking while others guess',
        shortDescription: 'Act it out - no words allowed!',
        category: 'party',
        subcategories: ['acting', 'guessing', 'entertainment'],
        tags: ['physical', 'creative', 'team-based', 'classic'],
        
        requirements: {
          minPlayers: 4,
          maxPlayers: 30,
          optimalPlayers: 12,
          duration: { min: 15, max: 60, optimal: 30 },
          ageRange: { min: 8, max: 99, optimal: [12, 60] },
          space: 'both',
          spaceRequirement: 'moderate',
          equipment: ['paper', 'pen'],
          preparation: 'minimal'
        },
        
        characteristics: {
          energyLevel: 7,
          physicalActivity: 6,
          mentalChallenge: 6,
          socialInteraction: 9,
          creativity: 8,
          competition: 6,
          cooperation: 7,
          noiseLevel: 7,
          complexity: 3,
          formalityLevel: 2
        },
        
        cultural: {
          culturalSensitivity: ['cultural-references'],
          languageDependent: false,
          universalAppeal: 9,
          religiousConsiderations: [],
          genderInclusive: true,
          ageInclusive: true
        },
        
        content: {
          rules: `Divide into teams. One player acts out a word/phrase while their team guesses. No talking, sounds, or pointing to objects. Use standard gestures for categories. Teams alternate turns.`,
          setup: 'Clear space for acting, prepare word/phrase cards',
          materials: ['pre-written prompts', 'timer'],
          variations: [
            {
              id: 'themed-charades',
              name: 'Themed Charades',
              description: 'Use specific themes like movies, books, or work-related terms',
              modifications: ['Theme-specific word lists'],
              when: 'When group has shared interests or knowledge',
              impact: { difficulty: 0, duration: 0, engagement: 1 }
            }
          ],
          adaptations: [],
          facilitatorNotes: [
            'Demonstrate standard gestures first',
            'Keep energy high',
            'Have backup prompts ready'
          ],
          troubleshooting: [
            {
              problem: 'Players too shy to act',
              solution: 'Start with easier prompts, demonstrate first',
              prevention: 'Warm up with simple actions'
            }
          ]
        },
        
        aiData: {
          successFactors: ['energetic group', 'comfortable setting', 'good prompts'],
          failureRisks: ['shy participants', 'unclear prompts', 'space constraints'],
          idealContexts: [
            { context: 'party', suitabilityScore: 10, adaptationsNeeded: [] },
            { context: 'family gathering', suitabilityScore: 9, adaptationsNeeded: [] }
          ],
          personalityTypes: ['extroverted', 'creative', 'playful'],
          learningObjectives: ['creativity', 'communication', 'teamwork'],
          emotionalOutcomes: ['laughter', 'excitement', 'bonding']
        },
        
        metrics: {
          averageRating: 8.8,
          totalPlays: 28350,
          successRate: 0.92,
          repeatRate: 0.67,
          recommendationScore: 9.1,
          lastUpdated: new Date().toISOString(),
          trendingScore: 8.9
        },
        
        media: {
          images: ['/games/charades-1.jpg', '/games/charades-2.jpg'],
          videos: ['/games/charades-demo.mp4'],
          thumbnails: ['/games/thumbs/charades.jpg'],
          instructionalContent: ['/games/charades-guide.pdf']
        },
        
        metadata: {
          createdBy: 'partyhaus-team',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          version: '1.2',
          license: 'Creative Commons',
          difficulty: 'beginner',
          verified: true,
          featured: true,
          premium: false
        }
      }
    ];
  }

  // Main AI matching algorithm
  analyzeEvent(eventDetails: EventDetails): EventAnalysis {
    const analysis: EventAnalysis = {
      eventId: eventDetails.basicInfo?.name || 'unknown',
      confidenceScore: 85,
      matchingFactors: {
        groupDynamics: this.calculateGroupDynamics(eventDetails),
        energyAlignment: this.calculateEnergyAlignment(eventDetails),
        culturalFit: this.calculateCulturalFit(eventDetails),
        logisticalFeasibility: this.calculateLogisticalFeasibility(eventDetails),
        hostPreferences: this.calculateHostPreferences(eventDetails)
      },
      recommendedGameTypes: this.identifyGameTypes(eventDetails),
      cautionAreas: this.identifyCautionAreas(eventDetails),
      enhancementSuggestions: this.generateEnhancementSuggestions(eventDetails)
    };

    return analysis;
  }

  findMatches(analysis: EventAnalysis): GameRecommendation[] {
    const recommendations: GameRecommendation[] = [];

    for (const game of this.gamesCatalog) {
      const matchScore = this.calculateMatchScore(game, analysis);
      
      if (matchScore > 60) { // Only recommend games with >60% match
        const recommendation: GameRecommendation = {
          game,
          matchScore,
          confidence: this.calculateConfidence(game, analysis),
          reasoning: this.generateReasoning(game, analysis),
          adaptations: this.suggestAdaptations(game, analysis),
          customizations: this.generateCustomizations(game, analysis),
          warnings: this.identifyWarnings(game, analysis),
          alternativeVersions: []
        };

        recommendations.push(recommendation);
      }
    }

    // Sort by match score and return top recommendations
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  customizeGame(game: GameTemplate, eventDetails: EventDetails): GameCustomization[] {
    const customizations: GameCustomization[] = [];

    // Duration customization
    if (eventDetails.basicInfo?.estimatedDuration) {
      const targetDuration = eventDetails.basicInfo.estimatedDuration * 60; // convert to minutes
      if (targetDuration < game.requirements.duration.min * 0.8) {
        customizations.push({
          type: 'duration',
          description: 'Shorten game duration',
          impact: 'Faster pace, fewer rounds',
          implementation: 'Reduce number of rounds or set stricter time limits'
        });
      }
    }

    // Group size customization
    if (eventDetails.basicInfo?.attendeeCount) {
      const attendees = eventDetails.basicInfo.attendeeCount;
      if (attendees > game.requirements.maxPlayers) {
        customizations.push({
          type: 'rules',
          description: 'Adapt for larger group',
          impact: 'Split into teams or multiple simultaneous games',
          implementation: 'Create multiple teams or run parallel sessions'
        });
      }
    }

    // Energy level customization
    if (eventDetails.atmosphere?.energyLevel === 'chill' && game.characteristics.energyLevel > 6) {
      customizations.push({
        type: 'rules',
        description: 'Lower energy version',
        impact: 'More relaxed pace and reduced physical activity',
        implementation: 'Slow down timing, reduce physical components'
      });
    }

    return customizations;
  }

  learnFromFeedback(gameId: string, eventId: string, feedback: GameFeedback): void {
    // Store feedback for learning
    const userFeedback = this.userHistory.get(feedback.userId) || [];
    userFeedback.push(feedback);
    this.userHistory.set(feedback.userId, userFeedback);

    // Update game metrics
    const game = this.gamesCatalog.find(g => g.id === gameId);
    if (game) {
      // Update ratings (simplified)
      const newRating = feedback.ratings.overall;
      const totalPlays = game.metrics.totalPlays;
      game.metrics.averageRating = ((game.metrics.averageRating * totalPlays) + newRating) / (totalPlays + 1);
      game.metrics.totalPlays += 1;
      
      // Update success rate
      const success = feedback.ratings.overall >= 7;
      const currentSuccessCount = game.metrics.successRate * totalPlays;
      game.metrics.successRate = (currentSuccessCount + (success ? 1 : 0)) / (totalPlays + 1);
    }
  }

  getPersonalizedRecommendations(userId: string, eventDetails: EventDetails): GameRecommendation[] {
    const userFeedback = this.userHistory.get(userId) || [];
    const analysis = this.analyzeEvent(eventDetails);
    
    // Get base recommendations
    const baseRecommendations = this.findMatches(analysis);
    
    // Personalize based on user history
    return baseRecommendations.map(rec => {
      const userPreference = this.calculateUserPreference(rec.game, userFeedback);
      
      return {
        ...rec,
        matchScore: rec.matchScore * userPreference,
        reasoning: [
          ...rec.reasoning,
          ...this.generatePersonalizedReasoning(rec.game, userFeedback)
        ]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  getTrendingGames(timeframe: 'week' | 'month' | 'season'): GameTemplate[] {
    return this.gamesCatalog
      .filter(game => game.metrics.trendingScore > 7)
      .sort((a, b) => b.metrics.trendingScore - a.metrics.trendingScore)
      .slice(0, 10);
  }

  // Helper methods for calculations
  private calculateGroupDynamics(eventDetails: EventDetails): number {
    let score = 50;
    
    // Consider attendee count
    const attendees = eventDetails.basicInfo?.attendeeCount || 0;
    if (attendees >= 6 && attendees <= 12) score += 20;
    else if (attendees >= 4 && attendees <= 20) score += 10;
    
    // Consider relationships
    if (eventDetails.attendeeInfo?.relationships === 'friends') score += 15;
    else if (eventDetails.attendeeInfo?.relationships === 'mixed') score += 10;
    
    return Math.min(100, score);
  }

  private calculateEnergyAlignment(eventDetails: EventDetails): number {
    const energyMap = { 'chill': 25, 'moderate': 50, 'high': 75, 'very-high': 100 };
    return energyMap[eventDetails.atmosphere?.energyLevel || 'moderate'] || 50;
  }

  private calculateCulturalFit(eventDetails: EventDetails): number {
    // Simplified cultural fit calculation
    return 80; // Default good fit
  }

  private calculateLogisticalFeasibility(eventDetails: EventDetails): number {
    let score = 50;
    
    // Space considerations
    if (eventDetails.basicInfo?.venue) score += 20;
    if (eventDetails.contextualFactors?.spaceConstraints?.movementSpace === 'spacious') score += 15;
    
    return Math.min(100, score);
  }

  private calculateHostPreferences(eventDetails: EventDetails): number {
    let score = 50;
    
    // Consider hosting style
    if (eventDetails.preferences?.hostingStyle === 'facilitator') score += 20;
    else if (eventDetails.preferences?.hostingStyle === 'organizer') score += 15;
    
    return Math.min(100, score);
  }

  private identifyGameTypes(eventDetails: EventDetails): string[] {
    const types: string[] = [];
    
    if (eventDetails.atmosphere?.interactionStyle === 'intimate') {
      types.push('icebreaker', 'conversation');
    }
    if (eventDetails.atmosphere?.energyLevel === 'high') {
      types.push('party', 'physical');
    }
    if (eventDetails.preferences?.gameCategories?.competitive === 'love') {
      types.push('competitive');
    }
    
    return types;
  }

  private identifyCautionAreas(eventDetails: EventDetails): string[] {
    const cautions: string[] = [];
    
    if (eventDetails.attendeeInfo?.specialNeeds?.accessibility) {
      cautions.push('Ensure games are accessibility-friendly');
    }
    if (eventDetails.contextualFactors?.spaceConstraints?.noiseRestrictions) {
      cautions.push('Consider noise levels for venue');
    }
    
    return cautions;
  }

  private generateEnhancementSuggestions(eventDetails: EventDetails): string[] {
    const suggestions: string[] = [];
    
    if (eventDetails.contextualFactors?.technologyAvailable?.audioSystem) {
      suggestions.push('Use audio system for music-based games');
    }
    if (eventDetails.atmosphere?.themes?.length) {
      suggestions.push('Incorporate event themes into game selection');
    }
    
    return suggestions;
  }

  private calculateMatchScore(game: GameTemplate, analysis: EventAnalysis): number {
    // Complex matching algorithm considering multiple factors
    let score = 0;
    
    // Group dynamics match (25%)
    score += analysis.matchingFactors.groupDynamics * 0.25;
    
    // Energy alignment (20%)
    score += analysis.matchingFactors.energyAlignment * 0.2;
    
    // Cultural fit (15%)
    score += analysis.matchingFactors.culturalFit * 0.15;
    
    // Logistical feasibility (25%)
    score += analysis.matchingFactors.logisticalFeasibility * 0.25;
    
    // Host preferences (15%)
    score += analysis.matchingFactors.hostPreferences * 0.15;
    
    return Math.round(score);
  }

  private calculateConfidence(game: GameTemplate, analysis: EventAnalysis): number {
    // Base confidence on game's track record and analysis completeness
    let confidence = game.metrics.successRate * 100;
    
    // Adjust based on how complete our analysis is
    const factorCount = Object.values(analysis.matchingFactors).filter(f => f > 0).length;
    confidence *= (factorCount / 5); // 5 factors total
    
    return Math.round(confidence);
  }

  private generateReasoning(game: GameTemplate, analysis: EventAnalysis): string[] {
    const reasons: string[] = [];
    
    reasons.push(`Great match for ${analysis.matchingFactors.energyAlignment > 70 ? 'high' : 'moderate'} energy events`);
    reasons.push(`Suitable for group size and dynamics`);
    
    if (game.metrics.averageRating > 8) {
      reasons.push(`Highly rated by previous users (${game.metrics.averageRating}/10)`);
    }
    
    return reasons;
  }

  private suggestAdaptations(game: GameTemplate, analysis: EventAnalysis): any[] {
    // Return relevant adaptations from the game's adaptation list
    return game.content.adaptations.slice(0, 2); // Limit to most relevant
  }

  private generateCustomizations(game: GameTemplate, analysis: EventAnalysis): GameCustomization[] {
    // Generate customizations based on analysis
    return []; // Simplified for now
  }

  private identifyWarnings(game: GameTemplate, analysis: EventAnalysis): string[] {
    const warnings: string[] = [];
    
    if (game.cultural.languageDependent && analysis.cautionAreas.includes('language-barriers')) {
      warnings.push('This game requires good language skills');
    }
    
    return warnings;
  }

  private calculateUserPreference(game: GameTemplate, userFeedback: GameFeedback[]): number {
    if (userFeedback.length === 0) return 1.0;
    
    // Calculate preference based on similar games user has played
    const similarGameFeedback = userFeedback.filter(fb => 
      // Find games in same category
      this.gamesCatalog.find(g => g.id === fb.gameId)?.category === game.category
    );
    
    if (similarGameFeedback.length === 0) return 1.0;
    
    const avgRating = similarGameFeedback.reduce((sum, fb) => sum + fb.ratings.overall, 0) / similarGameFeedback.length;
    return avgRating / 10; // Normalize to 0-1
  }

  private generatePersonalizedReasoning(game: GameTemplate, userFeedback: GameFeedback[]): string[] {
    const reasons: string[] = [];
    
    if (userFeedback.length > 0) {
      const categoryFeedback = userFeedback.filter(fb => 
        this.gamesCatalog.find(g => g.id === fb.gameId)?.category === game.category
      );
      
      if (categoryFeedback.length > 0) {
        const avgRating = categoryFeedback.reduce((sum, fb) => sum + fb.ratings.overall, 0) / categoryFeedback.length;
        if (avgRating > 7) {
          reasons.push(`You've enjoyed similar ${game.category} games in the past`);
        }
      }
    }
    
    return reasons;
  }
}

// Export singleton instance
export const aiGameEngine = new AIGameEngine();