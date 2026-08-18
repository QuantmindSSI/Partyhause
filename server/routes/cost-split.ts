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

    const totalAmountNum = Number(total_amount);
    if (!Number.isFinite(totalAmountNum) || totalAmountNum <= 0) {
      return res.status(400).json({ error: 'total_amount must be a positive number' });
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

    // Get attending guests. Canonical rsvp vocabulary is
    // ('pending','accepted','declined','maybe'); 'confirmed' is accepted for
    // backward compatibility with rows written before the vocabulary was
    // unified (invite-join used to write 'confirmed').
    const guests = await prisma.guest.findMany({
      where: {
        event_id,
        rsvp_status: { in: ['accepted', 'confirmed'] },
      },
      select: { id: true, name: true, email: true, user_id: true },
    });

    if (!guests || guests.length === 0) {
      return res.status(400).json({ error: 'No confirmed guests to split costs with' });
    }

    // Calculate splits in integer cents so the parts always sum exactly to
    // the total (floating-point per-guest rounding drifts: $100/3 would
    // otherwise collect $99.99 and $100/6 would collect $100.02).
    const splits: Array<{ guest_id: string; amount: number }> = [];
    const totalCents = Math.round(totalAmountNum * 100);

    if (split_method === 'equal') {
      const baseCents = Math.floor(totalCents / guests.length);
      let remainderCents = totalCents - baseCents * guests.length;

      guests.forEach((guest) => {
        // Distribute the remainder one cent at a time (largest-remainder method).
        const cents = baseCents + (remainderCents > 0 ? 1 : 0);
        if (remainderCents > 0) remainderCents -= 1;
        splits.push({ guest_id: guest.id, amount: cents / 100 });
      });
    } else if (split_method === 'custom') {
      if (!custom_splits || typeof custom_splits !== 'object' || Array.isArray(custom_splits)) {
        return res.status(400).json({ error: 'custom_splits required for custom split method' });
      }

      const eventGuestIds = new Set(guests.map((g) => g.id));
      let sumCents = 0;

      for (const [guest_id, rawAmount] of Object.entries(custom_splits)) {
        const amount = Number(rawAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({
            error: `custom_splits amount for guest ${guest_id} must be a positive number`,
          });
        }
        if (!eventGuestIds.has(guest_id)) {
          return res.status(400).json({
            error: `Guest ${guest_id} is not an attending guest of this event`,
          });
        }
        const cents = Math.round(amount * 100);
        sumCents += cents;
        splits.push({ guest_id, amount: cents / 100 });
      }

      if (splits.length === 0) {
        return res.status(400).json({ error: 'custom_splits must contain at least one guest' });
      }

      if (sumCents !== totalCents) {
        return res.status(400).json({
          error: `custom_splits must sum to total_amount (expected ${(totalCents / 100).toFixed(2)}, got ${(sumCents / 100).toFixed(2)})`,
        });
      }
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

    // Update guests table (scoped to this event — guest ids were validated
    // against the event's guest list above, updateMany keeps it defensive).
    await Promise.all(
      splits.map((split) =>
        prisma.guest.updateMany({
          where: { id: split.guest_id, event_id },
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

    // Update the cost split request. findFirst + update (instead of a bare
    // update) so an id/event mismatch surfaces as 404 rather than a P2025 500.
    const existing = await prisma.costSplitRequest.findFirst({
      where: { id: split_id, event_id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Cost split request not found for this event' });
    }

    const updated = await prisma.costSplitRequest.update({
      where: { id: split_id },
      data: updateData,
    });

    // Update guest payment status (scoped to this event)
    if (status === 'paid') {
      await prisma.guest.updateMany({
        where: { id: updated.guest_id, event_id },
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

    const deleted = await prisma.costSplitRequest.deleteMany({
      where: {
        id: split_id,
        event_id,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Cost split request not found for this event' });
    }

    return res.status(200).json({ message: 'Cost split deleted' });
  } catch (error: unknown) {
    console.error('Cost split error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

export default router;
