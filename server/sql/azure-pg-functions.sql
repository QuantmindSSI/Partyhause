-- scripts/azure-pg-functions.sql
--
-- Business-rule functions and triggers for the AZURE PostgreSQL database
-- (or any database created with `prisma db push`).
--
-- WHY THIS FILE EXISTS
--   `prisma db push` materializes tables with TEXT id columns and does NOT
--   create functions or triggers. The originals in supabase/migrations/ are
--   typed for the old Supabase schema (uuid id columns): applied verbatim to
--   a prisma-pushed database, `convert_guest_to_crew`, `is_following`,
--   `is_mutual_crew` and `get_mutual_crew_count` fail with
--   "operator does not exist: text = uuid" (SQL-language bodies may even fail
--   at CREATE time). This file keeps the UUID parameter signatures (server
--   call sites cast arguments with ::uuid) but compares via ::text so the
--   bodies bind against TEXT columns.
--
-- FIXES INCLUDED (also applied to supabase/migrations/20251103_guest_crew_features.sql):
--   * convert_guest_to_crew: v_event_host was declared but never assigned —
--     the duplicate-crew check never matched and the INSERT wrote NULL
--     following_id (the endpoint 500'd on every call).
--   * update_event_cost_summary: used NEW.event_id while bound to DELETE
--     (NEW is NULL on DELETE) — summaries went permanently stale after a
--     split deletion. Also recomputes to a zeroed row when the last split
--     for an event is removed.
--
-- USAGE
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/azure-pg-functions.sql
--
-- Idempotent: CREATE OR REPLACE + DROP TRIGGER IF EXISTS throughout.

-- ============================================
-- Invite tokens (from 20251103_guest_crew_features.sql)
-- ============================================

CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
  SELECT 'inv_' || replace(gen_random_uuid()::TEXT, '-', '');
$$ LANGUAGE SQL VOLATILE;

CREATE OR REPLACE FUNCTION is_invite_token_valid(token_input TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_invite_tokens
    WHERE token = token_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION increment_token_usage(token_input TEXT, user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Row lock guards concurrent max_uses races.
  SELECT * INTO token_record
  FROM public.event_invite_tokens
  WHERE token = token_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT token_record.is_active OR
     (token_record.expires_at IS NOT NULL AND token_record.expires_at <= NOW()) OR
     (token_record.max_uses IS NOT NULL AND token_record.current_uses >= token_record.max_uses) THEN
    RETURN false;
  END IF;

  UPDATE public.event_invite_tokens
  SET
    current_uses = current_uses + 1,
    last_used_at = NOW(),
    uses_log = uses_log || jsonb_build_object(
      'user_id', user_id_input,
      'timestamp', NOW(),
      'ip', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  WHERE token = token_input;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Guest -> crew promotion (FIXED: v_event_host assignment + self-guard)
-- ============================================

DROP FUNCTION IF EXISTS convert_guest_to_crew(uuid, uuid, text);

CREATE OR REPLACE FUNCTION convert_guest_to_crew(
  p_guest_id UUID,
  p_converted_by UUID,
  p_conversion_type TEXT DEFAULT 'host_promoted'
)
RETURNS TEXT AS $$
DECLARE
  v_guest_record RECORD;
  v_event_host TEXT;
  v_connection_id TEXT;
BEGIN
  SELECT g.*, e.host_id INTO v_guest_record
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE g.id = p_guest_id::text;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guest not found';
  END IF;

  v_event_host := v_guest_record.host_id;

  IF v_guest_record.user_id IS NULL THEN
    RAISE EXCEPTION 'Guest must have a user account to be added to crew';
  END IF;

  IF v_guest_record.user_id = v_event_host THEN
    RAISE EXCEPTION 'User is already in crew';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE follower_id = v_guest_record.user_id
    AND following_id = v_event_host
  ) THEN
    RAISE EXCEPTION 'User is already in crew';
  END IF;

  INSERT INTO public.connections (id, follower_id, following_id)
  VALUES (gen_random_uuid()::text, v_guest_record.user_id, v_event_host)
  RETURNING id INTO v_connection_id;

  INSERT INTO public.guest_crew_conversions (
    id, event_id, guest_id, user_id, converted_by, conversion_type, connection_id, connection_status
  ) VALUES (
    gen_random_uuid()::text,
    v_guest_record.event_id,
    p_guest_id::text,
    v_guest_record.user_id,
    p_converted_by::text,
    p_conversion_type,
    v_connection_id,
    'accepted'
  );

  RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Cost split summary (FIXED: DELETE handling via TG_OP)
-- ============================================

CREATE OR REPLACE FUNCTION update_event_cost_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  -- Aggregate WITHOUT GROUP BY so a zeroed row is written when the last
  -- split for the event is deleted.
  INSERT INTO public.event_cost_summaries (event_id, total_event_cost, total_collected, total_pending, total_overdue, guests_with_splits, guests_paid, guests_pending, updated_at)
  SELECT
    v_event_id,
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status IN ('pending', 'sent') THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0),
    COUNT(DISTINCT guest_id),
    COUNT(DISTINCT CASE WHEN status = 'paid' THEN guest_id END),
    COUNT(DISTINCT CASE WHEN status IN ('pending', 'sent', 'overdue') THEN guest_id END),
    NOW()
  FROM public.cost_split_requests
  WHERE event_id = v_event_id
  ON CONFLICT (event_id) DO UPDATE
  SET
    total_event_cost = EXCLUDED.total_event_cost,
    total_collected = EXCLUDED.total_collected,
    total_pending = EXCLUDED.total_pending,
    total_overdue = EXCLUDED.total_overdue,
    guests_with_splits = EXCLUDED.guests_with_splits,
    guests_paid = EXCLUDED.guests_paid,
    guests_pending = EXCLUDED.guests_pending,
    updated_at = NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cost_summary ON public.cost_split_requests;
CREATE TRIGGER trigger_update_cost_summary
AFTER INSERT OR UPDATE OR DELETE ON public.cost_split_requests
FOR EACH ROW EXECUTE FUNCTION update_event_cost_summary();

-- ============================================
-- Partycrew counters + helpers (from 20251101_partycrew_social_network.sql)
-- ============================================

CREATE OR REPLACE FUNCTION update_partycrew_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_profiles
    SET crewing_count = crewing_count + 1, updated_at = NOW()
    WHERE id = NEW.follower_id;

    UPDATE public.user_profiles
    SET partycrew_count = partycrew_count + 1, updated_at = NOW()
    WHERE id = NEW.following_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_profiles
    SET crewing_count = GREATEST(crewing_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.follower_id;

    UPDATE public.user_profiles
    SET partycrew_count = GREATEST(partycrew_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.following_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partycrew_counts ON public.connections;
CREATE TRIGGER trigger_update_partycrew_counts
AFTER INSERT OR DELETE ON public.connections
FOR EACH ROW EXECUTE FUNCTION update_partycrew_counts();

-- NOTE: the Express API no longer calls is_following / is_mutual_crew /
-- get_mutual_crew_count (replaced by Prisma queries), but they are kept
-- text-compatible for any external consumers.

CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE follower_id = follower::text AND following_id = following::text
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_mutual_crew(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections c1
    JOIN public.connections c2 ON c1.follower_id = c2.following_id AND c1.following_id = c2.follower_id
    WHERE c1.follower_id = user1::text AND c1.following_id = user2::text
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_mutual_crew_count(user1 UUID, user2 UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM (
    SELECT following_id FROM public.connections WHERE follower_id = user1::text
    INTERSECT
    SELECT following_id FROM public.connections WHERE follower_id = user2::text
  ) AS mutual;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Poll consensus trigger (from 20251107_polls_feature.sql)
-- ============================================

CREATE OR REPLACE FUNCTION check_poll_consensus()
RETURNS TRIGGER AS $$
DECLARE
  poll_record RECORD;
  total_voters INTEGER;
  max_votes INTEGER;
  consensus_percentage NUMERIC;
BEGIN
  SELECT * INTO poll_record
  FROM polls
  WHERE id = NEW.poll_id;

  IF poll_record.auto_close_on_consensus AND poll_record.status = 'active' THEN
    SELECT COUNT(DISTINCT user_id) INTO total_voters
    FROM poll_votes
    WHERE poll_id = NEW.poll_id;

    SELECT MAX(vote_count) INTO max_votes
    FROM (
      SELECT option_id, COUNT(DISTINCT user_id) as vote_count
      FROM poll_votes
      WHERE poll_id = NEW.poll_id
      GROUP BY option_id
    ) counts;

    IF total_voters > 0 THEN
      consensus_percentage := (max_votes::NUMERIC / total_voters::NUMERIC) * 100;

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

DROP TRIGGER IF EXISTS trigger_check_poll_consensus ON poll_votes;
CREATE TRIGGER trigger_check_poll_consensus
AFTER INSERT ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION check_poll_consensus();
