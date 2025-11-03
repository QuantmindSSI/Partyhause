// API endpoint: POST /api/convert-guest-to-crew
// Convert event guest to crew member (host-initiated)

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

const getUserFromAuth = async (req: VercelRequest): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (error) {
    return null;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { guest_id, event_id } = req.body;

    if (!guest_id || !event_id) {
      return res.status(400).json({ error: 'guest_id and event_id required' });
    }

    // Verify user is event host
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('host_id')
      .eq('id', event_id)
      .single();

    if (!event || event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can convert guests to crew' });
    }

    // Call DB function to convert
    const { data: connectionId, error } = await supabaseAdmin.rpc('convert_guest_to_crew', {
      p_guest_id: guest_id,
      p_converted_by: userId,
      p_conversion_type: 'host_promoted',
    });

    if (error) {
      if (error.message?.includes('already in crew')) {
        return res.status(400).json({ error: 'Guest is already in your crew' });
      }
      if (error.message?.includes('must have a user account')) {
        return res.status(400).json({
          error: 'Guest must sign up for an account before being added to crew',
          code: 'GUEST_NO_ACCOUNT',
        });
      }
      throw error;
    }

    // Get updated connection details
    const { data: connection } = await supabaseAdmin
      .from('connections')
      .select(`
        id,
        created_at,
        user_profiles!connections_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('id', connectionId)
      .single();

    return res.status(201).json({
      message: 'Guest promoted to crew successfully',
      connection,
      connection_id: connectionId,
    });
  } catch (error: unknown) {
    console.error('Convert guest to crew error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
