-- Complete production database setup with fixed UUID functions
-- This migration safely applies all remaining schema changes

-- Ensure pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Update events table for modern schema if needed
do $$
begin
    -- Add new columns for multi-day events if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'start_date') then
        alter table events add column start_date timestamp with time zone;
        -- Migrate existing data
        update events set start_date = event_date where start_date is null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'end_date') then
        alter table events add column end_date timestamp with time zone;
        -- For single day events, end_date equals start_date
        update events set end_date = coalesce(start_date, event_date) where end_date is null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'event_type') then
        alter table events add column event_type text default 'single_day' check (event_type in ('single_day', 'multi_day'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'invite_image_url') then
        alter table events add column invite_image_url text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'max_guests') then
        alter table events add column max_guests integer;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'is_public') then
        alter table events add column is_public boolean default false;
    end if;
end $$;

-- Add email tracking columns to guests if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'email_status') then
        alter table guests add column email_status text default 'not_sent' check (email_status in ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'last_email_sent_at') then
        alter table guests add column last_email_sent_at timestamp with time zone;
    end if;
end $$;

-- Email analytics view will be created later by email tracking migration