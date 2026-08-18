// Express route: /api/guests
// CRUD operations for event guests and RSVP management (Prisma-based
// replacement for api/guests.ts)

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { broadcastEvent } from '../lib/pubsub';
import {
  getEventAccess,
  canManageGuests,
  canInviteGuests,
} from '../lib/event-access';

const router = Router();

// All guest routes require authentication
router.use(requireAuth);

// Generate QR code content
function generateQRCode(guestId: string, eventId: string): string {
  return `partyhause://checkin/${eventId}/${guestId}`;
}

/**
 * RLS parity ("Guests can view/update their own record"): the caller IS this
 * guest when the row carries their user id or their email.
 */
function isOwnGuestRecord(
  guest: { user_id: string | null; email: string },
  userId: string,
  userEmail?: string,
): boolean {
  if (guest.user_id && guest.user_id === userId) return true;
  return !!userEmail && guest.email.toLowerCase() === userEmail.toLowerCase();
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

      // RLS parity: hosts/co-hosts see any guest of their event; a guest may
      // read their OWN record.
      if (!isOwnGuestRecord(guest, req.user!.id, req.user?.email)) {
        const access = await getEventAccess(guest.event_id, req.user!.id, req.user?.email);
        if (!canManageGuests(access)) {
          return res.status(404).json({ error: 'Guest not found' });
        }
      }

      return res.status(200).json({ guest });
    }

    if (eventId && typeof eventId === 'string') {
      // RLS parity: only the host or a co-host may list an event's guests.
      const access = await getEventAccess(eventId, req.user!.id, req.user?.email);
      if (!canManageGuests(access)) {
        return res.status(403).json({ error: 'Only the event host or co-hosts can view the guest list' });
      }

      // List guests for event
      const guests = await prisma.guest.findMany({
        where: { event_id: eventId },
        orderBy: { name: 'asc' },
      });

      // Get RSVP statistics
      const stats = {
        total: guests.length,
        // 'confirmed' is legacy vocabulary for 'accepted' (pre-unification
        // invite joins) — count both so older rows are not invisible.
        accepted: guests.filter(
          (g) => g.rsvp_status === 'accepted' || g.rsvp_status === 'confirmed',
        ).length,
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

    // RLS parity: adding guests = host, or co-host with can_invite.
    const access = await getEventAccess(eventId, req.user!.id, req.user?.email);
    if (!canInviteGuests(access)) {
      return res.status(403).json({
        error: 'Only the event host or an inviting co-host can add guests',
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
        // guests.email is NOT NULL in the schema (empty string = "no email").
        email: guest.email || '',
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
      email_status,
      last_email_sent_at,
      email_log_id,
    } = req.body;

    // rsvp_status vocabulary (schema.prisma Guest.rsvp_status CHECK comment;
    // 'confirmed' accepted as legacy alias for rows written pre-unification).
    const VALID_RSVP = ['pending', 'accepted', 'declined', 'maybe', 'confirmed'];
    if (rsvpStatus !== undefined && !VALID_RSVP.includes(rsvpStatus)) {
      return res.status(400).json({
        error: `rsvpStatus must be one of: ${VALID_RSVP.join(', ')}`,
      });
    }

    // RLS parity: hosts/co-hosts can update any guest of their event; a
    // guest may update their OWN record (RSVP self-service) but not
    // host/system-operated fields (check-in, email tracking).
    const existingGuest = await prisma.guest.findUnique({
      where: { id },
      select: { event_id: true, user_id: true, email: true },
    });

    if (!existingGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const isSelf = isOwnGuestRecord(existingGuest, req.user!.id, req.user?.email);
    if (!isSelf) {
      const access = await getEventAccess(
        existingGuest.event_id,
        req.user!.id,
        req.user?.email,
      );
      if (!canManageGuests(access)) {
        return res.status(404).json({ error: 'Guest not found' });
      }
    } else {
      const access = await getEventAccess(
        existingGuest.event_id,
        req.user!.id,
        req.user?.email,
      );
      const isManager = canManageGuests(access);
      const touchesHostFields =
        checkedIn !== undefined ||
        email_status !== undefined ||
        last_email_sent_at !== undefined ||
        email_log_id !== undefined;
      if (!isManager && touchesHostFields) {
        return res.status(403).json({
          error: 'Guests can only update their own RSVP and personal details',
        });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || '';
    if (phone !== undefined) updateData.phone = phone;
    if (rsvpStatus !== undefined) updateData.rsvp_status = rsvpStatus;
    if (plusOnes !== undefined) updateData.plus_ones = plusOnes;
    if (dietaryRestrictions !== undefined) updateData.dietary_restrictions = dietaryRestrictions;
    if (customFields !== undefined) updateData.custom_fields = customFields;

    // Email-tracking fields written by sendEmailWithTracking; email_log_id is
    // what the Resend webhook uses to correlate delivery events to guests.
    if (email_status !== undefined) updateData.email_status = email_status;
    if (last_email_sent_at !== undefined) {
      const d = new Date(last_email_sent_at);
      if (!isNaN(d.getTime())) updateData.last_email_sent_at = d;
    }
    if (email_log_id !== undefined) updateData.email_log_id = email_log_id || null;

    if (checkedIn !== undefined) {
      updateData.checked_in = checkedIn;
      // Set the timestamp on check-in, clear it on un-check-in (previously
      // the stale timestamp survived an un-check).
      updateData.checked_in_at = checkedIn ? new Date() : null;
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

    if (!existing) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // RLS parity: only the host or a co-host can remove guests.
    const access = await getEventAccess(existing.event_id, req.user!.id, req.user?.email);
    if (!canManageGuests(access)) {
      return res.status(404).json({ error: 'Guest not found' });
    }

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
