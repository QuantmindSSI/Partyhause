// API endpoint: POST /api/join-event
// Join event as guest via invite token (QR code)

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

const getUserFromAuth = async (req: VercelRequest): Promise<{ id: string; email?: string } | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email };
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
    const { token, name, email, also_add_to_crew = false } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token required' });
    }

    // Get user if authenticated
    const user = await getUserFromAuth(req);

    // Validate and increment token usage
    const { data: isValid } = await supabaseAdmin.rpc('increment_token_usage', {
      token_input: token,
      user_id_input: user?.id || null,
    });

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid or expired invite token',
        code: 'TOKEN_INVALID',
      });
    }

    // Get token details
    const { data: tokenData } = await supabaseAdmin
      .from('event_invite_tokens')
      .select('event_id, token_type, require_approval, event:events(*)')
      .eq('token', token)
      .single();

    if (!tokenData) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const event_id = tokenData.event_id;
    const token_type = tokenData.token_type;

    // Check if user is already a guest
    if (user) {
      const { data: existingGuest } = await supabaseAdmin
        .from('guests')
        .select('id, rsvp_status')
        .eq('event_id', event_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingGuest) {
        return res.status(200).json({
          message: 'Already joined this event',
          guest: existingGuest,
          event: tokenData.event,
        });
      }
    }

    // Create guest entry
    const guestData: Record<string, unknown> = {
      event_id,
      name: user ? name || 'Guest' : name,
      email: user?.email || email,
      user_id: user?.id || null,
      rsvp_status: tokenData.require_approval ? 'pending' : 'confirmed',
      email_status: 'not_sent',
    };

    const { data: guest, error: guestError } = await supabaseAdmin
      .from('guests')
      .insert(guestData)
      .select()
      .single();

    if (guestError) throw guestError;

    // Handle crew connection if requested
    let connection = null;
    if (also_add_to_crew && user?.id && (token_type === 'crew_invite' || token_type === 'guest_and_crew')) {
      const hostId = (tokenData.event as any).host_id;

      // Check if connection already exists
      const { data: existingConn } = await supabaseAdmin
        .from('connections')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', hostId)
        .maybeSingle();

      if (!existingConn) {
        // Check if host is private
        const { data: hostProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('is_private')
          .eq('id', hostId)
          .single();

        if (hostProfile?.is_private) {
          // Send connection request
          const { data: request } = await supabaseAdmin
            .from('connection_requests')
            .insert({
              requester_id: user.id,
              target_id: hostId,
              status: 'pending',
              message: `Met at: ${(tokenData.event as any).name}`,
            })
            .select()
            .single();

          connection = { type: 'request_sent', request };
        } else {
          // Create direct connection
          const { data: conn } = await supabaseAdmin
            .from('connections')
            .insert({
              follower_id: user.id,
              following_id: hostId,
            })
            .select()
            .single();

          // Log conversion
          await supabaseAdmin
            .from('guest_crew_conversions')
            .insert({
              event_id,
              guest_id: guest.id,
              user_id: user.id,
              converted_by: user.id,
              conversion_type: 'guest_accepted',
              connection_id: conn.id,
              connection_status: 'accepted',
            });

          connection = { type: 'connected', connection: conn };
        }
      } else {
        connection = { type: 'already_connected' };
      }
    }

    return res.status(201).json({
      message: 'Successfully joined event',
      guest,
      event: tokenData.event,
      connection,
      show_crew_prompt: !also_add_to_crew && user?.id && (token_type === 'crew_invite' || token_type === 'guest_and_crew'),
    });
  } catch (error: unknown) {
    console.error('Join event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
