// Shared data models and interfaces for PartyHaus
// Use these types across both React Web and Flutter Mobile platforms

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  eventDate: Date;
  hostId: string;
  hostName?: string;
  imageUrl?: string;
  maxGuests?: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guest {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'confirmed' | 'declined';
  joinedAt: Date;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string; // e.g., "30-60 min"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  instructions?: string;
  createdAt: Date;
}

export interface EventGame {
  id: string;
  eventId: string;
  gameId: string;
  gameName: string;
  scheduledTime?: Date;
  status: 'planned' | 'active' | 'completed';
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

// Form Types
export interface CreateEventForm {
  name: string;
  description: string;
  location: string;
  eventDate: Date;
  maxGuests?: number;
  isPublic: boolean;
}

export interface UpdateEventForm extends Partial<CreateEventForm> {
  id: string;
}

export interface CreateGameForm {
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  instructions?: string;
}

// Auth Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  name?: string;
}

export interface UserProfile {
  name?: string;
  avatar?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event_invite' | 'event_reminder' | 'game_invite' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Filter/Search Types
export interface EventFilters {
  search?: string;
  category?: 'upcoming' | 'past' | 'this_week' | 'this_month';
  hostId?: string;
  isPublic?: boolean;
}

export interface GameFilters {
  search?: string;
  category?: string;
  minPlayers?: number;
  maxPlayers?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// State Types (for both GetX and React state management)
export interface EventState {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: AppError | null;
}

export interface GameState {
  games: Game[];
  selectedGame: Game | null;
  isLoading: boolean;
  error: AppError | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
}

// Constants
export const APP_CONSTANTS = {
  MAX_EVENT_NAME_LENGTH: 100,
  MAX_EVENT_DESCRIPTION_LENGTH: 500,
  MIN_PASSWORD_LENGTH: 6,
  MAX_GUESTS_PER_EVENT: 100,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

export const GAME_CATEGORIES = [
  'Party Games',
  'Board Games', 
  'Card Games',
  'Interactive',
  'Quick Games',
  'Team Games',
] as const;

export const EVENT_STATUSES = [
  'draft',
  'published', 
  'active',
  'completed',
  'cancelled',
] as const;

// Utility Types
export type GameCategory = typeof GAME_CATEGORIES[number];
export type EventStatus = typeof EVENT_STATUSES[number];
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// API Endpoint Constants
export const API_ENDPOINTS = {
  // Auth
  SIGN_UP: '/auth/signup',
  SIGN_IN: '/auth/signin', 
  SIGN_OUT: '/auth/signout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Users
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  
  // Events
  GET_EVENTS: '/events',
  GET_EVENT: '/events/:id',
  CREATE_EVENT: '/events',
  UPDATE_EVENT: '/events/:id',
  DELETE_EVENT: '/events/:id',
  JOIN_EVENT: '/events/:id/join',
  LEAVE_EVENT: '/events/:id/leave',
  
  // Games
  GET_GAMES: '/games',
  GET_GAME: '/games/:id',
  CREATE_GAME: '/games',
  UPDATE_GAME: '/games/:id',
  DELETE_GAME: '/games/:id',
  
  // Guests
  GET_EVENT_GUESTS: '/events/:id/guests',
  INVITE_GUEST: '/events/:id/invite',
  UPDATE_GUEST_STATUS: '/events/:eventId/guests/:guestId',
} as const;