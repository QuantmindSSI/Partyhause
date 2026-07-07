// Express route: /api/event-templates
// List/get event templates and create events from templates (Prisma-based
// replacement for api/event-templates.ts and api/create-event-from-template.ts)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers (ported from api/services/templateService.ts, converted to Prisma)
// ---------------------------------------------------------------------------

interface TemplatePayload {
  event: {
    title?: string;
    description?: string;
    date?: string;
    duration_hours?: number;
    visibility?: string;
    location?: string;
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
  partyboard?: any[];
  features?: {
    games?: string[];
    polls?: string[];
    budget?: boolean;
    emailSequence?: string[];
    [key: string]: any;
  };
  budget?: {
    items: any[];
    total_estimated?: number;
    per_person_estimated?: number;
  };
  emails?: { [key: string]: string };
  customization_hints?: {
    required_fields?: string[];
    recommended_guest_count?: string;
    setup_time_minutes?: number;
    [key: string]: any;
  };
}

/**
 * Deep merge template payload with user overrides.
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Create an event from a template with user overrides.
 * Ported from TemplateService.createEventFromTemplate, using Prisma.
 * Note: partyboard_tasks and budget_items tables do not exist in the Prisma
 * schema, so those creation steps are skipped (the original Supabase code
 * also tolerated failures for those).
 */
async function createEventFromTemplate(
  userId: string,
  templateId: string,
  overrides: Partial<TemplatePayload>,
): Promise<{
  event_id: string;
  success: boolean;
  created: {
    event: boolean;
    partyboard_tasks: number;
    features_enabled: string[];
    email_sequence: number;
    budget_items: number;
  };
}> {
  // 1. Load template
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // 2. Merge template with overrides
  const payload = deepMerge(template.default_payload, overrides) as TemplatePayload;

  // 3. Ensure required event fields
  if (!payload.event?.date) {
    throw new Error('Event date is required');
  }

  // 4. Create event
  const event = await prisma.event.create({
    data: {
      host_id: userId,
      name: payload.event.title || template.name,
      title: payload.event.title || template.name,
      description: payload.event.description || null,
      start_date: new Date(payload.event.date),
      end_date: new Date(payload.event.date),
      location: payload.event.location || '',
      privacy: payload.event.visibility || 'private',
    },
  });

  const result = {
    event_id: event.id,
    success: true,
    created: {
      event: true,
      partyboard_tasks: 0,
      features_enabled: [] as string[],
      email_sequence: 0,
      budget_items: 0,
    },
  };

  // 5. Track features enabled
  if (payload.features) {
    const features: string[] = [];
    if (payload.features.games) features.push(...payload.features.games);
    if (payload.features.polls) features.push(...payload.features.polls);
    if (payload.features.budget) features.push('budget');
    result.created.features_enabled = features;
  }

  // 6. Track email sequence
  if (payload.emails) {
    result.created.email_sequence = Object.keys(payload.emails).length;
  }

  // 7. Track template usage + increment usage_count
  await prisma.$transaction([
    prisma.templateUsage.create({
      data: {
        template_id: templateId,
        user_id: userId,
        event_id: event.id,
      },
    }),
    prisma.template.update({
      where: { id: templateId },
      data: { usage_count: { increment: 1 } },
    }),
  ]);

  return result;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/event-templates - List available templates (with optional filters)
// No auth required for listing published templates, but we use optionalAuth
// so the user object is available if a token is present.
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { category, featured, price_tier } = req.query;

    // Build filter
    const where: any = { published: true };

    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (featured !== undefined && featured === 'true') {
      where.featured = true;
    }
    if (price_tier && typeof price_tier === 'string') {
      where.price_tier = price_tier;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { usage_count: 'desc' }],
    });

    // Return summary info for list view
    const templateSummaries = templates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
      hero_image_url: t.hero_image_url,
      price_tier: t.price_tier,
      featured: t.featured,
      usage_count: t.usage_count,
      customization_hints: (t.default_payload as any)?.customization_hints,
    }));

    return res.status(200).json({ templates: templateSummaries });
  } catch (error: unknown) {
    console.error('Event templates API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// GET /api/event-templates/:id - Get template details
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.status(200).json({ template });
  } catch (error: unknown) {
    console.error('Event templates API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

// POST /api/event-templates/:id/create-event - Create event from template
router.post('/:id/create-event', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id: templateId } = req.params;
    const { overrides } = req.body;

    if (!templateId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'template_id is required',
      });
    }

    const result = await createEventFromTemplate(userId, templateId, overrides || {});

    return res.status(201).json(result);
  } catch (error: unknown) {
    console.error('Create event from template error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle validation errors
    if (errorMessage.includes('Validation failed')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: errorMessage,
      });
    }

    // Handle not found errors
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: errorMessage,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;
