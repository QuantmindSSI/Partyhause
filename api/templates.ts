import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env-server.js';

const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false }
});

type TemplatePayload = {
  name: string;
  subject: string;
  body_html?: string;
  body_markdown?: string;
  is_default?: boolean;
};

const parseTemplateBody = (req: VercelRequest): Partial<TemplatePayload> => {
  const rawBody = req.body;
  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody) as Partial<TemplatePayload>;
    } catch (error) {
      console.warn('Templates API: Failed to parse JSON body', error);
      return {};
    }
  }

  if (rawBody && typeof rawBody === 'object') {
    return rawBody as Partial<TemplatePayload>;
  }

  return {};
};

const getUserIdFromAuth = async (req: VercelRequest): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (error) {
    console.warn('Templates API: Auth lookup failed', error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await getUserIdFromAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      // list templates for the current host
      const { data, error } = await supabaseAdmin
        .from('invite_templates')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ templates: data });
    }

    if (req.method === 'POST') {
      const { name, subject, body_html, body_markdown, is_default } = parseTemplateBody(req);
      if (!name || !subject) return res.status(400).json({ error: 'Missing required fields: name, subject' });

      // If is_default is true, clear other defaults for this host
      if (is_default) {
        await supabaseAdmin
          .from('invite_templates')
          .update({ is_default: false })
          .eq('host_id', userId);
      }

      const { data, error } = await supabaseAdmin
        .from('invite_templates')
        .insert({ host_id: userId, name, subject, body_html, body_markdown, is_default })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ template: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    console.error('Templates API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
