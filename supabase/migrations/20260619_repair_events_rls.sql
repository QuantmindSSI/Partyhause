-- Repair migration: fix events 500 error
-- Ensures event_co_hosts exists, triggers are idempotent, and RLS policies are clean

-- 1. Ensure event_co_hosts table exists (needed by RLS policies)
CREATE TABLE IF NOT EXISTS event_co_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'co-host',
  permissions JSONB DEFAULT '{"can_edit": true, "can_invite": true, "can_moderate": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_co_hosts_event ON event_co_hosts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_co_hosts_user ON event_co_hosts(user_id);

ALTER TABLE event_co_hosts ENABLE ROW LEVEL SECURITY;

-- 2. Safely recreate the events updated_at trigger (DROP IF EXISTS + CREATE)
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop and recreate events RLS policies cleanly
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can view events they're invited to" ON events;
DROP POLICY IF EXISTS "Users can view events they co-host" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Co-hosts can update events with permission" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;

-- Hosts can always see their own events
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = host_id);

-- Public events visible to all authenticated users
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (
    COALESCE(privacy, 'private') = 'public'
  );

-- Guests invited to an event can see it
-- Use auth.jwt() ->> 'email' instead of subquerying auth.users to avoid 500 errors
CREATE POLICY "Users can view events they are invited to"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.event_id = events.id
        AND guests.email = (auth.jwt() ->> 'email')
    )
  );

-- Co-hosts can see events they co-host
CREATE POLICY "Users can view events they co-host"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_co_hosts
      WHERE event_co_hosts.event_id = events.id
        AND event_co_hosts.user_id = auth.uid()
    )
  );

-- Authenticated users can create events (they must be the host)
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Only the host can update their event
CREATE POLICY "Hosts can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = host_id);

-- Only the host can delete their event
CREATE POLICY "Hosts can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = host_id);
