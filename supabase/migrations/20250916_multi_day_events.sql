-- Migration to support multi-day events
-- Adds start_date, end_date, and event_type fields while maintaining backward compatibility

-- Add new columns to events table if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'start_date') then
        ALTER TABLE events ADD COLUMN start_date timestamp with time zone;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'end_date') then
        ALTER TABLE events ADD COLUMN end_date timestamp with time zone;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'event_type') then
        ALTER TABLE events ADD COLUMN event_type text DEFAULT 'single_day' CHECK (event_type IN ('single_day', 'multi_day'));
    end if;
end $$;

-- Update existing events to use the new structure
-- For existing events, set start_date to event_date and end_date to the same day
UPDATE events 
SET start_date = event_date,
    end_date = event_date,
    event_type = 'single_day'
WHERE start_date IS NULL;

-- Add not null constraints after populating existing data (only if not already set)
do $$
begin
    -- Check and set NOT NULL for start_date
    if exists (select 1 from information_schema.columns 
               where table_name = 'events' and column_name = 'start_date' and is_nullable = 'YES') then
        ALTER TABLE events ALTER COLUMN start_date SET NOT NULL;
    end if;
    
    -- Check and set NOT NULL for end_date
    if exists (select 1 from information_schema.columns 
               where table_name = 'events' and column_name = 'end_date' and is_nullable = 'YES') then
        ALTER TABLE events ALTER COLUMN end_date SET NOT NULL;
    end if;
end $$;

-- Add check constraint to ensure end_date is after start_date (if not exists)
do $$
begin
    if not exists (select 1 from information_schema.constraint_column_usage 
                   where constraint_name = 'check_end_date_after_start_date' and table_name = 'events') then
        ALTER TABLE events ADD CONSTRAINT check_end_date_after_start_date CHECK (end_date >= start_date);
    end if;
end $$;

-- Create index for date range queries (if not exists)
do $$
begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_events_date_range') then
        CREATE INDEX idx_events_date_range ON events(start_date, end_date);
    end if;
end $$;

-- Update the existing event_date column to be nullable for backward compatibility
-- We'll keep it for now but new events will primarily use start_date/end_date
do $$
begin
    if exists (select 1 from information_schema.columns 
               where table_name = 'events' and column_name = 'event_date' and is_nullable = 'NO') then
        ALTER TABLE events ALTER COLUMN event_date DROP NOT NULL;
    end if;
end $$;

-- Add comments explaining the migration
COMMENT ON COLUMN events.start_date IS 'Start date and time of the event';
COMMENT ON COLUMN events.end_date IS 'End date and time of the event';
COMMENT ON COLUMN events.event_type IS 'Type of event: single_day or multi_day';
COMMENT ON COLUMN events.event_date IS 'Legacy field - use start_date for new events';