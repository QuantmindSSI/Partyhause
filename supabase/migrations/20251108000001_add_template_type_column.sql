-- Add template_type column to events table
-- This was missing from the previous migration

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'template_type'
  ) THEN
    ALTER TABLE public.events ADD COLUMN template_type VARCHAR(100);
    RAISE NOTICE 'Added template_type column to events table';
  ELSE
    RAISE NOTICE 'template_type column already exists';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_template_type ON events(template_type);

COMMENT ON COLUMN events.template_type IS 'Event template identifier';
