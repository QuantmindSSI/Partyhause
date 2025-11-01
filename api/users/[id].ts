/**
 * User Profile API
 * GET /api/users/[id] - Get public user profile with stats
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface UserProfile {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header (optional for public profiles)
    const authHeader = req.headers.authorization;
    let viewerId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      viewerId = user?.id || null;
    }

    // Get user ID from path
    const userId = req.query.id as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize viewer relationship data
    let viewerIsFollowing = false;
    let viewerIsFollower = false;
    let viewerIsMutual = false;
    let viewerHasPendingRequest = false;
    let viewerIsBlocked = false;
    let viewerHasBlocked = false;
    let mutualCrewCount: number | undefined;

    if (viewerId) {
      // Check if viewer is following this user
      const { data: followingConn } = await supabase
        .from('connections')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', userId)
        .single();
      
      viewerIsFollowing = !!followingConn;

      // Check if this user is following viewer
      const { data: followerConn } = await supabase
        .from('connections')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', viewerId)
        .single();
      
      viewerIsFollower = !!followerConn;
      viewerIsMutual = viewerIsFollowing && viewerIsFollower;

      // Check for pending request
      const { data: pendingRequest } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('requester_id', viewerId)
        .eq('target_id', userId)
        .eq('status', 'pending')
        .single();
      
      viewerHasPendingRequest = !!pendingRequest;

      // Check if viewer is blocked
      const { data: blocked } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', userId)
        .eq('blocked_id', viewerId)
        .single();
      
      viewerIsBlocked = !!blocked;

      // Check if viewer has blocked this user
      const { data: hasBlocked } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', viewerId)
        .eq('blocked_id', userId)
        .single();
      
      viewerHasBlocked = !!hasBlocked;

      // Get mutual crew count
      const { data: mutualCount } = await supabase
        .rpc('get_mutual_crew_count', { user1: viewerId, user2: userId });
      mutualCrewCount = mutualCount || 0;
    }

    // Build response
    const response: UserProfile = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      cover_photo_url: profile.cover_photo_url,
      location: profile.location,
      website_url: profile.website_url,
      
      partycrew_count: profile.partycrew_count,
      crewing_count: profile.crewing_count,
      events_hosted: profile.events_hosted,
      haus_score: profile.haus_score,
      
      is_verified: profile.is_verified,
      is_private: profile.is_private,
      account_type: profile.account_type,
      
      viewer_is_following: viewerIsFollowing,
      viewer_is_follower: viewerIsFollower,
      viewer_is_mutual: viewerIsMutual,
      viewer_has_pending_request: viewerHasPendingRequest,
      viewer_is_blocked: viewerIsBlocked,
      viewer_has_blocked: viewerHasBlocked,
      mutual_crew_count: mutualCrewCount,
      
      created_at: profile.created_at,
      last_active_at: profile.last_active_at
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[User Profile Error]:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
