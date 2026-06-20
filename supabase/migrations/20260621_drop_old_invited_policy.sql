-- Drop the old apostrophe-named policy that was never dropped and causes 500 errors
-- Also drop the non-apostrophe variant and recreate with auth.jwt() instead of auth.users subquery

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
