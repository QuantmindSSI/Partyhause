/**
 * PartyBoard Types - Collaborative Planning Canvas for Web
 * 
 * Ported from mobile PartyHub types
 */

export type StickyType = 'note' | 'poll' | 'idea' | 'image' | 'link' | 'video' | 'checklist' | 'cost';
export type BoardCategory = 'all' | 'venue' | 'entertainment' | 'food' | 'activities' | 'decor' | 'other';
export type SessionStatus = 'active' | 'ended';

// PartyBoard Session
export interface PartyBoardSession {
  id: string;
  event_id: string;
  created_by: string;
  title: string;
  category?: string;
  duration_minutes: number;
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
  items_count: number;
  participants: string[];
}

// Base Sticky Item
export interface StickyItem {
  id: string;
  session_id?: string;
  event_id: string;
  type: StickyType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  z_index: number;
  category?: BoardCategory;
  reaction_count: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at?: string;
  data: NoteStickyData | PollStickyData | IdeaStickyData | ImageStickyData | LinkStickyData | ChecklistStickyData | CostStickyData;
}

// Note Sticky Data
export interface NoteStickyData {
  content: string;
  color: string;
  font_size: number;
}

// Poll Sticky Data
export interface PollStickyData {
  question: string;
  options: PollOption[];
  poll_type: 'single-choice' | 'multiple-choice';
  total_votes: number;
  status: 'active' | 'closed';
  ends_at?: string;
  discussion_mode?: boolean;
  positions?: {
    for: DebatePoint[];
    against: DebatePoint[];
  };
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface DebatePoint {
  id: string;
  user_id: string;
  user_name: string;
  side: 'for' | 'against';
  content: string;
  votes: number;
  created_at: string;
}

// Idea Sticky Data
export interface IdeaStickyData {
  content: string;
  category?: BoardCategory;
  estimated_cost?: number;
  reactions: number;
  converted_to_task: boolean;
}

// Image Sticky Data
export interface ImageStickyData {
  url: string;
  caption?: string;
  aspect_ratio: number;
  thumbnail_url?: string;
}

// Link Sticky Data
export interface LinkStickyData {
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  domain?: string;
}

// Video Sticky Data
export interface VideoStickyData {
  url: string;
  platform: 'youtube' | 'vimeo' | 'other';
  thumbnail_url?: string;
  title?: string;
  duration?: number;
}

// Checklist Sticky Data
export interface ChecklistStickyData {
  title: string;
  items: ChecklistItem[];
  completed_count: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assigned_to?: string;
}

// Cost Sticky Data
export interface CostStickyData {
  title: string;
  amount: number;
  currency: string;
  category?: BoardCategory;
  notes?: string;
  paid_by?: string;
  split_with?: string[];
}

// Board Item (for list view)
export interface PartyBoardItem {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  content: string;
  category?: BoardCategory;
  estimated_cost?: number;
  media_type?: 'image' | 'video' | 'link' | 'text';
  image_url?: string;
  video_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  position_x: number;
  position_y: number;
  reaction_count: number;
  converted_to_task: boolean;
  created_at: string;
}

// Canvas State
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  gridSize: number;
  showGrid: boolean;
}

// Canvas Stats
export interface CanvasStats {
  ideas: number;
  tasks: number;
  votes: number;
  stickies: number;
}

// Category Info
export interface CategoryInfo {
  id: BoardCategory;
  label: string;
  icon: string;
  color: string;
}

// Sticky Colors
export interface StickyColor {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

// Creation Data Types
export interface CreateNoteData {
  content: string;
  color: string;
  category?: BoardCategory;
  position?: { x: number; y: number };
}

export interface CreatePollData {
  question: string;
  options: string[];
  poll_type: 'single-choice' | 'multiple-choice';
  category?: BoardCategory;
  position?: { x: number; y: number };
}

export interface CreateIdeaData {
  content: string;
  category?: BoardCategory;
  estimated_cost?: number;
  position?: { x: number; y: number };
}

export interface CreateImageData {
  url: string;
  caption?: string;
  category?: BoardCategory;
  position?: { x: number; y: number };
}

export interface CreateLinkData {
  url: string;
  category?: BoardCategory;
  position?: { x: number; y: number };
}

export interface CreateChecklistData {
  title: string;
  items: string[];
  category?: BoardCategory;
  position?: { x: number; y: number };
}

// Update Data Types
export interface UpdateStickyPosition {
  sticky_id: string;
  position: { x: number; y: number };
}

export interface UpdateStickyData {
  sticky_id: string;
  data: Partial<NoteStickyData | PollStickyData | IdeaStickyData | ImageStickyData | LinkStickyData | ChecklistStickyData | CostStickyData>;
}
