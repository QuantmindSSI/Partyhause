BEGIN;

UPDATE user_profiles
SET username = left(username, 30)
WHERE char_length(username) > 30;

ALTER TABLE events
  ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('single_day', 'multi_day'));

ALTER TABLE events
  ADD CONSTRAINT check_end_date_after_start_date
  CHECK (end_date >= start_date);

ALTER TABLE events
  ADD CONSTRAINT events_privacy_check
  CHECK (privacy IN ('public', 'private', 'unlisted'));

ALTER TABLE events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled', 'archived'));

ALTER TABLE guests
  ADD CONSTRAINT guests_email_nonempty_check
  CHECK (length(trim(email)) > 0);

ALTER TABLE guests
  ADD CONSTRAINT guests_email_status_check
  CHECK (email_status IN ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));

ALTER TABLE guests
  ADD CONSTRAINT guests_rsvp_status_check
  CHECK (rsvp_status IN ('pending', 'accepted', 'confirmed', 'declined', 'maybe'));

ALTER TABLE guests
  ADD CONSTRAINT guests_role_check
  CHECK (role IN ('host', 'co-host', 'guest', 'vendor', 'volunteer'));

ALTER TABLE guests
  ADD CONSTRAINT guests_plus_ones_check
  CHECK (plus_ones >= 0);

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_username_length_check
  CHECK (char_length(username) BETWEEN 3 AND 30);

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_username_format_check
  CHECK (username ~ '^[a-zA-Z0-9_]+$');

ALTER TABLE event_invite_tokens
  ADD CONSTRAINT event_invite_tokens_max_uses_check
  CHECK (max_uses IS NULL OR max_uses > 0);

ALTER TABLE event_invite_tokens
  ADD CONSTRAINT event_invite_tokens_current_uses_check
  CHECK (current_uses >= 0 AND current_uses <= COALESCE(max_uses, current_uses));

COMMIT;
