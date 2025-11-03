/**
 * PartyCrew Types for Web Application
 * Ported from mobile app
 */

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  location: string | null;
  website_url: string | null;
  
  // Stats
  partycrew_count: number;
  crewing_count: number;
  events_hosted: number;
  haus_score: number;
  
  // Account info
  is_verified: boolean;
  is_private: boolean;
  account_type: string;
  
  // Viewer relationship
  viewer_is_following: boolean;
  viewer_is_follower: boolean;
  viewer_is_mutual: boolean;
  viewer_has_pending_request: boolean;
  viewer_is_blocked: boolean;
  viewer_has_blocked: boolean;
  mutual_crew_count?: number;
  
  // Timestamps
  created_at: string;
  last_active_at: string;
}

export interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_mutual: boolean;
  account_type: string;
  events_hosted: number;
  followed_at: string;
}

export interface CrewStatus {
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  connection: {
    id: string;
    created_at: string;
    notify_on_events: boolean;
    notify_on_posts: boolean;
  } | null;
  request: {
    id: string;
    status: string;
    created_at: string;
  } | null;
}

export interface FeedPost {
  id: string;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  content_type: 'update' | 'photo' | 'video' | 'poll' | 'event_announcement' | 'tip' | 'recap';
  title: string | null;
  body: string | null;
  media_urls: string[];
  event_id: string | null;
  poll_options: any;
  
  likes_count: number;
  comments_count: number;
  shares_count: number;
  
  viewer_has_liked: boolean;
  viewer_has_commented: boolean;
  
  published_at: string;
  feed_score: number;
}

export interface ToggleResponse {
  success: boolean;
  action: 'joined' | 'left' | 'requested';
  partycrew_count?: number;
  message: string;
  error?: string;
}

export type FilterTab = 'all' | 'events' | 'tips' | 'recaps';
