// Express route: /api/guests
// CRUD operations for event guests and RSVP management (Prisma-based
// replacement for api/guests.ts)

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { broadcastEvent } from '../lib/pubsub';

const router = Router();

// All guest routes require authentication
router.use(requireAuth);

// Generate QR code content
function generateQRCode(guestId: string, eventId: string): string {
  return `partyhause://checkin/${eventId}/${guestId}`;
}

// GET /api/guests?eventId=xxx - List guests for an event (with RSVP stats)
// GET /api/guests/:id - Get single guest
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { id, eventId } = req.query;

    if (id && typeof id === 'string') {
      // Get single guest
      const guest = await prisma.guest.findUnique({
        where: { id },
      });

      if (!guest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      return res.status(200).json({ guest });
    }

    if (eventId && typeof eventId === 'string') {
      // List guests for event
      const guests = await prisma.guest.findMany({
        where: { event_id: eventId },
        orderBy: { name: 'asc' },
      });

      // Get RSVP statistics
      const stats = {
        total: guests.length,
        accepted: guests.filter((g) => g.rsvp_status === 'accepted').length,
        declined: guests.filter((g) => g.rsvp_status === 'declined').length,
        maybe: guests.filter((g) => g.rsvp_status === 'maybe').length,
        pending: guests.filter((g) => g.rsvp_status === 'pending').length,
        checkedIn: guests.filter((g) => g.checked_in).length,
      };

      return res.status(200).json({ guests: guests || [], stats });
    }

    return res.status(400).json({ error: 'eventId or id required' });
  } catch (error: unknown) {
    console.error('Guests API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// POST /api/guests - Add guests (supports bulk import)
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
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
    const guestData = guests.map((guest: any) => {
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

    const insertedGuests = await prisma.guest.createManyAndReturn({
      data: guestData,
    });

    // Notify connected clients that guests for this event changed.
    broadcastEvent('partyhause', 'guest-updated', { eventId });

    return res.status(201).json({
      guests: insertedGuests,
      success: true,
      count: insertedGuests?.length || 0,
    });
  } catch (error: unknown) {
    console.error('Guests API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// PUT /api/guests/:id - Update guest (RSVP, check-in, etc.)
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
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

    const updateData: Record<string, unknown> = {};

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
        updateData.checked_in_at = new Date();
      }
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData as any,
    });

    // Notify connected clients that guests for this event changed.
    broadcastEvent('partyhause', 'guest-updated', { eventId: guest.event_id, id });

    return res.status(200).json({ guest, success: true });
  } catch (error: unknown) {
    console.error('Guests API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Guest not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// DELETE /api/guests/:id - Remove guest
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Guest ID required' });
    }

    // Capture the event_id before deleting so we can broadcast the change.
    const existing = await prisma.guest.findUnique({
      where: { id },
      select: { event_id: true },
    });

    await prisma.guest.delete({
      where: { id },
    });

    if (existing?.event_id) {
      broadcastEvent('partyhause', 'guest-updated', { eventId: existing.event_id, id });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error('Guests API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Guest not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
