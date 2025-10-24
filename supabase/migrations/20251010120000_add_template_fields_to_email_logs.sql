-- Migration: Add template fields to email_logs
-- Date: 2025-10-10

alter table email_logs
  add column if not exists template_id uuid references invite_templates(id),
  add column if not exists template_body text;

-- Optional: index on template_id for quicker lookups
create index if not exists idx_email_logs_template_id on email_logs(template_id);

-- Security: if you use RLS, ensure server-side updates are done with service role key; no RLS changes here.
