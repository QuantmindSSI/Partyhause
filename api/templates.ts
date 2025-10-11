import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service_role key
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false }
});

// Helper to get current user id from Authorization header (expects Bearer <token>)
async function getUserIdFromAuth(req: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];

  // Verify token via Supabase auth admin endpoint
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: any, res: any) {
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
      const { name, subject, body_html, body_markdown, is_default } = req.body;
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
  } catch (error: any) {
    console.error('Templates API error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
