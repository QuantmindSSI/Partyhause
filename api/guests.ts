// API endpoint: /api/guests
// CRUD operations for event guests and RSVP management

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';
import { randomUUID } from 'crypto';

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

// Generate QR code content
function generateQRCode(guestId: string, eventId: string): string {
  return `partyhause://checkin/${eventId}/${guestId}`;
}

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
    // GET /api/guests?eventId=xxx - List guests for an event
    // GET /api/guests?id=xxx - Get single guest
    if (req.method === 'GET') {
      const { id, eventId } = req.query;

      if (id && typeof id === 'string') {
        // Get single guest
        const { data: guest, error } = await supabase
          .from('guests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Guest not found' });
          }
          throw error;
        }

        return res.status(200).json({ guest });
      }

      if (eventId && typeof eventId === 'string') {
        // List guests for event
        const { data: guests, error } = await supabase
          .from('guests')
          .select('*')
          .eq('event_id', eventId)
          .order('name', { ascending: true });

        if (error) throw error;

        // Get RSVP statistics
        const stats = {
          total: guests?.length || 0,
          accepted: guests?.filter((g: any) => g.rsvp_status === 'accepted').length || 0,
          declined: guests?.filter((g: any) => g.rsvp_status === 'declined').length || 0,
          maybe: guests?.filter((g: any) => g.rsvp_status === 'maybe').length || 0,
          pending: guests?.filter((g: any) => g.rsvp_status === 'pending').length || 0,
          checkedIn: guests?.filter((g: any) => g.checked_in).length || 0,
        };

        return res.status(200).json({ guests: guests || [], stats });
      }

      return res.status(400).json({ error: 'eventId or id required' });
    }

    // POST /api/guests - Add guests (supports bulk import)
    if (req.method === 'POST') {
      const { eventId, guests } = req.body;

      if (!eventId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'eventId is required',
        });
      }

      if (!guests || !Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'guests array is required and must not be empty',
        });
      }

      // Validate and prepare guest data
      const guestData = guests.map(guest => {
        if (!guest.name) {
          throw new Error('Guest name is required');
        }

        const guestId = randomUUID();
        return {
          id: guestId,
          event_id: eventId,
          name: guest.name,
          email: guest.email || null,
          phone: guest.phone || null,
          ticket_type: guest.ticketType || null,
          ticket_id: guest.ticketId || randomUUID(),
          qr_code: generateQRCode(guestId, eventId),
          plus_ones: guest.plusOnes || 0,
          dietary_restrictions: guest.dietaryRestrictions || [],
          custom_fields: guest.customFields || {},
          role: guest.role || 'guest',
          rsvp_status: 'pending',
        };
      });

      const { data: insertedGuests, error } = await supabase
        .from('guests')
        .insert(guestData)
        .select();

      if (error) throw error;

      return res.status(201).json({
        guests: insertedGuests,
        success: true,
        count: insertedGuests?.length || 0,
      });
    }

    // PATCH /api/guests?id=xxx - Update guest (RSVP, check-in, etc.)
    if (req.method === 'PATCH') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Guest ID required' });
      }

      const {
        rsvpStatus,
        plusOnes,
        dietaryRestrictions,
        customFields,
        checkedIn,
        name,
        email,
        phone,
      } = req.body;

      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (rsvpStatus !== undefined) updateData.rsvp_status = rsvpStatus;
      if (plusOnes !== undefined) updateData.plus_ones = plusOnes;
      if (dietaryRestrictions !== undefined) updateData.dietary_restrictions = dietaryRestrictions;
      if (customFields !== undefined) updateData.custom_fields = customFields;
      
      if (checkedIn !== undefined) {
        updateData.checked_in = checkedIn;
        if (checkedIn) {
          updateData.checked_in_at = new Date().toISOString();
        }
      }

      const { data: guest, error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Guest not found' });
        }
        throw error;
      }

      return res.status(200).json({ guest, success: true });
    }

    // DELETE /api/guests?id=xxx - Remove guest
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Guest ID required' });
      }

      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Guests API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
