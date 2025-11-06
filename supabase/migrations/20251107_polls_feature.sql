-- Polls & Voting Feature Migration
-- Creates tables for collaborative voting and decision making

-- Drop existing function and trigger (need to do this before dropping tables)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_poll_consensus') THEN
    DROP TRIGGER trigger_check_poll_consensus ON poll_votes;
  END IF;
END $$;

DROP FUNCTION IF EXISTS check_poll_consensus();

-- Drop existing polls tables if they exist (clean slate)
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;

-- Create polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  node_id UUID, -- Optional reference to PartyBoard node
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('single-choice', 'multiple-choice', 'ranking')),
  ends_at TIMESTAMP WITH TIME ZONE,
  auto_close_on_consensus BOOLEAN DEFAULT false,
  consensus_threshold INTEGER DEFAULT 70 CHECK (consensus_threshold >= 50 AND consensus_threshold <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'consensus-reached')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_votes table
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id) -- Prevent duplicate votes on same option
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_event_id ON polls(event_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone can view polls for events they have access to"
  ON polls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = polls.event_id
      AND (
        e.host_id = auth.uid()
        OR e.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM guests g
          WHERE g.event_id = e.id
          AND g.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Event participants can create polls"
  ON polls FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = polls.event_id
      AND (
        e.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM guests g
          WHERE g.event_id = e.id
          AND g.user_id = auth.uid()
          AND g.rsvp_status = 'confirmed'
        )
      )
    )
  );

CREATE POLICY "Poll creator or event host can update polls"
  ON polls FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = polls.event_id
      AND e.host_id = auth.uid()
    )
  );

CREATE POLICY "Poll creator or event host can delete polls"
  ON polls FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = polls.event_id
      AND e.host_id = auth.uid()
    )
  );

-- RLS Policies for poll_options
CREATE POLICY "Anyone can view poll options for accessible polls"
  ON poll_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN events e ON e.id = p.event_id
      WHERE p.id = poll_options.poll_id
      AND (
        e.host_id = auth.uid()
        OR e.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM guests g
          WHERE g.event_id = e.id
          AND g.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Poll creator can insert options"
  ON poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Poll creator can update options"
  ON poll_options FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Poll creator can delete options"
  ON poll_options FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND p.created_by = auth.uid()
    )
  );

-- RLS Policies for poll_votes
CREATE POLICY "Anyone can view votes for accessible polls"
  ON poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN events e ON e.id = p.event_id
      WHERE p.id = poll_votes.poll_id
      AND (
        e.host_id = auth.uid()
        OR e.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM guests g
          WHERE g.event_id = e.id
          AND g.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Event participants can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls p
      JOIN events e ON e.id = p.event_id
      WHERE p.id = poll_votes.poll_id
      AND p.status = 'active'
      AND (
        e.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM guests g
          WHERE g.event_id = e.id
          AND g.user_id = auth.uid()
          AND g.rsvp_status = 'confirmed'
        )
      )
    )
  );

CREATE POLICY "Users can delete their own votes"
  ON poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Create function to check poll consensus and auto-close
CREATE OR REPLACE FUNCTION check_poll_consensus()
RETURNS TRIGGER AS $$
DECLARE
  poll_record RECORD;
  total_voters INTEGER;
  max_votes INTEGER;
  consensus_percentage NUMERIC;
BEGIN
  -- Get poll details
  SELECT * INTO poll_record
  FROM polls
  WHERE id = NEW.poll_id;

  -- Only check if auto-close is enabled and poll is active
  IF poll_record.auto_close_on_consensus AND poll_record.status = 'active' THEN
    -- Count unique voters
    SELECT COUNT(DISTINCT user_id) INTO total_voters
    FROM poll_votes
    WHERE poll_id = NEW.poll_id;

    -- Find the option with most votes
    SELECT MAX(vote_count) INTO max_votes
    FROM (
      SELECT option_id, COUNT(DISTINCT user_id) as vote_count
      FROM poll_votes
      WHERE poll_id = NEW.poll_id
      GROUP BY option_id
    ) counts;

    -- Calculate consensus percentage
    IF total_voters > 0 THEN
      consensus_percentage := (max_votes::NUMERIC / total_voters::NUMERIC) * 100;

      -- Close poll if consensus threshold reached
      IF consensus_percentage >= poll_record.consensus_threshold THEN
        UPDATE polls
        SET status = 'consensus-reached',
            closed_at = NOW()
        WHERE id = NEW.poll_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check consensus after each vote
CREATE TRIGGER trigger_check_poll_consensus
AFTER INSERT ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION check_poll_consensus();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON poll_options TO authenticated;
GRANT SELECT, INSERT, DELETE ON poll_votes TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
