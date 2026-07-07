// Express route: /api/timeline
// CRUD operations for event timeline blocks (Prisma-based replacement
// for api/timeline.ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All timeline routes require authentication
router.use(requireAuth);

// GET /api/timeline/:eventId - Get timeline blocks for an event
router.get('/:eventId', async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId required' });
    }

    const blocks = await prisma.timelineBlock.findMany({
      where: { event_id: eventId },
      orderBy: { start_time: 'asc' },
    });

    return res.status(200).json({ blocks: blocks || [] });
  } catch (error: unknown) {
    console.error('Timeline API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// POST /api/timeline - Add timeline block
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
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
    const maxOrderBlock = await prisma.timelineBlock.findFirst({
      where: { event_id: eventId },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    const orderIndex = (maxOrderBlock?.order_index || 0) + 1;

    const block = await prisma.timelineBlock.create({
      data: {
        event_id: eventId,
        label,
        description: description || null,
        start_time: new Date(startTime),
        duration,
        type,
        host_notes: hostNotes || null,
        guest_visible: guestVisible !== undefined ? guestVisible : true,
        notify_before: notifyBefore || null,
        location: location || null,
        assigned_to: assignedTo || [],
        order_index: orderIndex,
      },
    });

    return res.status(201).json({ block, success: true });
  } catch (error: unknown) {
    console.error('Timeline API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// PUT /api/timeline/:id - Update timeline block
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
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

    const updateData: Record<string, unknown> = {};

    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.start_time = new Date(startTime);
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (hostNotes !== undefined) updateData.host_notes = hostNotes;
    if (guestVisible !== undefined) updateData.guest_visible = guestVisible;
    if (notifyBefore !== undefined) updateData.notify_before = notifyBefore;
    if (location !== undefined) updateData.location = location;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (orderIndex !== undefined) updateData.order_index = orderIndex;

    const block = await prisma.timelineBlock.update({
      where: { id },
      data: updateData as any,
    });

    return res.status(200).json({ block, success: true });
  } catch (error: unknown) {
    console.error('Timeline API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Timeline block not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// DELETE /api/timeline/:id - Delete timeline block
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Timeline block ID required' });
    }

    await prisma.timelineBlock.delete({
      where: { id },
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error('Timeline API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Timeline block not found' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
