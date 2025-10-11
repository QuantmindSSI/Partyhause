// Game types and interfaces for PartyHaus
import { z } from 'zod';

// Game categories
export type GameCategory = 
  | 'icebreaker'
  | 'trivia'
  | 'creative'
  | 'physical'
  | 'social'
  | 'professional';

// Game difficulty levels  
export type GameDifficulty = 'easy' | 'medium' | 'hard';

// Game energy levels
export type GameEnergy = 'low' | 'medium' | 'high';

// Game status
export type GameStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

// Base game interface
export interface Game {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  energy: GameEnergy;
  duration: number; // in minutes
  minPlayers: number;
  maxPlayers: number | null;
  instructions: string;
  materials?: string[];
  tags: string[];
  icon: string;
  color: string;
}

// Game session for active games
export interface GameSession {
  id: string;
  eventId: string;
  gameId: string;
  hostId: string;
  status: GameStatus;
  participants: string[]; // guest IDs
  currentRound?: number;
  totalRounds?: number;
  scores?: Record<string, number>;
  settings?: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  data?: Record<string, any>; // game-specific data
}

// Trivia specific interfaces
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
  difficulty: GameDifficulty;
  explanation?: string;
  points?: number;
}

export interface TriviaGame extends Game {
  questions: TriviaQuestion[];
  timePerQuestion: number;
  showCorrectAnswer: boolean;
  allowSkipping: boolean;
}

// Icebreaker specific interfaces
export interface IcebreakerQuestion {
  id: string;
  question: string;
  category: string;
  followUp?: string[];
  tags: string[];
}

export interface IcebreakerGame extends Game {
  questions: IcebreakerQuestion[];
  timePerQuestion?: number;
  randomOrder: boolean;
}

// Bingo specific interfaces
export interface BingoSquare {
  id: string;
  text: string;
  category?: string;
  requiresPhoto?: boolean;
  description?: string;
}

export interface BingoGame extends Game {
  squares: BingoSquare[];
  boardSize: number; // 3x3, 4x4, 5x5
  winConditions: ('row' | 'column' | 'diagonal' | 'full_house')[];
  timeLimit?: number;
}

// Validation schemas
export const gameSessionSchema = z.object({
  eventId: z.string().uuid(),
  gameId: z.string(),
  participants: z.array(z.string().uuid()),
  settings: z.record(z.any()).optional(),
});

export const triviaAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string(),
  participantId: z.string().uuid(),
  answerIndex: z.number().min(0).max(3),
  timeToAnswer: z.number().min(0),
});

export const bingoMarkSchema = z.object({
  sessionId: z.string().uuid(),
  squareId: z.string(),
  participantId: z.string().uuid(),
  photoUrl: z.string().optional(),
});

// Game templates - these will be our built-in games
export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  component: string; // React component name
  defaultSettings: Record<string, any>;
  customizable: string[]; // which settings can be customized
  eventTypes: string[]; // which event types this works best for
}

// Real-time game events
export interface GameEvent {
  type: 'game_started' | 'round_started' | 'answer_submitted' | 'game_ended' | 'score_updated';
  sessionId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export default Game;