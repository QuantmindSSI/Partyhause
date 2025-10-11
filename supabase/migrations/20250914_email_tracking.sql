-- Email tracking and status migration
-- Add email tracking tables for delivery status monitoring

-- Create or replace the trigger function for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create email logs table for tracking all sent emails
create table email_logs (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references events(id) on delete cascade,
    guest_id uuid references guests(id) on delete cascade,
    resend_email_id text, -- Resend API email ID
    email_type text not null check (email_type in ('invitation', 'confirmation', 'reminder', 'test')),
    recipient_email text not null,
    subject text not null,
    status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
    sent_at timestamp with time zone default now(),
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    bounced_at timestamp with time zone,
    error_message text,
    webhook_data jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create email events table for webhook tracking
create table email_events (
    id uuid primary key default gen_random_uuid(),
    email_log_id uuid references email_logs(id) on delete cascade not null,
    resend_email_id text not null,
    event_type text not null, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
    timestamp timestamp with time zone not null,
    webhook_data jsonb not null default '{}'::jsonb,
    processed_at timestamp with time zone default now()
);

-- Add indexes for performance
create index idx_email_logs_event_id on email_logs(event_id);
create index idx_email_logs_guest_id on email_logs(guest_id);
create index idx_email_logs_resend_id on email_logs(resend_email_id);
create index idx_email_logs_status on email_logs(status);
create index idx_email_logs_sent_at on email_logs(sent_at);
create index idx_email_events_email_log_id on email_events(email_log_id);
create index idx_email_events_resend_id on email_events(resend_email_id);
create index idx_email_events_type on email_events(event_type);

-- Add trigger for updated_at
create trigger update_email_logs_updated_at
    before update on email_logs
    for each row
    execute procedure update_updated_at_column();

-- Add RLS policies
alter table email_logs enable row level security;
alter table email_events enable row level security;

-- Email logs policies - Users can view email logs for their events
create policy "Users can view email logs for their events"
    on email_logs for select
    using (exists (
        select 1 from events
        where events.id = email_logs.event_id
        and events.host_id = auth.uid()
    ));

create policy "Users can manage email logs for their events"
    on email_logs for all
    using (exists (
        select 1 from events
        where events.id = email_logs.event_id
        and events.host_id = auth.uid()
    ));

-- Email events policies - Users can view email events for their email logs
create policy "Users can view email events for their logs"
    on email_events for select
    using (exists (
        select 1 from email_logs
        join events on events.id = email_logs.event_id
        where email_logs.id = email_events.email_log_id
        and events.host_id = auth.uid()
    ));

create policy "System can insert email events"
    on email_events for insert
    with check (true); -- Allow webhook system to insert events

-- Add email status to guests table if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'email_status') then
        alter table guests add column email_status text default 'not_sent' check (email_status in ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'last_email_sent_at') then
        alter table guests add column last_email_sent_at timestamp with time zone;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'email_log_id') then
        alter table guests add column email_log_id uuid references email_logs(id);
    end if;
end $$;

-- Create view for email analytics
create or replace view email_analytics as
select 
    e.id as event_id,
    e.name as event_name,
    count(el.id) as total_emails_sent,
    count(case when el.status = 'delivered' then 1 end) as delivered_count,
    count(case when el.status = 'opened' then 1 end) as opened_count,
    count(case when el.status = 'clicked' then 1 end) as clicked_count,
    count(case when el.status = 'bounced' then 1 end) as bounced_count,
    count(case when el.status = 'failed' then 1 end) as failed_count,
    round(
        (count(case when el.status = 'delivered' then 1 end)::numeric / 
         nullif(count(el.id), 0) * 100), 2
    ) as delivery_rate,
    round(
        (count(case when el.status = 'opened' then 1 end)::numeric / 
         nullif(count(case when el.status = 'delivered' then 1 end), 0) * 100), 2
    ) as open_rate,
    round(
        (count(case when el.status = 'clicked' then 1 end)::numeric / 
         nullif(count(case when el.status = 'opened' then 1 end), 0) * 100), 2
    ) as click_rate
from events e
left join email_logs el on e.id = el.event_id
group by e.id, e.name;