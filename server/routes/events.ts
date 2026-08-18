// Express route: /api/events
// CRUD operations for events (Prisma-based replacement for api/events.ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { broadcastEvent } from '../lib/pubsub';
import {
  getEventAccess,
  canReadEvent,
  canEditEvent,
  canDeleteEvent,
} from '../lib/event-access';

const router = Router();

// All event routes require authentication
router.use(requireAuth);

// GET /api/events - List user's events (hosted + co-hosting + invited)
// GET /api/events/:id - Get single event with statistics
router.get('/:id?', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (id) {
      // Get single event
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // RLS parity: an event is readable by public/host/co-host/invited
      // guest. Anyone else gets 404 (indistinguishable from nonexistent —
      // matches row-level invisibility).
      const access = await getEventAccess(id, userId, req.user?.email);
      if (!canReadEvent(access)) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get event statistics
      const guests = await prisma.guest.findMany({
        where: { event_id: id },
        select: { rsvp_status: true, checked_in: true },
      });

      const timelineCount = await prisma.timelineBlock.count({
        where: { event_id: id },
      });

      const mediaCount = await prisma.media.count({
        where: { event_id: id },
      });

      const stats = {
        total_guests: guests.length,
        // 'confirmed' is legacy vocabulary for 'accepted' — count both.
        guests_accepted: guests.filter(
          (g) => g.rsvp_status === 'accepted' || g.rsvp_status === 'confirmed',
        ).length,
        guests_declined: guests.filter((g) => g.rsvp_status === 'declined').length,
        guests_pending: guests.filter((g) => g.rsvp_status === 'pending').length,
        guests_checked_in: guests.filter((g) => g.checked_in).length,
        timeline_blocks: timelineCount,
        media_count: mediaCount,
      };

      return res.status(200).json({ event, stats });
    }

    // List user's events (hosted + co-hosting + invited)
    // Get events where user is co-host
    const coHostEvents = await prisma.eventCoHost.findMany({
      where: { user_id: userId },
      select: { event_id: true },
    });

    // Get user's email to find events where they are invited as a guest
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const coHostEventIds = coHostEvents.map((e) => e.event_id);

    let guestEventIds: string[] = [];
    if (userRecord?.email) {
      const guestEvents = await prisma.guest.findMany({
        where: { email: userRecord.email },
        select: { event_id: true },
      });
      guestEventIds = guestEvents.map((g) => g.event_id);
    }

    // Combine all event IDs (hosted + co-host + invited)
    const invitedEventIds = new Set<string>([...coHostEventIds, ...guestEventIds]);

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { host_id: userId },
          { id: { in: Array.from(invitedEventIds) } },
        ],
      },
      orderBy: { start_date: 'asc' },
    });

    return res.status(200).json({ events: events || [] });
  } catch (error: unknown) {
    console.error('Events API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// POST /api/events - Create new event
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      template_type,
      template_data,
      timeline_blocks,
      title,
      name,
      description,
      start_date,
      end_date,
      timezone,
      location,
      privacy,
      settings,
      event_type,
      spotify_playlist_url,
      is_public,
      max_guests,
      invite_image_url,
    } = req.body;

    // `title` is the template-era field; the classic creation form sends
    // `name`. Accept either — they are the same business concept and both
    // columns are kept in sync.
    const eventName = title || name;

    // Validation. template_type is optional (nullable column); the
    // "create from scratch" flow legitimately has no template.
    if (!eventName || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'title (or name), start_date, and end_date are required',
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'start_date and end_date must be valid dates',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'end_date must be on or after start_date',
      });
    }

    // The events table requires NOT NULL `name` and `location` (legacy core
    // columns). Derive them from the template-era payload: `title` doubles as
    // `name`, and `location` may arrive as a string or a { name, address } object.
    const locationName =
      typeof location === 'string'
        ? location
        : (location?.name as string | undefined) || null;
    const locationAddress =
      typeof location === 'object' && location !== null
        ? (location.address as string | undefined) || null
        : null;

    const eventData: Record<string, unknown> = {
      template_type: template_type || null,
      template_data: template_data || {},
      timeline_blocks: timeline_blocks || [],
      title: eventName,
      name: eventName,
      description: description || null,
      start_date: startDate,
      end_date: endDate,
      timezone: timezone || 'UTC',
      host_id: userId,
      privacy: privacy || 'private',
      settings: settings || {},
      status: 'draft',
      location: locationAddress || locationName || '',
    };

    if (locationName) eventData.location_name = locationName;
    if (locationAddress) eventData.location_address = locationAddress;
    // location_coordinates is a POINT column (Unsupported type) — skip coordinates
    // as Prisma cannot write to Unsupported("point") fields directly.

    // Optional legacy/core columns the classic creation form sends.
    if (event_type === 'single_day' || event_type === 'multi_day') {
      eventData.event_type = event_type;
    }
    if (spotify_playlist_url !== undefined) {
      eventData.spotify_playlist_url = spotify_playlist_url || null;
    }
    if (typeof is_public === 'boolean') eventData.is_public = is_public;
    if (max_guests !== undefined && max_guests !== null) {
      const maxGuestsNum = Number(max_guests);
      if (Number.isInteger(maxGuestsNum) && maxGuestsNum > 0) {
        eventData.max_guests = maxGuestsNum;
      }
    }
    if (invite_image_url !== undefined) {
      eventData.invite_image_url = invite_image_url || null;
    }

    const event = await prisma.event.create({
      data: eventData as any,
    });

    // Notify connected clients (the realtime hook refetches the event list
    // on 'event-updated' for create/update/delete alike).
    broadcastEvent('partyhause', 'event-updated', { id: event.id });

    return res.status(201).json({ event, success: true });
  } catch (error: unknown) {
    console.error('Events API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    // RLS parity: update = host, or co-host with can_edit. Callers who
    // cannot even read the event get 404; readers without edit rights 403.
    const access = await getEventAccess(id, req.user!.id, req.user?.email);
    if (!canEditEvent(access)) {
      if (!canReadEvent(access)) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(403).json({ error: 'Only the host or an editing co-host can update this event' });
    }

    const {
      title,
      name,
      description,
      start_date,
      end_date,
      timezone,
      location,
      privacy,
      status,
      settings,
      template_data,
      timeline_blocks,
      spotify_playlist_url,
      invite_image_url,
      event_type,
      is_public,
      max_guests,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    // `title` and `name` are the same business concept (template-era vs
    // classic column) — keep both columns in sync whichever key arrives.
    const newName = title !== undefined ? title : name;
    if (newName !== undefined) {
      updateData.title = newName;
      updateData.name = newName;
    }
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) {
      const d = new Date(start_date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'start_date must be a valid date' });
      }
      updateData.start_date = d;
    }
    if (end_date !== undefined) {
      const d = new Date(end_date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'end_date must be a valid date' });
      }
      updateData.end_date = d;
    }
    if (
      updateData.start_date instanceof Date &&
      updateData.end_date instanceof Date &&
      updateData.end_date < updateData.start_date
    ) {
      return res.status(400).json({ error: 'end_date must be on or after start_date' });
    }
    if (timezone !== undefined) updateData.timezone = timezone;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (status !== undefined) updateData.status = status;
    if (settings !== undefined) updateData.settings = settings;
    if (template_data !== undefined) updateData.template_data = template_data;
    if (timeline_blocks !== undefined) updateData.timeline_blocks = timeline_blocks;
    if (spotify_playlist_url !== undefined) {
      updateData.spotify_playlist_url = spotify_playlist_url || null;
    }
    if (invite_image_url !== undefined) updateData.invite_image_url = invite_image_url || null;
    if (event_type === 'single_day' || event_type === 'multi_day') {
      updateData.event_type = event_type;
    }
    if (typeof is_public === 'boolean') updateData.is_public = is_public;
    if (max_guests !== undefined) {
      if (max_guests === null) {
        updateData.max_guests = null;
      } else {
        const maxGuestsNum = Number(max_guests);
        if (Number.isInteger(maxGuestsNum) && maxGuestsNum > 0) {
          updateData.max_guests = maxGuestsNum;
        }
      }
    }

    if (location) {
      if (typeof location === 'string') {
        // Classic form sends location as a plain string.
        updateData.location = location;
      } else {
        if (location.name !== undefined) updateData.location_name = location.name;
        if (location.address !== undefined) updateData.location_address = location.address;
        updateData.location = location.address || location.name || '';
        // location_coordinates is a POINT column (Unsupported type) — skip coordinates
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData as any,
    });

    // Notify connected clients that this event changed so they can refetch.
    broadcastEvent('partyhause', 'event-updated', { id });

    return res.status(200).json({ event, success: true });
  } catch (error: unknown) {
    console.error('Events API error:', error);
    // Prisma P2025 = record not found
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    // RLS parity: only the host can delete an event.
    const access = await getEventAccess(id, req.user!.id, req.user?.email);
    if (!canDeleteEvent(access)) {
      if (!canReadEvent(access)) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(403).json({ error: 'Only the host can delete this event' });
    }

    await prisma.event.delete({
      where: { id },
    });

    broadcastEvent('partyhause', 'event-updated', { id });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error('Events API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
