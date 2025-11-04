// API endpoint: POST /api/user-connections
// Manage crew connections (follow/unfollow, accept/decline requests)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';

const supabaseAdmin = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false },
  }
);

// Get authenticated user
const getUserFromAuth = async (req: VercelRequest): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (error) {
    console.warn('User connections: Auth lookup failed', error);
    return null;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate user
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET: List user's connections (crew)
    if (req.method === 'GET') {
      const { type = 'following' } = req.query;

      let query;
      if (type === 'following') {
        // Get users this user is following
        query = supabaseAdmin
          .from('connections')
          .select(`
            id,
            following_id,
            created_at,
            notify_on_events,
            user_profiles!connections_following_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              bio,
              partycrew_count,
              events_hosted,
              is_verified
            )
          `)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false });
      } else if (type === 'followers') {
        // Get users following this user
        query = supabaseAdmin
          .from('connections')
          .select(`
            id,
            follower_id,
            created_at,
            user_profiles!connections_follower_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              bio,
              crewing_count,
              events_attended,
              is_verified
            )
          `)
          .eq('following_id', userId)
          .order('created_at', { ascending: false });
      } else if (type === 'mutual') {
        // Get mutual connections
        const { data: following } = await supabaseAdmin
          .from('connections')
          .select('following_id')
          .eq('follower_id', userId);

        const { data: followers } = await supabaseAdmin
          .from('connections')
          .select('follower_id')
          .eq('following_id', userId);

        const followingIds = new Set(following?.map(f => f.following_id) || []);
        const followerIds = new Set(followers?.map(f => f.follower_id) || []);
        const mutualIds = [...followingIds].filter(id => followerIds.has(id));

        const { data: mutualProfiles } = await supabaseAdmin
          .from('user_profiles')
          .select('id, username, display_name, avatar_url, bio, is_verified')
          .in('id', mutualIds);

        return res.status(200).json({ connections: mutualProfiles || [] });
      } else {
        return res.status(400).json({ error: 'Invalid type parameter' });
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({ connections: data || [] });
    }

    // POST: Create connection (follow) or accept request
    if (req.method === 'POST') {
      const { action, target_user_id, connection_request_id } = req.body;

      if (action === 'follow') {
        if (!target_user_id) {
          return res.status(400).json({ error: 'target_user_id required' });
        }

        // Check if target user is private
        const { data: targetProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('is_private')
          .eq('id', target_user_id)
          .single();

        if (targetProfile?.is_private) {
          // Create connection request instead
          const { data: request, error } = await supabaseAdmin
            .from('connection_requests')
            .insert({
              requester_id: userId,
              target_id: target_user_id,
              status: 'pending',
            })
            .select()
            .single();

          if (error) throw error;

          return res.status(201).json({
            type: 'request_sent',
            request,
            message: 'Connection request sent',
          });
        }

        // Public account: create connection directly
        const { data: connection, error } = await supabaseAdmin
          .from('connections')
          .insert({
            follower_id: userId,
            following_id: target_user_id,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            // Duplicate key
            return res.status(400).json({ error: 'Already following' });
          }
          throw error;
        }

        return res.status(201).json({ connection, message: 'Now following' });
      }

      if (action === 'accept_request') {
        if (!connection_request_id) {
          return res.status(400).json({ error: 'connection_request_id required' });
        }

        // Get and verify request
        const { data: request } = await supabaseAdmin
          .from('connection_requests')
          .select('*')
          .eq('id', connection_request_id)
          .eq('target_id', userId)
          .eq('status', 'pending')
          .single();

        if (!request) {
          return res.status(404).json({ error: 'Request not found or already processed' });
        }

        // Create connection
        const { data: connection, error: connError } = await supabaseAdmin
          .from('connections')
          .insert({
            follower_id: request.requester_id,
            following_id: userId,
          })
          .select()
          .single();

        if (connError) throw connError;

        // Update request status
        await supabaseAdmin
          .from('connection_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', connection_request_id);

        return res.status(201).json({
          connection,
          message: 'Connection request accepted',
        });
      }

      if (action === 'decline_request') {
        if (!connection_request_id) {
          return res.status(400).json({ error: 'connection_request_id required' });
        }

        const { error } = await supabaseAdmin
          .from('connection_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', connection_request_id)
          .eq('target_id', userId);

        if (error) throw error;

        return res.status(200).json({ message: 'Request declined' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // DELETE: Remove connection (unfollow)
    if (req.method === 'DELETE') {
      const { target_user_id } = req.body;

      if (!target_user_id) {
        return res.status(400).json({ error: 'target_user_id required' });
      }

      const { error } = await supabaseAdmin
        .from('connections')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', target_user_id);

      if (error) throw error;

      return res.status(200).json({ message: 'Unfollowed successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    console.error('User connections error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
