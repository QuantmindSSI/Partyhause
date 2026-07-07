// Express route: /api/events
// CRUD operations for events (Prisma-based replacement for api/events.ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

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
        guests_accepted: guests.filter((g) => g.rsvp_status === 'accepted').length,
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
      template_data: template_data || {},
      timeline_blocks: timeline_blocks || [],
      title,
      description: description || null,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      timezone: timezone || 'UTC',
      host_id: userId,
      privacy: privacy || 'private',
      settings: settings || {},
      status: 'draft',
    };

    if (location) {
      eventData.location_name = location.name;
      eventData.location_address = location.address;
      // location_coordinates is a POINT column (Unsupported type) — skip coordinates
      // as Prisma cannot write to Unsupported("point") fields directly.
    }

    const event = await prisma.event.create({
      data: eventData as any,
    });

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
      template_data,
      timeline_blocks,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (timezone !== undefined) updateData.timezone = timezone;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (status !== undefined) updateData.status = status;
    if (settings !== undefined) updateData.settings = settings;
    if (template_data !== undefined) updateData.template_data = template_data;
    if (timeline_blocks !== undefined) updateData.timeline_blocks = timeline_blocks;

    if (location) {
      if (location.name !== undefined) updateData.location_name = location.name;
      if (location.address !== undefined) updateData.location_address = location.address;
      // location_coordinates is a POINT column (Unsupported type) — skip coordinates
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData as any,
    });

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

    await prisma.event.delete({
      where: { id },
    });

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
