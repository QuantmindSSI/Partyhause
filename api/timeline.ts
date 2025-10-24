// API endpoint: /api/timeline
// CRUD operations for event timeline blocks

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
    // GET /api/timeline?eventId=xxx - Get timeline for an event
    // GET /api/timeline?id=xxx - Get single timeline block
    if (req.method === 'GET') {
      const { id, eventId } = req.query;

      if (id && typeof id === 'string') {
        // Get single timeline block
        const { data: block, error } = await supabase
          .from('timeline_blocks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Timeline block not found' });
          }
          throw error;
        }

        return res.status(200).json({ block });
      }

      if (eventId && typeof eventId === 'string') {
        // Get timeline for event
        const { data: blocks, error } = await supabase
          .from('timeline_blocks')
          .select('*')
          .eq('event_id', eventId)
          .order('start_time', { ascending: true });

        if (error) throw error;

        return res.status(200).json({ blocks: blocks || [] });
      }

      return res.status(400).json({ error: 'eventId or id required' });
    }

    // POST /api/timeline - Add timeline block
    if (req.method === 'POST') {
      const {
        eventId,
        label,
        description,
        startTime,
        duration,
        type,
        hostNotes,
        guestVisible,
        notifyBefore,
        location,
        assignedTo,
      } = req.body;

      if (!eventId || !label || !startTime || !duration || !type) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'eventId, label, startTime, duration, and type are required',
        });
      }

      // Get max order_index for this event
      const { data: maxOrder } = await supabase
        .from('timeline_blocks')
        .select('order_index')
        .eq('event_id', eventId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const orderIndex = (maxOrder?.order_index || 0) + 1;

      const blockData = {
        event_id: eventId,
        label,
        description: description || null,
        start_time: startTime,
        duration,
        type,
        host_notes: hostNotes || null,
        guest_visible: guestVisible !== undefined ? guestVisible : true,
        notify_before: notifyBefore || null,
        location: location || null,
        assigned_to: assignedTo || [],
        order_index: orderIndex,
      };

      const { data: block, error } = await supabase
        .from('timeline_blocks')
        .insert(blockData)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ block, success: true });
    }

    // PATCH /api/timeline?id=xxx - Update timeline block
    if (req.method === 'PATCH') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Timeline block ID required' });
      }

      const {
        label,
        description,
        startTime,
        duration,
        type,
        hostNotes,
        guestVisible,
        notifyBefore,
        location,
        assignedTo,
        orderIndex,
      } = req.body;

      const updateData: any = {};

      if (label !== undefined) updateData.label = label;
      if (description !== undefined) updateData.description = description;
      if (startTime !== undefined) updateData.start_time = startTime;
      if (duration !== undefined) updateData.duration = duration;
      if (type !== undefined) updateData.type = type;
      if (hostNotes !== undefined) updateData.host_notes = hostNotes;
      if (guestVisible !== undefined) updateData.guest_visible = guestVisible;
      if (notifyBefore !== undefined) updateData.notify_before = notifyBefore;
      if (location !== undefined) updateData.location = location;
      if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
      if (orderIndex !== undefined) updateData.order_index = orderIndex;

      const { data: block, error } = await supabase
        .from('timeline_blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Timeline block not found' });
        }
        throw error;
      }

      return res.status(200).json({ block, success: true });
    }

    // DELETE /api/timeline?id=xxx - Delete timeline block
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Timeline block ID required' });
      }

      const { error } = await supabase
        .from('timeline_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Timeline API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
