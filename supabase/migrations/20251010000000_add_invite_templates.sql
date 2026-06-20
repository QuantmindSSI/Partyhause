-- Migration: Add invite_templates table
-- Date: 2025-10-10

create table if not exists invite_templates (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) not null,
  name text not null,
  slug text,
  subject text not null,
  body_html text,
  body_markdown text,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_invite_templates_host_id on invite_templates(host_id);
create index if not exists idx_invite_templates_slug on invite_templates(slug);

-- Trigger to update updated_at
-- Trigger to update updated_at
drop trigger if exists update_invite_templates_updated_at on invite_templates;
create trigger update_invite_templates_updated_at
  before update on invite_templates
  for each row
  execute procedure update_updated_at_column();

-- Enable RLS and policies
alter table invite_templates enable row level security;

create policy "Templates: hosts can select their templates"
  on invite_templates for select
  using (auth.uid() = host_id);

create policy "Templates: hosts can insert their templates"
  on invite_templates for insert
  with check (auth.uid() = host_id);

create policy "Templates: hosts can update their templates"
  on invite_templates for update
  using (auth.uid() = host_id);

create policy "Templates: hosts can delete their templates"
  on invite_templates for delete
  using (auth.uid() = host_id);

-- Ensure only one default template per host: create a partial unique index
create unique index if not exists idx_invite_templates_one_default_per_host
  on invite_templates(host_id)
  where is_default = true;