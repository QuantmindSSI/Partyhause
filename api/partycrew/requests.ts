/**
 * Connection Requests API
 * GET /api/partycrew/requests - List pending requests (received)
 * POST /api/partycrew/requests - Accept a request
 * DELETE /api/partycrew/requests - Reject/cancel a request
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ConnectionRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
    bio: string | null;
  };
  message: string | null;
  created_at: string;
}

interface RequestsListResponse {
  requests: ConnectionRequest[];
  total: number;
  has_more: boolean;
}

interface AcceptRequestBody {
  requestId: string;
}

interface RejectRequestBody {
  requestId: string;
  reason?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get authorization
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

  if (req.method === 'GET') {
    return handleGetRequests(req, res, supabase, user.id);
  } else if (req.method === 'POST') {
    return handleAcceptRequest(req, res, supabase, user.id);
  } else if (req.method === 'DELETE') {
    return handleRejectRequest(req, res, supabase, user.id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET - List pending requests
async function handleGetRequests(
  req: VercelRequest, 
  res: VercelResponse, 
  supabase: any, 
  userId: string
) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '20'), 100);
    const offset = parseInt(req.query.offset as string || '0');
    const type = req.query.type as string || 'received'; // received | sent

    let query = supabase
      .from('connection_requests')
      .select(`
        id,
        message,
        created_at,
        requester_id,
        target_id,
        user_profiles!connection_requests_requester_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          is_verified,
          bio
        )
      `, { count: 'exact' })
      .eq('status', 'pending');

    if (type === 'received') {
      query = query.eq('target_id', userId);
    } else {
      query = query.eq('requester_id', userId);
    }

    const { data: requests, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Get Requests Error]:', error);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    const formattedRequests: ConnectionRequest[] = (requests || []).map((req: any) => ({
      id: req.id,
      requester: {
        id: req.user_profiles.id,
        username: req.user_profiles.username,
        display_name: req.user_profiles.display_name,
        avatar_url: req.user_profiles.avatar_url,
        is_verified: req.user_profiles.is_verified,
        bio: req.user_profiles.bio
      },
      message: req.message,
      created_at: req.created_at
    }));

    const response: RequestsListResponse = {
      requests: formattedRequests,
      total: count || 0,
      has_more: offset + limit < (count || 0)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Get Requests Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Accept request
async function handleAcceptRequest(
  req: VercelRequest, 
  res: VercelResponse, 
  supabase: any, 
  userId: string
) {
  try {
    const { requestId }: AcceptRequestBody = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from('connection_requests')
      .select('id, requester_id, target_id, status')
      .eq('id', requestId)
      .eq('target_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    // Create the connection
    const { error: connectionError } = await supabase
      .from('connections')
      .insert({
        follower_id: request.requester_id,
        following_id: request.target_id
      });

    if (connectionError) {
      // Check if already exists
      if (connectionError.code === '23505') {
        return res.status(400).json({ error: 'Connection already exists' });
      }
      console.error('[Create Connection Error]:', connectionError);
      return res.status(500).json({ error: 'Failed to create connection' });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[Update Request Error]:', updateError);
    }

    // Create notification for requester
    await supabase
      .from('notifications')
      .insert({
        user_id: request.requester_id,
        type: 'connection_request',
        title: 'Request Accepted! 🎉',
        body: 'accepted your PartyCrew request',
        actor_id: userId,
        action_data: { request_id: requestId }
      });

    return res.status(200).json({
      success: true,
      message: 'Request accepted',
      request_id: requestId
    });

  } catch (error) {
    console.error('[Accept Request Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Reject/cancel request
async function handleRejectRequest(
  req: VercelRequest, 
  res: VercelResponse, 
  supabase: any, 
  userId: string
) {
  try {
    const { requestId, reason }: RejectRequestBody = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the request (can be target rejecting or requester canceling)
    const { data: request, error: fetchError } = await supabase
      .from('connection_requests')
      .select('id, requester_id, target_id, status')
      .eq('id', requestId)
      .eq('status', 'pending')
      .or(`target_id.eq.${userId},requester_id.eq.${userId}`)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const isRejection = request.target_id === userId;
    const newStatus = isRejection ? 'rejected' : 'cancelled';

    // Update request status
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[Update Request Error]:', updateError);
      return res.status(500).json({ error: 'Failed to update request' });
    }

    // Optionally create notification if rejected (not cancelled)
    if (isRejection && reason) {
      await supabase
        .from('notifications')
        .insert({
          user_id: request.requester_id,
          type: 'connection_request',
          title: 'Request Not Accepted',
          body: 'Your PartyCrew request was not accepted',
          actor_id: userId,
          action_data: { request_id: requestId, reason }
        });
    }

    return res.status(200).json({
      success: true,
      message: isRejection ? 'Request rejected' : 'Request cancelled',
      request_id: requestId,
      status: newStatus
    });

  } catch (error) {
    console.error('[Reject Request Error]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
