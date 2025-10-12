import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../env-server.js';

const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false }
});

type TemplatePayload = {
  name?: string;
  subject?: string;
  body_html?: string | null;
  body_markdown?: string | null;
  is_default?: boolean;
};

const parseTemplateBody = (req: VercelRequest): TemplatePayload => {
  const rawBody = req.body;
  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody) as TemplatePayload;
    } catch (error) {
      console.warn('Template [id] API: Failed to parse JSON body', error);
      return {};
    }
  }

  if (rawBody && typeof rawBody === 'object') {
    return rawBody as TemplatePayload;
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
    console.warn('Template [id] API: Auth lookup failed', error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await getUserIdFromAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: 'Missing template id' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('invite_templates')
        .select('*')
        .eq('id', id)
        .eq('host_id', userId)
        .single();

      if (error) throw error;
      return res.status(200).json({ template: data });
    }

    if (req.method === 'PATCH') {
      const { name, subject, body_html, body_markdown, is_default } = parseTemplateBody(req);

      // If setting default, clear other defaults for this host first
      if (typeof is_default !== 'undefined' && is_default) {
        await supabaseAdmin
          .from('invite_templates')
          .update({ is_default: false })
          .eq('host_id', userId);
      }

      const updates: TemplatePayload = {};
      if (typeof name !== 'undefined') updates.name = name;
      if (typeof subject !== 'undefined') updates.subject = subject;
      if (typeof body_html !== 'undefined') updates.body_html = body_html;
      if (typeof body_markdown !== 'undefined') updates.body_markdown = body_markdown;
      if (typeof is_default !== 'undefined') updates.is_default = is_default;

      const { data, error } = await supabaseAdmin
        .from('invite_templates')
        .update(updates)
        .eq('id', id)
        .eq('host_id', userId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ template: data });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('invite_templates')
        .delete()
        .eq('id', id)
        .eq('host_id', userId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    console.error('Template [id] API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
