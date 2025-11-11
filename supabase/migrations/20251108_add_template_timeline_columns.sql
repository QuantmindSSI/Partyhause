-- Add template_data and timeline_blocks columns to events table
-- These columns store template configurations and timeline block data

-- Add template_type column (VARCHAR for template identifier)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'template_type'
  ) THEN
    ALTER TABLE public.events ADD COLUMN template_type VARCHAR(100);
  END IF;
END $$;

-- Add template_data column (JSONB for flexible template configuration)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'template_data'
  ) THEN
    ALTER TABLE public.events ADD COLUMN template_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add timeline_blocks column (JSONB array for timeline blocks)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'timeline_blocks'
  ) THEN
    ALTER TABLE public.events ADD COLUMN timeline_blocks JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create index for template_data queries
CREATE INDEX IF NOT EXISTS idx_events_template_data ON events USING gin(template_data);

-- Create index for timeline_blocks queries  
CREATE INDEX IF NOT EXISTS idx_events_timeline_blocks ON events USING gin(timeline_blocks);

COMMENT ON COLUMN events.template_data IS 'Template configuration data stored as JSONB';
COMMENT ON COLUMN events.timeline_blocks IS 'Timeline blocks array stored as JSONB';
