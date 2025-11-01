/**
 * Crewing With API
 * GET /api/partycrew/crewing-with?userId={uuid}&limit=20&offset=0
 * Returns list of creators that a user is following (crewing with)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface CrewingWithMember {
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

interface CrewingWithResponse {
  creators: CrewingWithMember[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get query params
    const userId = req.query.userId as string;
    const limit = Math.min(parseInt(req.query.limit as string || '20'), 100);
    const offset = parseInt(req.query.offset as string || '0');

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Check if profile exists
    const { data: targetProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, is_private')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Privacy check - can only see own following list or if profile is public
    if (userId !== user.id && targetProfile.is_private) {
      const { data: isFollowing } = await supabase
        .from('connections')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (!isFollowing) {
        return res.status(403).json({ 
          error: 'This account is private',
          message: 'Join their PartyCrew to see who they\'re crewing with' 
        });
      }
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get following list (crewing with)
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select(`
        following_id,
        created_at,
        user_profiles!connections_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_verified,
          account_type,
          events_hosted
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (connectionsError) {
      console.error('[Get Crewing With Error]:', connectionsError);
      return res.status(500).json({ error: 'Failed to fetch following list' });
    }

    // Check which creators also follow the user back (mutual)
    const creatorIds = connections?.map(c => c.following_id) || [];
    const { data: mutualConnections } = await supabase
      .from('connections')
      .select('follower_id')
      .eq('following_id', userId)
      .in('follower_id', creatorIds);

    const mutualSet = new Set(mutualConnections?.map(c => c.follower_id) || []);

    // Format response
    const creators: CrewingWithMember[] = (connections || []).map(conn => {
      const profile = conn.user_profiles as any;
      return {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_verified: profile.is_verified,
        is_mutual: mutualSet.has(profile.id),
        account_type: profile.account_type,
        events_hosted: profile.events_hosted,
        followed_at: conn.created_at
      };
    });

    const response: CrewingWithResponse = {
      creators,
      total: totalCount || 0,
      has_more: offset + limit < (totalCount || 0),
      limit,
      offset
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Crewing With Error]:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
