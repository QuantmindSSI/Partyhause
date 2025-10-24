// Shared data models and interfaces for PartyHause
// Use these types across both React Web and Expo Mobile platforms
// These types match the database schema from template implementation Phase 1

// ============================================================================
// ENUMS
// ============================================================================

export type TemplateType =
  | 'birthday_adult'
  | 'birthday_kids'
  | 'wedding_intimate'
  | 'wedding_full'
  | 'product_launch'
  | 'fundraiser'
  | 'music_festival'
  | 'conference'
  | 'group_travel'
  | 'block_party'
  | 'class_workshop'
  | 'hackathon';

export type EventStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled' | 'archived';
export type EventPrivacy = 'public' | 'private' | 'unlisted';
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe' | 'waitlist';
export type GuestRole = 'host' | 'co_host' | 'guest' | 'vendor' | 'volunteer' | 'vip';
export type TimelineBlockType = 'activity' | 'meal' | 'speech' | 'performance' | 'break' | 'ceremony' | 'game' | 'custom';
export type MediaType = 'photo' | 'video' | 'audio' | 'document';
export type MediaStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'flagged';
export type ActivityType = 'poll' | 'trivia' | 'scavenger' | 'vote' | 'quiz' | 'challenge' | 'leaderboard';
export type ActivityStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  name?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Event {
  id: string;
  templateType?: TemplateType;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  location?: Location;
  privacy: EventPrivacy;
  status: EventStatus;
  hostId: string;
  settings: Record<string, any>;
  coverImageUrl?: string;
  maxGuests?: number;
  currentGuests: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields (for backward compatibility)
  name?: string;
  eventDate?: Date;
  isPublic?: boolean;
}

export interface EventCoHost {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  permissions: {
    can_edit?: boolean;
    can_invite?: boolean;
    can_moderate?: boolean;
  };
  invitedAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  rsvpStatus: RsvpStatus;
  ticketType?: string;
  ticketId?: string;
  qrCode?: string;
  plusOnes: number;
  dietaryRestrictions?: string[];
  customFields?: Record<string, any>;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  role: GuestRole;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields (for backward compatibility)
  userId?: string;
  userName?: string;
  userEmail?: string;
  status?: 'pending' | 'confirmed' | 'declined';
  joinedAt?: Date;
}

export interface Ticket {
  id: string;
  eventId: string;
  type: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  settings: {
    requires_approval?: boolean;
    max_per_order?: number;
  };
  salesStartDate?: Date;
  salesEndDate?: Date;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineBlock {
  id: string;
  eventId: string;
  label: string;
  description?: string;
  startTime: Date;
  duration: number; // minutes
  type: TimelineBlockType;
  hostNotes?: string;
  guestVisible: boolean;
  notifyBefore?: number; // minutes
  notificationSent: boolean;
  location?: string;
  assignedTo?: string[]; // user IDs
  orderIndex: number;
  color?: string; // hex color
  icon?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  eventId: string;
  uploaderId: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos/audio in seconds
  fileSize?: number;
  mimeType?: string;
  tags: string[];
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  capturedAt?: Date;
  uploadedAt: Date;
  status: MediaStatus;
  moderationNotes?: string;
  credits?: string;
  metadata?: Record<string, any>;
  perceptualHash?: string; // for deduplication
  createdAt: Date;
}

export interface Album {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  coverMediaId?: string;
  privacy: EventPrivacy | 'event_only';
  createdBy: string;
  mediaCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumMedia {
  id: string;
  albumId: string;
  mediaId: string;
  orderIndex: number;
  addedAt: Date;
}

export interface Activity {
  id: string;
  eventId: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // minutes
  config: Record<string, any>; // type-specific configuration
  results: Record<string, any>; // aggregated results
  participantCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  score: number;
  completed: boolean;
  responses: Record<string, any>; // user's responses/submissions
  metadata?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  role: string; // caterer, photographer, venue, etc.
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  contractUrl?: string;
  notes?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorTask {
  id: string;
  vendorId: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightReel {
  id: string;
  eventId: string;
  title?: string;
  description?: string;
  duration?: number; // seconds
  videoUrl?: string;
  thumbnailUrl?: string;
  style?: string; // template style used
  status: 'queued' | 'processing' | 'completed' | 'failed';
  mediaIds: string[]; // array of media IDs used
  config?: Record<string, any>;
  errorMessage?: string;
  createdBy?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface EventAnalytics {
  id: string;
  eventId: string;
  metricDate: Date;
  rsvpCount: number;
  attendanceCount: number;
  mediaUploads: number;
  activityParticipation: number;
  uniqueParticipants: number;
  metrics: Record<string, any>; // detailed metrics
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ACTIVITY CONFIG TYPES
// ============================================================================

export interface PollConfig {
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  allowMultiple: boolean;
  showResultsLive: boolean;
}

export interface TriviaConfig {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>;
  timePerQuestion: number; // seconds
}

export interface ScavengerConfig {
  checkpoints: Array<{
    id: string;
    name: string;
    description: string;
    location?: {
      lat: number;
      lng: number;
    };
    points: number;
    completedBy: string[];
  }>;
  requirePhoto: boolean;
}

// ============================================================================
// LEGACY GAME INTERFACES (for backward compatibility)
// ============================================================================

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

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

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
  data?: Record<string, unknown>;
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
  details?: Record<string, unknown>;
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