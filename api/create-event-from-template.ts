// API endpoint: POST /api/create-event-from-template
// Create a new event from a template with user overrides

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { TemplateService } from './services/templateService';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';

const supabaseAdmin = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false },
  }
);

const templateService = new TemplateService(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || ''
);

// Get authenticated user ID
const getUserIdFromAuth = async (req: VercelRequest): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (error) {
    console.warn('Create event from template: Auth lookup failed', error);
    return null;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const userId = await getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse request body
    const { template_id, overrides } = req.body;

    if (!template_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'template_id is required',
      });
    }

    // Create event from template
    const result = await templateService.createEventFromTemplate(
      userId,
      template_id,
      overrides || {}
    );

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
}
