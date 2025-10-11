#!/usr/bin/env node
/* Migration smoke-test script
   Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   This script attempts to insert a test row into email_logs including template_id and template_body
   and then selects it back to verify the columns exist and are writable.
*/
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for migration smoke-test');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  // If invite_templates exists, try to use an existing template id; otherwise create a temporary template.
  let templateId = null;
  try {
    const { data: templates } = await supabase.from('invite_templates').select('id').limit(1);
    if (templates && templates.length > 0) templateId = templates[0].id;
  } catch (e) { /* ignore - table may not exist */ }

  if (!templateId) {
    try {
      const { data, error } = await supabase.from('invite_templates').insert({ name: 'smoke-test-template', subject: 'test' }).select().single();
      if (error) throw error;
      templateId = data.id;
    } catch (e) {
      console.warn('Could not create temporary invite_template (table may not exist):', e.message || e);
    }
  }

  const payload = {
    event_id: null,
    guest_id: null,
    email_type: 'test',
    recipient_email: 'smoke@test.partyhause',
    subject: 'migration smoke test',
    template_id: templateId,
    template_body: 'smoke test body',
    status: 'pending'
  };

  try {
    const { data, error } = await supabase.from('email_logs').insert(payload).select().single();
    if (error) throw error;
    console.log('Inserted test row id:', data.id);

    const { data: found, error: fErr } = await supabase.from('email_logs').select('id, template_id, template_body').eq('id', data.id).single();
    if (fErr) throw fErr;
    console.log('Verified row:', { id: found.id, template_id: found.template_id, template_body: found.template_body });

    // cleanup
    await supabase.from('email_logs').delete().eq('id', data.id);
    if (templateId) {
      try { await supabase.from('invite_templates').delete().eq('id', templateId); } catch (e) { /* ignore cleanup errors */ }
    }

    console.log('Migration smoke-test passed');
    process.exit(0);
  } catch (err) {
    console.error('Migration smoke-test failed:', err.message || err);
    process.exit(3);
  }
}

run();
