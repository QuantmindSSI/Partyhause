-- NUCLEAR FIX: Drop ALL policies on events and recreate minimal working ones
-- The 500 errors are caused by leftover broken RLS policies from earlier migrations

-- Drop every possible policy name variant on events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can view events they're invited to" ON events;
DROP POLICY IF EXISTS "Users can view events they are invited to" ON events;
DROP POLICY IF EXISTS "Users can view events they co-host" ON events;
DROP POLICY IF EXISTS "Users can view events they're co-hosting" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Hosts can update their events" ON events;
DROP POLICY IF EXISTS "Co-hosts can update events with permission" ON events;
DROP POLICY IF EXISTS "Co-hosts can update events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their events" ON events;

-- Also drop any policies we might have missed by querying pg
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON events', pol.policyname);
  END LOOP;
END $$;

-- Recreate minimal, safe policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Host can see their own events
CREATE POLICY "events_select_own"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = host_id);

-- Host can insert their own events
CREATE POLICY "events_insert_own"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- Host can update their own events
CREATE POLICY "events_update_own"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

-- Host can delete their own events
CREATE POLICY "events_delete_own"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);
