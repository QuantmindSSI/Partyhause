// API endpoint: /api/events
// CRUD operations for events

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
const getUserFromAuth = async (req: VercelRequest) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (error) {
    console.warn('Auth lookup failed', error);
    return null;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate
  const user = await getUserFromAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: req.headers.authorization || '',
        },
      },
    }
  );

  try {
    // GET /api/events?id=xxx - Get single event
    // GET /api/events - List user's events
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id && typeof id === 'string') {
        // Get single event
        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Event not found' });
          }
          throw error;
        }

        // Get event statistics
        const { data: guests } = await supabase
          .from('guests')
          .select('rsvp_status, checked_in')
          .eq('event_id', id);

        const { data: timeline } = await supabase
          .from('timeline_blocks')
          .select('id')
          .eq('event_id', id);

        const { data: media } = await supabase
          .from('media')
          .select('id')
          .eq('event_id', id);

        type Guest = { rsvp_status?: string; checked_in?: boolean };
        const stats = {
          total_guests: guests?.length || 0,
          guests_accepted: guests?.filter((g: Guest) => g.rsvp_status === 'accepted').length || 0,
          guests_declined: guests?.filter((g: Guest) => g.rsvp_status === 'declined').length || 0,
          guests_pending: guests?.filter((g: Guest) => g.rsvp_status === 'pending').length || 0,
          guests_checked_in: guests?.filter((g: Guest) => g.checked_in).length || 0,
          timeline_blocks: timeline?.length || 0,
          media_count: media?.length || 0,
        };

        return res.status(200).json({ event, stats });
      }

      // List user's events (hosted + co-hosting + invited)
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .or(`host_id.eq.${user.id},id.in.(${await getEventIdsForUser(supabase, user.id)})`)
        .order('start_date', { ascending: true });

      if (error) throw error;

      return res.status(200).json({ events: events || [] });
    }

    // POST /api/events - Create new event
    if (req.method === 'POST') {
      const {
        template_type,
        title,
        description,
        start_date,
        end_date,
        timezone,
        location,
        privacy,
        settings,
      } = req.body;

      // Validation
      if (!template_type || !title || !start_date || !end_date) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'template_type, title, start_date, and end_date are required',
        });
      }

      const eventData: Record<string, unknown> = {
        template_type,
        title,
        description: description || null,
        start_date,
        end_date,
        timezone: timezone || 'UTC',
        host_id: user.id,
        privacy: privacy || 'private',
        settings: settings || {},
        status: 'draft',
      };

      if (location) {
        eventData.location_name = location.name;
        eventData.location_address = location.address;
        if (location.coordinates) {
          eventData.location_coordinates = `(${location.coordinates.lat},${location.coordinates.lng})`;
        }
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ event, success: true });
    }

    // PATCH /api/events?id=xxx - Update event
    if (req.method === 'PATCH') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Event ID required' });
      }

      const {
        title,
        description,
        start_date,
        end_date,
        timezone,
        location,
        privacy,
        status,
        settings,
      } = req.body;

      const updateData: Record<string, unknown> = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (privacy !== undefined) updateData.privacy = privacy;
      if (status !== undefined) updateData.status = status;
      if (settings !== undefined) updateData.settings = settings;

      if (location) {
        if (location.name !== undefined) updateData.location_name = location.name;
        if (location.address !== undefined) updateData.location_address = location.address;
        if (location.coordinates) {
          updateData.location_coordinates = `(${location.coordinates.lat},${location.coordinates.lng})`;
        }
      }

      const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Event not found' });
        }
        throw error;
      }

      return res.status(200).json({ event, success: true });
    }

    // DELETE /api/events?id=xxx - Delete event
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Event ID required' });
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: unknown) {
    console.error('Events API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}

// Helper: Get event IDs where user is co-host or guest  
async function getEventIdsForUser(supabase: any, userId: string): Promise<string> {
  try {
    // Get events where user is co-host
    const { data: coHostEvents } = await supabase
      .from('event_co_hosts')
      .select('event_id')
      .eq('user_id', userId);

    // Get user email
    const { data: userData } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    type UserData = { email?: string } | null;
    type GuestEvent = { event_id: string };

    // Get events where user is invited
    const userEmail = (userData as UserData)?.email;
    const { data: guestEvents } = userEmail
      ? await supabase
          .from('guests')
          .select('event_id')
          .eq('email', userEmail)
      : { data: [] };

    const eventIds = new Set<string>();
    coHostEvents?.forEach((e: any) => eventIds.add(e.event_id));
    (guestEvents as GuestEvent[] | null)?.forEach((e: GuestEvent) => eventIds.add(e.event_id));

    return Array.from(eventIds).join(',') || 'none';
  } catch (error) {
    return 'none';
  }
}
