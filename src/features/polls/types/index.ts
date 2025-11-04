/**
 * Poll Types - Collaborative Voting Features for Web
 * 
 * Ported from mobile PartyHub types
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

export interface CreatePollData {
  question: string;
  poll_type: PollType;
  options: { text: string; description?: string }[];
  ends_at?: string;
  auto_close_on_consensus?: boolean;
  consensus_threshold?: number;
}

export interface VoteData {
  option_ids: string[];
}
