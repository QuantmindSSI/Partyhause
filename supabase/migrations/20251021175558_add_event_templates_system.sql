-- Migration: Add Event Templates System
-- Description: Creates tables and infrastructure for reusable event templates
-- Date: 2025-10-21

-- Create enum types for template categories and price tiers
DO $$ BEGIN
  CREATE TYPE template_category AS ENUM (
    'birthday',
    'wedding',
    'corporate',
    'holiday',
    'social',
    'sports',
    'cultural',
    'fundraiser',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE price_tier AS ENUM ('free', 'basic', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category template_category NOT NULL,
  hero_image_url text,
  price_tier price_tier NOT NULL DEFAULT 'free',
  
  -- JSONB column containing the complete template payload
  -- Structure: { event: {...}, partyboard_tasks: [...], budget_items: [...], features: {...}, emails: [...] }
  default_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- JSONB column containing JSON Schema for required fields validation
  required_fields_schema jsonb,
  
  -- Metadata
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  featured boolean DEFAULT false,
  published boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_usage tracking table
CREATE TABLE IF NOT EXISTS template_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_templates_published ON templates(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_templates_price_tier ON templates(price_tier);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);

CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_user_id ON template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_event_id ON template_usage(event_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_at ON template_usage(created_at);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_templates_updated_at ON templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Create function to auto-increment usage_count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing usage_count
DROP TRIGGER IF EXISTS trigger_increment_template_usage ON template_usage;
CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON template_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates table

-- Allow everyone to view published templates
CREATE POLICY "Published templates are viewable by everyone"
  ON templates FOR SELECT
  USING (published = true);

-- Allow authenticated users to create templates
CREATE POLICY "Authenticated users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own templates
CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Allow users to delete their own templates
CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for template_usage table

-- System can insert template usage (via service role)
CREATE POLICY "System can insert template usage"
  ON template_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own template usage
CREATE POLICY "Users can view own template usage"
  ON template_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE templates IS 'Reusable event templates with default configurations';
COMMENT ON TABLE template_usage IS 'Tracks which users have used which templates';
COMMENT ON COLUMN templates.default_payload IS 'Complete template configuration in JSONB format';
COMMENT ON COLUMN templates.required_fields_schema IS 'JSON Schema for validating required user inputs';
