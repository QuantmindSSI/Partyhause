-- Phase 1: Row Level Security Policies
-- Secure access to events, guests, media, activities, and vendors

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_co_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Public events readable by anyone
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (privacy = 'public');

-- Users can view their own events
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = host_id);

-- Users can view events they're invited to
CREATE POLICY "Users can view events they're invited to"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.event_id = events.id
      AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Users can view events they're co-hosting
CREATE POLICY "Users can view events they co-host"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_co_hosts
      WHERE event_co_hosts.event_id = events.id
      AND event_co_hosts.user_id = auth.uid()
    )
  );

-- Users can create events
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Hosts can update their own events
CREATE POLICY "Hosts can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = host_id);

-- Co-hosts can update events if they have permission
CREATE POLICY "Co-hosts can update events with permission"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_co_hosts
      WHERE event_co_hosts.event_id = events.id
      AND event_co_hosts.user_id = auth.uid()
      AND event_co_hosts.permissions->>'can_edit' = 'true'
    )
  );

-- Hosts can delete their own events
CREATE POLICY "Hosts can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================================================
-- EVENT CO-HOSTS POLICIES
-- ============================================================================

-- Users can view co-hosts for events they have access to
CREATE POLICY "Users can view co-hosts for accessible events"
  ON event_co_hosts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_co_hosts.event_id
      AND (
        events.host_id = auth.uid()
        OR events.privacy = 'public'
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Hosts can add co-hosts
CREATE POLICY "Hosts can add co-hosts"
  ON event_co_hosts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_co_hosts.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Hosts can update co-host permissions
CREATE POLICY "Hosts can update co-hosts"
  ON event_co_hosts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_co_hosts.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Hosts can remove co-hosts
CREATE POLICY "Hosts can remove co-hosts"
  ON event_co_hosts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_co_hosts.event_id
      AND events.host_id = auth.uid()
    )
  );

-- ============================================================================
-- GUESTS POLICIES
-- ============================================================================

-- Hosts and co-hosts can view guest list
CREATE POLICY "Hosts and co-hosts can view guests"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- Guests can view their own guest record
CREATE POLICY "Guests can view their own record"
  ON guests FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Hosts and co-hosts can add guests
CREATE POLICY "Hosts and co-hosts can add guests"
  ON guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_invite' = 'true'
        )
      )
    )
  );

-- Guests can update their own RSVP
CREATE POLICY "Guests can update their own RSVP"
  ON guests FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Hosts and co-hosts can update guest records
CREATE POLICY "Hosts and co-hosts can update guests"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- Hosts and co-hosts can delete guests
CREATE POLICY "Hosts and co-hosts can delete guests"
  ON guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- TICKETS POLICIES
-- ============================================================================

-- Public for public events, host/co-hosts/guests for private events
CREATE POLICY "Tickets viewable based on event privacy"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND (
        events.privacy = 'public'
        OR events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Hosts and co-hosts can manage tickets
CREATE POLICY "Hosts and co-hosts can manage tickets"
  ON tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_edit' = 'true'
        )
      )
    )
  );

-- ============================================================================
-- TIMELINE BLOCKS POLICIES
-- ============================================================================

-- Guests can view guest-visible timeline blocks
CREATE POLICY "Guests can view visible timeline blocks"
  ON timeline_blocks FOR SELECT
  USING (
    guest_visible = true
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = timeline_blocks.event_id
      AND (
        events.privacy = 'public'
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Hosts and co-hosts can view all timeline blocks
CREATE POLICY "Hosts and co-hosts can view all timeline blocks"
  ON timeline_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = timeline_blocks.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- Hosts and co-hosts can manage timeline blocks
CREATE POLICY "Hosts and co-hosts can manage timeline blocks"
  ON timeline_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = timeline_blocks.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_edit' = 'true'
        )
      )
    )
  );

-- ============================================================================
-- MEDIA POLICIES
-- ============================================================================

-- Users can view approved media for events they have access to
CREATE POLICY "Users can view approved media"
  ON media FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = media.event_id
      AND (
        events.privacy = 'public'
        OR events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Hosts can view all media for their events
CREATE POLICY "Hosts can view all event media"
  ON media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = media.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Users can upload media to events they're invited to
CREATE POLICY "Guests can upload media"
  ON media FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = media.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Uploaders can update their own media
CREATE POLICY "Uploaders can update their own media"
  ON media FOR UPDATE
  USING (auth.uid() = uploader_id);

-- Hosts can moderate all media
CREATE POLICY "Hosts can moderate media"
  ON media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = media.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_moderate' = 'true'
        )
      )
    )
  );

-- Uploaders can delete their own media
CREATE POLICY "Uploaders can delete their own media"
  ON media FOR DELETE
  USING (auth.uid() = uploader_id);

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================

-- Participants can view activities for events they have access to
CREATE POLICY "Participants can view activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = activities.event_id
      AND (
        events.privacy = 'public'
        OR events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Hosts and co-hosts can manage activities
CREATE POLICY "Hosts and co-hosts can manage activities"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = activities.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_edit' = 'true'
        )
      )
    )
  );

-- ============================================================================
-- ACTIVITY PARTICIPANTS POLICIES
-- ============================================================================

-- Users can view their own participation
CREATE POLICY "Users can view their own participation"
  ON activity_participants FOR SELECT
  USING (auth.uid() = user_id);

-- Hosts can view all participation
CREATE POLICY "Hosts can view all participation"
  ON activity_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      JOIN events ON events.id = activities.event_id
      WHERE activities.id = activity_participants.activity_id
      AND events.host_id = auth.uid()
    )
  );

-- Users can participate in activities
CREATE POLICY "Users can participate in activities"
  ON activity_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM activities
      JOIN events ON events.id = activities.event_id
      WHERE activities.id = activity_participants.activity_id
      AND (
        events.privacy = 'public'
        OR EXISTS (
          SELECT 1 FROM guests
          WHERE guests.event_id = events.id
          AND guests.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Users can update their own participation
CREATE POLICY "Users can update their own participation"
  ON activity_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VENDORS POLICIES
-- ============================================================================

-- Hosts and co-hosts can view vendors
CREATE POLICY "Hosts and co-hosts can view vendors"
  ON vendors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = vendors.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- Hosts and co-hosts can manage vendors
CREATE POLICY "Hosts and co-hosts can manage vendors"
  ON vendors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = vendors.event_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_edit' = 'true'
        )
      )
    )
  );

-- ============================================================================
-- VENDOR TASKS POLICIES
-- ============================================================================

-- Hosts, co-hosts, and assigned users can view vendor tasks
CREATE POLICY "Authorized users can view vendor tasks"
  ON vendor_tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM vendors
      JOIN events ON events.id = vendors.event_id
      WHERE vendors.id = vendor_tasks.vendor_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
        )
      )
    )
  );

-- Hosts and co-hosts can manage vendor tasks
CREATE POLICY "Hosts and co-hosts can manage vendor tasks"
  ON vendor_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN events ON events.id = vendors.event_id
      WHERE vendors.id = vendor_tasks.vendor_id
      AND (
        events.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_co_hosts
          WHERE event_co_hosts.event_id = events.id
          AND event_co_hosts.user_id = auth.uid()
          AND event_co_hosts.permissions->>'can_edit' = 'true'
        )
      )
    )
  );

-- Assigned users can update task completion
CREATE POLICY "Assigned users can update task completion"
  ON vendor_tasks FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());
