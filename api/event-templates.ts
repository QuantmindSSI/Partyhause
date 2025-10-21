// API endpoint: GET /api/event-templates
// List all published event templates with optional filters

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TemplateService } from './services/templateService';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const templateService = new TemplateService(supabaseUrl, supabaseKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, featured, price_tier, slug } = req.query;

    // If slug is provided, get single template
    if (slug) {
      const template = await templateService.getTemplateBySlug(slug as string);
      return res.status(200).json({ template });
    }

    // Otherwise, list templates with filters
    const filters: any = {};
    if (category) filters.category = category as string;
    if (featured) filters.featured = featured === 'true';
    if (price_tier) filters.price_tier = price_tier as string;

    const templates = await templateService.getTemplates(filters);

    // Return summary info for list view
    const templateSummaries = templates.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
      hero_image_url: t.hero_image_url,
      price_tier: t.price_tier,
      price_amount: t.price_amount,
      featured: t.featured,
      usage_count: t.usage_count,
      customization_hints: t.default_payload.customization_hints,
    }));

    return res.status(200).json({ templates: templateSummaries });
  } catch (error: any) {
    console.error('Event templates API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
