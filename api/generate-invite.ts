// API endpoint: POST /api/events/:id/generate-invite
// Generate QR code invite token for event

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

    const { event_id } = req.query;
    const {
      token_type = 'guest_and_crew',
      max_uses = null,
      expires_in_hours = null,
      allowed_emails = null,
      require_approval = false,
    } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    // Verify user is event host
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('host_id')
      .eq('id', event_id)
      .single();

    if (!event || event.host_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to manage this event' });
    }

    // Calculate expiration
    const expires_at = expires_in_hours
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
      : null;

    // Generate token (call DB function)
    const { data: tokenData } = await supabaseAdmin.rpc('generate_invite_token');
    const token = tokenData as string;

    // Insert invite token
    const { data: inviteToken, error } = await supabaseAdmin
      .from('event_invite_tokens')
      .insert({
        event_id,
        token,
        token_type,
        max_uses,
        expires_at,
        allowed_emails,
        require_approval,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR code data
    const baseUrl = process.env.VITE_APP_URL || 'https://www.partyhause.com';
    const inviteUrl = `${baseUrl}/join/${token}`;

    return res.status(201).json({
      token: inviteToken,
      invite_url: inviteUrl,
      qr_data: inviteUrl,
    });
  } catch (error: unknown) {
    console.error('Generate invite error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
