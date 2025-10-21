-- Seed Event Templates
-- Run with: supabase db remote exec < scripts/seed-templates.sql

-- Insert Birthday Kids template
INSERT INTO templates (name, slug, description, category, hero_image_url, price_tier, featured, default_payload)
VALUES (
  'Birthday Party - Kids',
  'birthday-kids',
  'Perfect for children''s birthday parties with fun activities, games, and easy planning. Includes kid-friendly features, parental controls, and a structured timeline to keep the party running smoothly.',
  'birthday',
  '/images/templates/birthday-kids.jpg',
  'free',
  true,
  '{}'::jsonb  -- Placeholder - will be updated separately with full payload
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

SELECT 'Seeded: Birthday Party - Kids' AS status;
