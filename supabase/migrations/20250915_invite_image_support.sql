-- Add invite image support to events table
-- Migration: 20250914_invite_image_support
-- Date: 2025-09-14
-- Description: Add invite_image_url field to events table for custom invite images

BEGIN;

-- Add invite_image_url column to events table if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'invite_image_url') then
        ALTER TABLE events ADD COLUMN invite_image_url TEXT;
    end if;
end $$;;

-- Add comment to describe the column
COMMENT ON COLUMN events.invite_image_url IS 'URL of uploaded custom invite image (stored in Supabase storage)';

-- Create indexes for performance if needed
-- CREATE INDEX IF NOT EXISTS idx_events_invite_image ON events(invite_image_url) WHERE invite_image_url IS NOT NULL;

-- Update the updated_at timestamp for the table modification
-- This helps track when the schema was last modified
UPDATE events SET updated_at = updated_at WHERE id = id;

COMMIT;

-- Example usage:
-- UPDATE events SET invite_image_url = 'https://your-supabase-project.supabase.co/storage/v1/object/public/event-invites/invite-123.jpg' WHERE id = 'event-id';