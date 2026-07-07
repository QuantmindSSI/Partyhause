// Express route: /api/cost-split
// Create and manage event cost splitting
// Replaces Vercel serverless function api/cost-split.ts

import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/cost-split/:eventId - get cost split summary for an event
// ---------------------------------------------------------------------------
router.get('/:eventId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const event_id = req.params.eventId;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    // Verify user is event host
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { host_id: true, name: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can manage cost splits' });
    }

    // Get cost split summary
    const summary = await prisma.eventCostSummary.findUnique({
      where: { event_id },
    });

    // Get cost split requests with guest info
    const splits = await prisma.costSplitRequest.findMany({
      where: { event_id },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            user_id: true,
            rsvp_status: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

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
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// ---------------------------------------------------------------------------
// POST /api/cost-split - create cost split requests for an event
// ---------------------------------------------------------------------------
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      event_id,
      split_method,
      total_amount,
      custom_splits,
      description,
      due_date,
      currency = 'USD',
    } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    if (!split_method || !total_amount) {
      return res.status(400).json({ error: 'split_method and total_amount required' });
    }

    // Verify user is event host
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { host_id: true, name: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can manage cost splits' });
    }

    // Get confirmed guests
    const guests = await prisma.guest.findMany({
      where: {
        event_id,
        rsvp_status: 'confirmed',
      },
      select: { id: true, name: true, email: true, user_id: true },
    });

    if (!guests || guests.length === 0) {
      return res.status(400).json({ error: 'No confirmed guests to split costs with' });
    }

    // Calculate splits
    const splits: Array<{ guest_id: string; amount: number }> = [];

    if (split_method === 'equal') {
      const amountPerGuest = parseFloat((total_amount / guests.length).toFixed(2));
      guests.forEach((guest) => {
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
    const createdSplits = await prisma.costSplitRequest.createManyAndReturn({
      data: splits.map((split) => ({
        event_id,
        guest_id: split.guest_id,
        amount: split.amount,
        currency,
        description: description || `Cost share for ${event.name}`,
        status: 'pending',
        created_by: userId,
        due_date: due_date || null,
      })),
    });

    // Fetch the created splits with guest info (createManyAndReturn doesn't include relations)
    const createdSplitIds = createdSplits.map((s) => s.id);
    const splitsWithGuests = await prisma.costSplitRequest.findMany({
      where: { id: { in: createdSplitIds } },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            user_id: true,
          },
        },
      },
    });

    // Update guests table
    await Promise.all(
      splits.map((split) =>
        prisma.guest.update({
          where: { id: split.guest_id },
          data: {
            cost_share_enabled: true,
            cost_share_amount: split.amount,
          },
        }),
      ),
    );

    return res.status(201).json({
      message: 'Cost split requests created',
      splits: splitsWithGuests,
      total_guests: splits.length,
      total_amount: total_amount,
    });
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/cost-split/:id - update cost split request (e.g. mark as paid)
// ---------------------------------------------------------------------------
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const split_id = req.params.id;
    const { event_id, status, payment_method, payment_reference } = req.body;

    if (!split_id || !status) {
      return res.status(400).json({ error: 'split_id and status required' });
    }

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    // Verify user is event host
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { host_id: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can manage cost splits' });
    }

    // Build update data
    const updateData: {
      status: string;
      paid_at?: Date;
      payment_method?: string;
      payment_reference?: string;
    } = {
      status,
    };

    if (status === 'paid') {
      updateData.paid_at = new Date();
      if (payment_method) updateData.payment_method = payment_method;
      if (payment_reference) updateData.payment_reference = payment_reference;
    }

    // Update the cost split request
    const updated = await prisma.costSplitRequest.update({
      where: {
        id: split_id,
        event_id,
      },
      data: updateData,
    });

    // Update guest payment status
    if (status === 'paid') {
      await prisma.guest.update({
        where: { id: updated.guest_id },
        data: { payment_status: 'paid' },
      });
    }

    return res.status(200).json({
      message: 'Cost split updated',
      split: updated,
    });
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/cost-split/:id - delete cost split request
// ---------------------------------------------------------------------------
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const split_id = req.params.id;
    const { event_id } = req.body;

    if (!split_id) {
      return res.status(400).json({ error: 'split_id required' });
    }

    if (!event_id) {
      return res.status(400).json({ error: 'event_id required' });
    }

    // Verify user is event host
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { host_id: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'Only event host can manage cost splits' });
    }

    await prisma.costSplitRequest.deleteMany({
      where: {
        id: split_id,
        event_id,
      },
    });

    return res.status(200).json({ message: 'Cost split deleted' });
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

export default router;
