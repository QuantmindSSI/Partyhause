-- Phase 1: Core Template Implementation Schema
-- Events, Guests, Tickets, Timeline Blocks

-- ============================================================================
-- EVENTS TABLE (Enhanced for templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  location_name VARCHAR(255),
  location_address TEXT,
  location_coordinates POINT,
  privacy VARCHAR(20) DEFAULT 'private' CHECK (privacy IN ('public', 'private', 'unlisted')),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_template_type ON events(template_type);
CREATE INDEX IF NOT EXISTS idx_events_privacy ON events(privacy);

-- ============================================================================
-- EVENT CO-HOSTS TABLE
-- ============================================================================
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

-- ============================================================================
-- GUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')),
  ticket_type VARCHAR(100),
  ticket_id VARCHAR(100),
  qr_code TEXT,
  plus_ones INTEGER DEFAULT 0,
  dietary_restrictions TEXT[],
  custom_fields JSONB DEFAULT '{}',
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  role VARCHAR(50) DEFAULT 'guest' CHECK (role IN ('host', 'co-host', 'guest', 'vendor', 'volunteer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_event ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_checked_in ON guests(checked_in);

-- ============================================================================
-- TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  quantity INTEGER NOT NULL,
  sold INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sold <= quantity)
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);

-- ============================================================================
-- TIMELINE BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  type VARCHAR(50) NOT NULL CHECK (type IN ('activity', 'meal', 'speech', 'performance', 'break', 'custom')),
  host_notes TEXT,
  guest_visible BOOLEAN DEFAULT TRUE,
  notify_before INTEGER, -- minutes before to send reminder
  location VARCHAR(255),
  assigned_to UUID[],
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_event ON timeline_blocks(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_start ON timeline_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_blocks(event_id, order_index);

-- ============================================================================
-- MEDIA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for videos in seconds
  file_size BIGINT,
  mime_type VARCHAR(100),
  tags TEXT[],
  location_coordinates POINT,
  captured_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  credits VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_event ON media(event_id);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_captured ON media(captured_at);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('poll', 'trivia', 'scavenger', 'vote', 'quiz')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- minutes
  config JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_event ON activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- ============================================================================
-- ACTIVITY PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  responses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);

-- ============================================================================
-- VENDORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_website TEXT,
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_event ON vendors(event_id);

-- ============================================================================
-- VENDOR TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_tasks_vendor ON vendor_tasks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_tasks_due ON vendor_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_vendor_tasks_completed ON vendor_tasks(completed);

-- ============================================================================
-- FUNCTIONS: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_blocks_updated_at BEFORE UPDATE ON timeline_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_participants_updated_at BEFORE UPDATE ON activity_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_tasks_updated_at BEFORE UPDATE ON vendor_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
