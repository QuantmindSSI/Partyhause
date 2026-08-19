// server/routes/notifications.ts — in-app notification center.
//
// Notification rows are created by other routes (partycrew joins/requests,
// etc.). This route lets the signed-in user read them, see the unread count
// for the bell badge, and mark them read. All endpoints are scoped to the
// caller — a user can only ever see or mutate their own notifications.

import { Router, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const MAX_PAGE_SIZE = 100;

// GET /api/notifications?limit=30&unread=true
// Newest first, with the actor's public profile basics for rendering.
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limitRaw = Number.parseInt(String(req.query.limit ?? '30'), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_PAGE_SIZE) : 30;
    const unreadOnly = req.query.unread === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { read: false } : {}),
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
      },
    });

    res.json({ notifications });
  } catch (err) {
    console.error('[Notifications] list error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// GET /api/notifications/unread-count — bell badge.
router.get('/unread-count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: {
        user_id: req.user!.id,
        read: false,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    });
    res.json({ count });
  } catch (err) {
    console.error('[Notifications] unread-count error:', err);
    res.status(500).json({ error: 'Failed to load unread count' });
  }
});

// POST /api/notifications/mark-read
// Body: { ids: string[] } to mark specific rows, or { all: true } for all.
router.post('/mark-read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids, all } = req.body as { ids?: unknown; all?: unknown };

    if (all === true) {
      const result = await prisma.notification.updateMany({
        where: { user_id: userId, read: false },
        data: { read: true },
      });
      return res.json({ success: true, updated: result.count });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide { ids: string[] } or { all: true }' });
    }
    if (ids.length > MAX_PAGE_SIZE) {
      return res.status(400).json({ error: `At most ${MAX_PAGE_SIZE} ids per call` });
    }
    if (!ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 64)) {
      return res.status(400).json({ error: 'ids must be non-empty strings' });
    }

    // user_id in the WHERE clause makes cross-user marking impossible.
    const result = await prisma.notification.updateMany({
      where: { id: { in: ids as string[] }, user_id: userId },
      data: { read: true },
    });

    res.json({ success: true, updated: result.count });
  } catch (err) {
    console.error('[Notifications] mark-read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

export default router;
