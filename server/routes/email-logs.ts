// server/routes/email-logs.ts — Email log CRUD for the frontend email tracking module.
// Supports creating, updating, and querying email_logs via Prisma.

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Email logs contain recipient PII — reads/writes scoped to an event must be
 * performed by that event's host.
 */
async function isEventHost(eventId: string, userId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { host_id: true },
  });
  return event?.host_id === userId;
}

// POST /api/email-logs — create an email log entry
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      event_id,
      guest_id,
      template_id,
      template_body,
      email_type,
      recipient_email,
      subject,
      status,
    } = req.body;

    if (!recipient_email || !subject || !email_type) {
      return res.status(400).json({ error: 'Missing required fields: recipient_email, subject, email_type' });
    }

    if (event_id && !(await isEventHost(event_id, req.user!.id))) {
      return res.status(403).json({ error: 'Only the event host can log emails for this event' });
    }

    const emailLog = await prisma.emailLog.create({
      data: {
        event_id: event_id || null,
        guest_id: guest_id || null,
        template_id: template_id || null,
        template_body: template_body || null,
        email_type,
        recipient_email,
        subject,
        status: status || 'pending',
      },
    });

    res.status(201).json({ email_log: emailLog });
  } catch (error: any) {
    console.error('Create email log error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create email log' });
  }
});

// PUT /api/email-logs/:id — update an email log (status, timestamps, resend_email_id)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      resend_email_id,
      sent_at,
      delivered_at,
      opened_at,
      clicked_at,
      bounced_at,
      error_message,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (resend_email_id !== undefined) updateData.resend_email_id = resend_email_id;
    if (sent_at !== undefined) updateData.sent_at = sent_at ? new Date(sent_at) : null;
    if (delivered_at !== undefined) updateData.delivered_at = delivered_at ? new Date(delivered_at) : null;
    if (opened_at !== undefined) updateData.opened_at = opened_at ? new Date(opened_at) : null;
    if (clicked_at !== undefined) updateData.clicked_at = clicked_at ? new Date(clicked_at) : null;
    if (bounced_at !== undefined) updateData.bounced_at = bounced_at ? new Date(bounced_at) : null;
    if (error_message !== undefined) updateData.error_message = error_message;

    const emailLog = await prisma.emailLog.update({
      where: { id },
      data: updateData,
    });

    res.json({ email_log: emailLog });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Email log not found' });
    }
    console.error('Update email log error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update email log' });
  }
});

// GET /api/email-logs — list email logs (filter by eventId or guestId)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId, guestId, limit } = req.query;

    if (!eventId && !guestId) {
      return res.status(400).json({ error: 'eventId or guestId query parameter required' });
    }

    if (eventId && !(await isEventHost(String(eventId), req.user!.id))) {
      return res.status(403).json({ error: 'Only the event host can view email logs for this event' });
    }

    if (guestId && !eventId) {
      const guest = await prisma.guest.findUnique({
        where: { id: String(guestId) },
        select: { event_id: true },
      });
      if (!guest || !(await isEventHost(guest.event_id, req.user!.id))) {
        return res.status(403).json({ error: 'Only the event host can view email logs for this guest' });
      }
    }

    const where: Record<string, unknown> = {};
    if (eventId) where.event_id = String(eventId);
    if (guestId) where.guest_id = String(guestId);

    const emailLogs = await prisma.emailLog.findMany({
      where,
      include: {
        event: { select: { name: true, event_date: true, location: true, invite_image_url: true } },
        guest: { select: { name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit ? Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 500) : 100,
    });

    res.json({ email_logs: emailLogs });
  } catch (error: any) {
    console.error('List email logs error:', error);
    res.status(500).json({ error: error?.message || 'Failed to list email logs' });
  }
});

// GET /api/email-logs/:id — get a single email log
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const emailLog = await prisma.emailLog.findUnique({
      where: { id },
      include: {
        event: { select: { name: true, event_date: true, location: true, invite_image_url: true } },
        guest: { select: { name: true, email: true } },
      },
    });

    if (!emailLog) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    // Event-scoped logs are host-only (recipient PII).
    if (emailLog.event_id && !(await isEventHost(emailLog.event_id, req.user!.id))) {
      return res.status(403).json({ error: 'Only the event host can view this email log' });
    }

    res.json({ email_log: emailLog });
  } catch (error: any) {
    console.error('Get email log error:', error);
    res.status(500).json({ error: error?.message || 'Failed to get email log' });
  }
});

// GET /api/email-logs/analytics — get email analytics for an event
router.get('/analytics/event', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId query parameter' });
    }

    if (!(await isEventHost(String(eventId), req.user!.id))) {
      return res.status(403).json({ error: 'Only the event host can view analytics for this event' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { event_id: String(eventId) },
      select: {
        status: true,
        email_type: true,
      },
    });

    const analytics = {
      total: logs.length,
      sent: logs.filter((l) => ['sent', 'delivered', 'opened', 'clicked'].includes(l.status)).length,
      delivered: logs.filter((l) => ['delivered', 'opened', 'clicked'].includes(l.status)).length,
      opened: logs.filter((l) => ['opened', 'clicked'].includes(l.status)).length,
      clicked: logs.filter((l) => l.status === 'clicked').length,
      bounced: logs.filter((l) => l.status === 'bounced').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      pending: logs.filter((l) => l.status === 'pending').length,
    };

    res.json({ analytics });
  } catch (error: any) {
    console.error('Email analytics error:', error);
    res.status(500).json({ error: error?.message || 'Failed to get analytics' });
  }
});

export default router;
