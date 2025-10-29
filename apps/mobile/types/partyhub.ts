/**
 * PartyHub Types - Unified Collaborative Planning Features
 * 
 * PartyHub is the central collaborative space for event planning,
 * centered around the PartyBoard where all features (polls, debates, 
 * ideas) are integrated as interactive board items.
 */

export type PollType = 'single-choice' | 'multiple-choice' | 'ranking';
export type PollStatus = 'active' | 'closed' | 'consensus-reached';

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  votes: number;
  voters: string[]; // user IDs
  user_has_voted?: boolean; // Whether current user has voted for this option
}

export interface Poll {
  id: string;
  event_id: string;
  node_id?: string;
  created_by: string;
  creator_name: string;
  question: string;
  poll_type: PollType;
  options: PollOption[];
  ends_at?: string;
  auto_close_on_consensus: boolean;
  consensus_threshold: number;
  status: PollStatus;
  total_votes: number;
  total_voters: number;
  created_at: string;
  closed_at?: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  user_name: string;
  option_ids: string[];
  voted_at: string;
}

export interface Comment {
  id: string;
  target_type: 'poll' | 'debate' | 'idea' | 'node';
  target_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  reactions: Reaction[];
  created_at: string;
}

export type ReactionType = 
  | 'love' | 'excited' | 'fire' | 'thumbs-up' | 'idea' 
  | 'thinking' | 'against' | 'expensive' | 'no-time' | 'perfect';

export interface Reaction {
  id: string;
  target_type: 'poll' | 'comment' | 'idea' | 'node' | 'vendor';
  target_id: string;
  user_id: string;
  user_name: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Activity {
  id: string;
  event_id: string;
  node_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  activity_type: 
    | 'poll_created' | 'poll_voted' | 'poll_closed'
    | 'comment_added' | 'reaction_added'
    | 'debate_started' | 'debate_point_added'
    | 'brainstorm_started' | 'idea_added'
    | 'consensus_reached' | 'decision_made'
    | 'task_completed' | 'vendor_updated';
  activity_data: any;
  created_at: string;
  is_live?: boolean;
}

// PartyBoard - Unified planning and inspiration board
export interface PartyBoardSession {
  id: string;
  event_id: string;
  created_by: string;
  title: string;
  category?: string;
  duration_minutes: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  items_count: number;
  participants: string[];
}

export interface PartyBoardItem {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  content: string;
  category?: string; // venue, entertainment, food, activities, decor, other
  estimated_cost?: number;
  // Media fields for inspiration
  media_type?: 'image' | 'video' | 'link' | 'text';
  image_url?: string;
  video_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  // Position for future canvas view
  position_x: number;
  position_y: number;
  reaction_count: number;
  reactions: Reaction[];
  comments: Comment[];
  converted_to_task: boolean;
  created_at: string;
}

// Legacy aliases for backward compatibility
export type BrainstormSession = PartyBoardSession;
export type Idea = PartyBoardItem;


export interface Debate {
  id: string;
  event_id: string;
  node_id?: string;
  created_by: string;
  creator_name: string;
  title?: string; // Keep for backward compatibility
  topic: string; // Main question being debated
  description?: string;
  status: 'active' | 'voting' | 'closed' | 'decided';
  decision?: 'for' | 'against';
  decided_at?: string;
  for_points: DebatePoint[];
  against_points: DebatePoint[];
  for_score: number;
  against_score: number;
  total_participants: number;
  voting_deadline?: string;
  created_at: string;
}

export interface DebatePoint {
  id: string;
  debate_id: string;
  user_id: string;
  user_name: string;
  side: 'for' | 'against'; // Changed from point_type to side
  content: string;
  votes: number; // Changed from upvotes/downvotes to single score
  comments?: Comment[];
  created_at: string;
}

export interface CollaborationPoints {
  user_id: string;
  event_id: string;
  total_points: number;
  actions: {
    tasks_completed: number;
    votes_cast: number;
    ideas_contributed: number;
    comments_posted: number;
    debates_participated: number;
  };
  badges: string[];
  rank: number;
}

export interface LivePresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  current_screen: string;
  current_node_id?: string;
  is_typing: boolean;
  last_activity: string;
}

export interface QuickConsensus {
  id: string;
  event_id: string;
  created_by: string;
  creator_name: string;
  question: string;
  yes_votes: string[]; // user IDs
  no_votes: string[];
  maybe_votes: string[];
  status: 'active' | 'closed';
  consensus_reached: boolean;
  result?: 'yes' | 'no';
  created_at: string;
}

// ============================================================================
// PartyBoard Sticky Types - Unified Board Items
// ============================================================================

/**
 * Board Sticky Types
 * All collaborative features (polls with optional discussion, ideas) exist as sticky items
 * on the PartyBoard canvas alongside notes, images, and other content.
 */

export type BoardStickyType = 
  | 'note' 
  | 'image' 
  | 'link' 
  | 'video' 
  | 'cost' 
  | 'checklist'
  | 'poll'      // NEW: Poll voting sticky (includes discussion mode)
  | 'idea';     // NEW: Idea brainstorm sticky

/**
 * Base Board Sticky Item
 * Common properties for all sticky types on the board
 */
export interface BoardStickyItem {
  id: string;
  event_id: string;
  board_id?: string;
  type: BoardStickyType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  z_index: number;
  category?: string;
  reaction_count: number;
  reactions?: Reaction[];
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at?: string;
  // Type-specific data
  data: NoteStickyData | ImageStickyData | LinkStickyData | VideoStickyData 
      | CostStickyData | ChecklistStickyData | PollStickyData 
      | IdeaStickyData;
}

/**
 * Existing Sticky Data Types
 */
export interface NoteStickyData {
  content: string;
  color: string;
  font_size: number;
}

export interface ImageStickyData {
  url: string;
  caption?: string;
  aspect_ratio: number;
}

export interface LinkStickyData {
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
}

export interface VideoStickyData {
  url: string;
  thumbnail_url?: string;
  duration?: number;
  caption?: string;
}

export interface CostStickyData {
  item_name: string;
  amount: number;
  currency: string;
  notes?: string;
}

export interface ChecklistStickyData {
  title: string;
  items: {
    id: string;
    text: string;
    checked: boolean;
  }[];
}

/**
 * NEW: Poll Sticky Data (UNIFIED with Debate)
 * Interactive voting card with optional discussion mode
 * 
 * Two modes:
 * - Quick Vote: Simple voting on options (default)
 * - Discussion: Debate with for/against points and arguments
 */
export interface PollStickyData {
  question: string;
  description?: string; // Optional context/details
  poll_type: PollType;
  
  // Quick Vote Mode (always present)
  options: PollOption[];
  status: PollStatus;
  total_votes: number;
  total_voters: number;
  ends_at?: string;
  auto_close_on_consensus: boolean;
  consensus_threshold: number;
  consensus_reached?: boolean;
  winning_option_id?: string;
  
  // Discussion Mode (optional - enables debate functionality)
  discussion_mode?: boolean;
  allow_arguments?: boolean; // Allow users to add points
  positions?: {
    for: DebatePoint[];
    against: DebatePoint[];
    neutral?: DebatePoint[];
  };
  for_score?: number;
  against_score?: number;
  total_points?: number;
  resolution?: string;
  resolved_at?: string;
}

/**
 * NEW: Idea Sticky Data
 * Brainstorm/suggestion card with reactions
 */
export interface IdeaStickyData {
  content: string;
  category?: string;
  estimated_cost?: number;
  converted_to_task: boolean;
  task_id?: string;
  votes: number;
  voters: string[]; // user IDs who upvoted
  user_has_voted?: boolean; // Whether current user has voted
  created_by_name?: string; // Name of the creator
}

/**
 * Type Guards for Board Sticky Items
 */
export function isPollSticky(item: BoardStickyItem): item is BoardStickyItem & { data: PollStickyData } {
  return item.type === 'poll';
}

export function isIdeaSticky(item: BoardStickyItem): item is BoardStickyItem & { data: IdeaStickyData } {
  return item.type === 'idea';
}

export function isNoteSticky(item: BoardStickyItem): item is BoardStickyItem & { data: NoteStickyData } {
  return item.type === 'note';
}
