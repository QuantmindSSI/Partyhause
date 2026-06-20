-- Fix the events RLS policy that caused 500 errors
-- The original policy "Users can view events they're invited to" used a subquery to auth.users
-- which causes permission errors. Replace with auth.jwt() ->> 'email'

-- Drop both naming variants (apostrophe and non-apostrophe versions)
DROP POLICY IF EXISTS "Users can view events they're invited to" ON events;
DROP POLICY IF EXISTS "Users can view events they are invited to" ON events;

CREATE POLICY "Users can view events they are invited to"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.event_id = events.id
        AND guests.email = (auth.jwt() ->> 'email')
    )
  );
