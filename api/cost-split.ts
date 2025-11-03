// API endpoint: POST /api/events/:id/cost-split
// Create and manage event cost splitting

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = await getUserFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event_id } = req.query;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    // Verify user is event host
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('host_id, name')
      .eq('id', event_id)
      .single();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can manage cost splits' });
    }

    // GET: Retrieve cost split summary
    if (req.method === 'GET') {
      const { data: summary } = await supabaseAdmin
        .from('event_cost_summaries')
        .select('*')
        .eq('event_id', event_id)
        .single();

      const { data: splits } = await supabaseAdmin
        .from('cost_split_requests')
        .select(`
          *,
          guest:guests (
            id,
            name,
            email,
            user_id,
            rsvp_status
          )
        `)
        .eq('event_id', event_id)
        .order('created_at', { ascending: false });

      return res.status(200).json({
        summary: summary || {
          event_id,
          total_event_cost: 0,
          total_collected: 0,
          total_pending: 0,
          guests_with_splits: 0,
          guests_paid: 0,
        },
        splits: splits || [],
      });
    }

    // POST: Create cost split requests
    if (req.method === 'POST') {
      const { split_method, total_amount, custom_splits, description, due_date, currency = 'USD' } = req.body;

      if (!split_method || !total_amount) {
        return res.status(400).json({ error: 'split_method and total_amount required' });
      }

      // Get confirmed guests
      const { data: guests } = await supabaseAdmin
        .from('guests')
        .select('id, name, email, user_id')
        .eq('event_id', event_id)
        .eq('rsvp_status', 'confirmed');

      if (!guests || guests.length === 0) {
        return res.status(400).json({ error: 'No confirmed guests to split costs with' });
      }

      // Calculate splits
      const splits: Array<{ guest_id: string; amount: number }> = [];

      if (split_method === 'equal') {
        const amountPerGuest = parseFloat((total_amount / guests.length).toFixed(2));
        guests.forEach(guest => {
          splits.push({ guest_id: guest.id, amount: amountPerGuest });
        });
      } else if (split_method === 'custom') {
        if (!custom_splits || typeof custom_splits !== 'object') {
          return res.status(400).json({ error: 'custom_splits required for custom split method' });
        }
        Object.entries(custom_splits).forEach(([guest_id, amount]) => {
          splits.push({ guest_id, amount: parseFloat(amount as string) });
        });
      } else {
        return res.status(400).json({ error: 'Invalid split_method' });
      }

      // Create cost split requests
      const requests = splits.map(split => ({
        event_id,
        guest_id: split.guest_id,
        amount: split.amount,
        currency,
        description: description || `Cost share for ${event.name}`,
        status: 'pending',
        created_by: userId,
        due_date: due_date || null,
      }));

      const { data: createdSplits, error } = await supabaseAdmin
        .from('cost_split_requests')
        .insert(requests)
        .select(`
          *,
          guest:guests (
            id,
            name,
            email,
            user_id
          )
        `);

      if (error) throw error;

      // Update guests table
      await Promise.all(
        splits.map(split =>
          supabaseAdmin
            .from('guests')
            .update({
              cost_share_enabled: true,
              cost_share_amount: split.amount,
            })
            .eq('id', split.guest_id)
        )
      );

      return res.status(201).json({
        message: 'Cost split requests created',
        splits: createdSplits,
        total_guests: splits.length,
        total_amount: total_amount,
      });
    }

    // PUT: Update split status (mark as paid)
    if (req.method === 'PUT') {
      const { split_id, status, payment_method, payment_reference } = req.body;

      if (!split_id || !status) {
        return res.status(400).json({ error: 'split_id and status required' });
      }

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.payment_method = payment_method;
        updateData.payment_reference = payment_reference;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('cost_split_requests')
        .update(updateData)
        .eq('id', split_id)
        .eq('event_id', event_id)
        .select()
        .single();

      if (error) throw error;

      // Update guest payment status
      if (status === 'paid') {
        await supabaseAdmin
          .from('guests')
          .update({ payment_status: 'paid' })
          .eq('id', updated.guest_id);
      }

      return res.status(200).json({
        message: 'Cost split updated',
        split: updated,
      });
    }

    // DELETE: Remove cost split request
    if (req.method === 'DELETE') {
      const { split_id } = req.body;

      if (!split_id) {
        return res.status(400).json({ error: 'split_id required' });
      }

      const { error } = await supabaseAdmin
        .from('cost_split_requests')
        .delete()
        .eq('id', split_id)
        .eq('event_id', event_id);

      if (error) throw error;

      return res.status(200).json({ message: 'Cost split deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
