-- Add missing description field to events table
-- This field is required by the Event model but was missing from the database schema

-- Add description column to events table
ALTER TABLE events 
ADD COLUMN description text;

-- Add comment explaining the field
COMMENT ON COLUMN events.description IS 'Optional description of the event';