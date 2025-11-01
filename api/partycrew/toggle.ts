/**
 * PartyCrew API - Join/Leave Operations
 * POST /api/partycrew/toggle - Join or leave a creator's PartyCrew
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ToggleCrewRequest {
  creatorId: string;
  action?: 'join' | 'leave'; // Optional - will auto-detect if not provided
}

interface ToggleCrewResponse {
  success: boolean;
  action: 'joined' | 'left' | 'requested';
  partycrew_count?: number;
  message: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle POST and GET requests
  if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        action: 'joined', 
        message: 'Missing authorization header' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        action: 'joined', 
        message: 'Invalid or expired token', 
        error: authError?.message 
      });
    }

    // Parse request body
    const body: ToggleCrewRequest = req.body;
    const { creatorId, action } = body;

    if (!creatorId) {
      return res.status(400).json({ 
        success: false, 
        action: 'joined', 
        message: 'Missing creatorId' 
      });
    }

    // Can't follow yourself
    if (creatorId === user.id) {
      return res.status(400).json({ 
        success: false, 
        action: 'joined', 
        message: 'Cannot join your own PartyCrew' 
      });
    }

    // Check if user is blocked
    const { data: blockCheck } = await supabase
      .from('user_blocks')
      .select('id')
      .or(`blocker_id.eq.${creatorId},blocked_id.eq.${user.id}`)
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${creatorId}`)
      .single();

    if (blockCheck) {
      return res.status(403).json({ 
        success: false, 
        action: 'joined', 
        message: 'Cannot join PartyCrew due to block' 
      });
    }

    // Get creator profile to check if private
    const { data: creator, error: creatorError } = await supabase
      .from('user_profiles')
      .select('id, display_name, is_private, partycrew_count')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return res.status(404).json({ 
        success: false, 
        action: 'joined', 
        message: 'Creator not found', 
        error: creatorError?.message 
      });
    }

    // Check if already following
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)
      .single();

    const isFollowing = !!existingConnection;

    // Determine action if not explicitly provided
    const finalAction = action || (isFollowing ? 'leave' : 'join');

    // LEAVE PARTYCREW
    if (finalAction === 'leave') {
      if (!isFollowing) {
        return res.status(400).json({ 
          success: false, 
          action: 'left', 
          message: 'Not currently in this PartyCrew' 
        });
      }

      // Delete connection
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', creatorId);

      if (deleteError) {
        return res.status(500).json({ 
          success: false, 
          action: 'left', 
          message: 'Failed to leave PartyCrew', 
          error: deleteError.message 
        });
      }

      // Also delete any pending requests
      await supabase
        .from('connection_requests')
        .delete()
        .eq('requester_id', user.id)
        .eq('target_id', creatorId);

      return res.status(200).json({
        success: true,
        action: 'left',
        partycrew_count: Math.max((creator.partycrew_count || 0) - 1, 0),
        message: `Left ${creator.display_name}'s PartyCrew`
      });
    }

    // JOIN PARTYCREW
    if (isFollowing) {
      return res.status(400).json({ 
        success: false, 
        action: 'joined', 
        message: 'Already in this PartyCrew' 
      });
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('connection_requests')
      .select('id, status')
      .eq('requester_id', user.id)
      .eq('target_id', creatorId)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(200).json({
          success: true,
          action: 'requested',
          message: `Request already pending for ${creator.display_name}'s PartyCrew`
        });
      }
    }

    // PRIVATE ACCOUNT - Create request
    if (creator.is_private) {
      const { error: requestError } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          target_id: creatorId,
          status: 'pending'
        });

      if (requestError) {
        return res.status(500).json({ 
          success: false, 
          action: 'requested', 
          message: 'Failed to send request', 
          error: requestError.message 
        });
      }

      // Create notification for creator
      await supabase
        .from('notifications')
        .insert({
          user_id: creatorId,
          type: 'connection_request',
          title: 'New PartyCrew Request',
          body: `wants to join your PartyCrew`,
          actor_id: user.id,
          action_data: { request_type: 'partycrew_join' }
        });

      return res.status(200).json({
        success: true,
        action: 'requested',
        message: `Request sent to ${creator.display_name}`
      });
    }

    // PUBLIC ACCOUNT - Create connection immediately
    const { error: insertError } = await supabase
      .from('connections')
      .insert({
        follower_id: user.id,
        following_id: creatorId
      });

    if (insertError) {
      return res.status(500).json({ 
        success: false, 
        action: 'joined', 
        message: 'Failed to join PartyCrew', 
        error: insertError.message 
      });
    }

    // Create notification for creator
    await supabase
      .from('notifications')
      .insert({
        user_id: creatorId,
        type: 'new_partycrew_member',
        title: 'New PartyCrew Member! 🎉',
        body: `joined your PartyCrew`,
        actor_id: user.id
      });

    return res.status(200).json({
      success: true,
      action: 'joined',
      partycrew_count: (creator.partycrew_count || 0) + 1,
      message: `Joined ${creator.display_name}'s PartyCrew!`
    });

  } catch (error) {
    console.error('[PartyCrew Toggle Error]:', error);
    return res.status(500).json({ 
      success: false, 
      action: 'joined',
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// GET endpoint to check connection status
async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get creatorId from query params
    const creatorId = req.query.creatorId as string;

    if (!creatorId) {
      return res.status(400).json({ error: 'Missing creatorId parameter' });
    }

    // Check if following
    const { data: connection } = await supabase
      .from('connections')
      .select('id, created_at, notify_on_events, notify_on_posts')
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)
      .single();

    // Check if pending request
    const { data: pendingRequest } = await supabase
      .from('connection_requests')
      .select('id, status, created_at')
      .eq('requester_id', user.id)
      .eq('target_id', creatorId)
      .eq('status', 'pending')
      .single();

    // Check if mutual
    const { data: mutualConnection } = await supabase
      .from('connections')
      .select('id')
      .eq('follower_id', creatorId)
      .eq('following_id', user.id)
      .single();

    return res.status(200).json({
      isFollowing: !!connection,
      isPending: !!pendingRequest,
      isMutual: !!connection && !!mutualConnection,
      connection: connection || null,
      request: pendingRequest || null
    });

  } catch (error) {
    console.error('[PartyCrew Status Check Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
