// Express route: /api/invite-templates
// CRUD operations for invite templates (Prisma-based replacement for
// api/templates.ts and api/templates/[id].ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All invite-template routes require authentication
router.use(requireAuth);

// GET /api/invite-templates - List templates for the current host
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const templates = await prisma.inviteTemplate.findMany({
      where: { host_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ templates });
  } catch (error: unknown) {
    console.error('Templates API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// POST /api/invite-templates - Create template
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, subject, body_html, body_markdown, is_default } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: 'Missing required fields: name, subject' });
    }

    // If is_default is true, clear other defaults for this host
    if (is_default) {
      await prisma.inviteTemplate.updateMany({
        where: { host_id: userId },
        data: { is_default: false },
      });
    }

    const template = await prisma.inviteTemplate.create({
      data: {
        host_id: userId,
        name,
        subject,
        body_html: body_html || null,
        body_markdown: body_markdown || null,
        is_default: is_default || false,
      },
    });

    return res.status(201).json({ template });
  } catch (error: unknown) {
    console.error('Templates API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// PUT /api/invite-templates/:id - Update template
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing template id' });
    }

    const { name, subject, body_html, body_markdown, is_default } = req.body;

    // If setting default, clear other defaults for this host first
    if (typeof is_default !== 'undefined' && is_default) {
      await prisma.inviteTemplate.updateMany({
        where: { host_id: userId },
        data: { is_default: false },
      });
    }

    const updates: Record<string, unknown> = {};
    if (typeof name !== 'undefined') updates.name = name;
    if (typeof subject !== 'undefined') updates.subject = subject;
    if (typeof body_html !== 'undefined') updates.body_html = body_html;
    if (typeof body_markdown !== 'undefined') updates.body_markdown = body_markdown;
    if (typeof is_default !== 'undefined') updates.is_default = is_default;

    const template = await prisma.inviteTemplate.update({
      where: { id, host_id: userId },
      data: updates as any,
    });

    return res.status(200).json({ template });
  } catch (error: unknown) {
    console.error('Template [id] API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/invite-templates/:id - Delete template
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing template id' });
    }

    await prisma.inviteTemplate.delete({
      where: { id, host_id: userId },
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error('Template [id] API error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
