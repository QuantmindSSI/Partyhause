BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.guests
    WHERE length(btrim(email)) = 0
  ) THEN
    RAISE EXCEPTION 'MVP_PREFLIGHT_BLANK_GUEST_EMAIL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.guests
    GROUP BY event_id, lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'MVP_PREFLIGHT_DUPLICATE_GUEST_EMAIL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.guests
    GROUP BY event_id
    HAVING count(*) > 50
  ) OR EXISTS (
    SELECT 1
    FROM public.events
    WHERE max_guests > 50
  ) THEN
    RAISE EXCEPTION 'MVP_PREFLIGHT_EVENT_OVER_50_GUESTS';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.events
    WHERE max_guests IS NOT NULL
      AND max_guests < 1
  ) THEN
    RAISE EXCEPTION 'MVP_PREFLIGHT_INVALID_EVENT_CAPACITY';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.guests
    WHERE (checked_in OR is_checked_in)
      AND rsvp_status NOT IN ('accepted', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'MVP_PREFLIGHT_INVALID_CHECK_IN_RSVP';
  END IF;
END
$preflight$;

ALTER TABLE public.users
  ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN terms_version TEXT,
  ADD COLUMN privacy_version TEXT,
  ADD COLUMN age_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN deletion_requested_at TIMESTAMP(3);

ALTER TABLE public.events
  ADD COLUMN revision INTEGER,
  ADD COLUMN published_at TIMESTAMP(3),
  ADD COLUMN cancelled_at TIMESTAMP(3),
  ADD COLUMN completed_at TIMESTAMP(3);

ALTER TABLE public.guests
  ADD COLUMN normalized_email TEXT,
  ADD COLUMN revision INTEGER,
  ADD COLUMN rsvp_responded_at TIMESTAMP(3);

UPDATE public.events
SET max_guests = 50
WHERE max_guests IS NULL;

UPDATE public.events
SET revision = 1
WHERE revision IS NULL;

UPDATE public.guests
SET normalized_email = lower(btrim(email)),
    revision = 1;

UPDATE public.guests
SET rsvp_status = 'accepted'
WHERE rsvp_status = 'confirmed';

ALTER TABLE public.events
  ALTER COLUMN max_guests SET DEFAULT 50,
  ALTER COLUMN max_guests SET NOT NULL,
  ALTER COLUMN revision SET DEFAULT 1,
  ALTER COLUMN revision SET NOT NULL;

ALTER TABLE public.guests
  ALTER COLUMN normalized_email SET DEFAULT '',
  ALTER COLUMN normalized_email SET NOT NULL,
  ALTER COLUMN revision SET DEFAULT 1,
  ALTER COLUMN revision SET NOT NULL;

ALTER TABLE public.guests
  DROP CONSTRAINT guests_rsvp_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_token_version_check
    CHECK (token_version >= 0) NOT VALID,
  ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'deletion_pending')) NOT VALID;

ALTER TABLE public.events
  ADD CONSTRAINT events_revision_check
    CHECK (revision >= 1) NOT VALID,
  ADD CONSTRAINT events_max_guests_check
    CHECK (max_guests BETWEEN 1 AND 50) NOT VALID;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_rsvp_status_check
    CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')) NOT VALID,
  ADD CONSTRAINT guests_normalized_email_check
    CHECK (
      length(normalized_email) > 0
      AND normalized_email = lower(btrim(email))
    ) NOT VALID,
  ADD CONSTRAINT guests_revision_check
    CHECK (revision >= 1) NOT VALID,
  ADD CONSTRAINT guests_check_in_requires_accepted_check
    CHECK (
      (NOT checked_in AND NOT is_checked_in)
      OR rsvp_status = 'accepted'
    ) NOT VALID;

ALTER TABLE public.users VALIDATE CONSTRAINT users_token_version_check;
ALTER TABLE public.users VALIDATE CONSTRAINT users_account_status_check;
ALTER TABLE public.events VALIDATE CONSTRAINT events_revision_check;
ALTER TABLE public.events VALIDATE CONSTRAINT events_max_guests_check;
ALTER TABLE public.guests VALIDATE CONSTRAINT guests_rsvp_status_check;
ALTER TABLE public.guests VALIDATE CONSTRAINT guests_normalized_email_check;
ALTER TABLE public.guests VALIDATE CONSTRAINT guests_revision_check;
ALTER TABLE public.guests VALIDATE CONSTRAINT guests_check_in_requires_accepted_check;

CREATE TABLE public.mvp_commands (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_payload JSONB,
  response JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT mvp_commands_pkey PRIMARY KEY (id)
);

CREATE TABLE public.guest_invitations (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  guest_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  revoked_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT guest_invitations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.invitation_deliveries (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  command_id TEXT NOT NULL,
  invitation_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  guest_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  processing_started_at TIMESTAMP(3),
  lease_expires_at TIMESTAMP(3),
  lease_token TEXT,
  accepted_at TIMESTAMP(3),
  delivered_at TIMESTAMP(3),
  bounced_at TIMESTAMP(3),
  failed_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT invitation_deliveries_pkey PRIMARY KEY (id)
);

CREATE TABLE public.attendance_audits (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  guest_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  command_id TEXT NOT NULL,
  action TEXT NOT NULL,
  prior_state BOOLEAN NOT NULL,
  new_state BOOLEAN NOT NULL,
  guest_revision INTEGER NOT NULL,
  occurred_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_audits_pkey PRIMARY KEY (id)
);

CREATE TABLE public.account_deletion_requests (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  user_id TEXT,
  subject_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmation_expires_at TIMESTAMP(3),
  erase_by TIMESTAMP(3) NOT NULL,
  processing_started_at TIMESTAMP(3),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP(3),
  expires_at TIMESTAMP(3) NOT NULL,
  error_code TEXT,
  error_at TIMESTAMP(3),
  CONSTRAINT account_deletion_requests_pkey PRIMARY KEY (id)
);

ALTER TABLE public.mvp_commands
  ADD CONSTRAINT mvp_commands_idempotency_key_check
    CHECK (length(btrim(idempotency_key)) > 0) NOT VALID,
  ADD CONSTRAINT mvp_commands_operation_check
    CHECK (length(btrim(operation)) > 0) NOT VALID,
  ADD CONSTRAINT mvp_commands_request_hash_check
    CHECK (request_hash ~ '^[0-9a-f]{64}$') NOT VALID,
  ADD CONSTRAINT mvp_commands_status_check
    CHECK (status IN ('pending', 'completed', 'failed')) NOT VALID,
  ADD CONSTRAINT mvp_commands_expires_at_check
    CHECK (expires_at > created_at) NOT VALID;

ALTER TABLE public.guest_invitations
  ADD CONSTRAINT guest_invitations_token_hash_check
    CHECK (token_hash ~ '^[0-9a-f]{64}$') NOT VALID,
  ADD CONSTRAINT guest_invitations_expires_at_check
    CHECK (expires_at > created_at) NOT VALID;

ALTER TABLE public.invitation_deliveries
  ADD CONSTRAINT invitation_deliveries_status_check
    CHECK (status IN ('queued', 'processing', 'accepted', 'delivered', 'bounced', 'failed')) NOT VALID,
  ADD CONSTRAINT invitation_deliveries_provider_check
    CHECK (length(btrim(provider)) > 0) NOT VALID,
  ADD CONSTRAINT invitation_deliveries_attempt_count_check
    CHECK (attempt_count >= 0) NOT VALID,
  ADD CONSTRAINT invitation_deliveries_lease_check
    CHECK (
      (
        status = 'processing'
        AND processing_started_at IS NOT NULL
        AND lease_expires_at IS NOT NULL
        AND lease_expires_at > processing_started_at
        AND lease_token IS NOT NULL
        AND length(btrim(lease_token)) > 0
      )
      OR (
        status <> 'processing'
        AND lease_expires_at IS NULL
        AND lease_token IS NULL
      )
    ) NOT VALID;

ALTER TABLE public.attendance_audits
  ADD CONSTRAINT attendance_audits_action_check
    CHECK (action IN ('check_in', 'correction')) NOT VALID,
  ADD CONSTRAINT attendance_audits_guest_revision_check
    CHECK (guest_revision >= 1) NOT VALID;

ALTER TABLE public.account_deletion_requests
  ADD CONSTRAINT account_deletion_requests_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_error_code_check
    CHECK (error_code IS NULL OR length(btrim(error_code)) > 0) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_subject_hash_check
    CHECK (subject_hash IS NULL OR subject_hash ~ '^[0-9a-f]{64}$') NOT VALID,
  ADD CONSTRAINT account_deletion_requests_attempt_count_check
    CHECK (attempt_count >= 0) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_erase_by_check
    CHECK (erase_by >= requested_at) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_expires_at_check
    CHECK (expires_at > requested_at) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_subject_check
    CHECK (
      (status = 'completed' AND user_id IS NULL AND subject_hash IS NOT NULL)
      OR (status <> 'completed' AND user_id IS NOT NULL AND subject_hash IS NULL)
    ) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_completion_check
    CHECK ((status = 'completed') = (completed_at IS NOT NULL)) NOT VALID,
  ADD CONSTRAINT account_deletion_requests_processing_check
    CHECK (
      (status = 'processing' AND processing_started_at IS NOT NULL)
      OR (status <> 'processing' AND processing_started_at IS NULL)
    ) NOT VALID;

ALTER TABLE public.mvp_commands VALIDATE CONSTRAINT mvp_commands_idempotency_key_check;
ALTER TABLE public.mvp_commands VALIDATE CONSTRAINT mvp_commands_operation_check;
ALTER TABLE public.mvp_commands VALIDATE CONSTRAINT mvp_commands_request_hash_check;
ALTER TABLE public.mvp_commands VALIDATE CONSTRAINT mvp_commands_status_check;
ALTER TABLE public.mvp_commands VALIDATE CONSTRAINT mvp_commands_expires_at_check;
ALTER TABLE public.guest_invitations VALIDATE CONSTRAINT guest_invitations_token_hash_check;
ALTER TABLE public.guest_invitations VALIDATE CONSTRAINT guest_invitations_expires_at_check;
ALTER TABLE public.invitation_deliveries VALIDATE CONSTRAINT invitation_deliveries_status_check;
ALTER TABLE public.invitation_deliveries VALIDATE CONSTRAINT invitation_deliveries_provider_check;
ALTER TABLE public.invitation_deliveries VALIDATE CONSTRAINT invitation_deliveries_attempt_count_check;
ALTER TABLE public.invitation_deliveries VALIDATE CONSTRAINT invitation_deliveries_lease_check;
ALTER TABLE public.attendance_audits VALIDATE CONSTRAINT attendance_audits_action_check;
ALTER TABLE public.attendance_audits VALIDATE CONSTRAINT attendance_audits_guest_revision_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_status_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_error_code_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_subject_hash_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_attempt_count_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_erase_by_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_expires_at_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_subject_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_completion_check;
ALTER TABLE public.account_deletion_requests VALIDATE CONSTRAINT account_deletion_requests_processing_check;

CREATE UNIQUE INDEX guests_event_id_normalized_email_key
  ON public.guests(event_id, normalized_email);

CREATE UNIQUE INDEX mvp_commands_actor_id_idempotency_key_key
  ON public.mvp_commands(actor_id, idempotency_key);
CREATE INDEX mvp_commands_status_expires_at_idx
  ON public.mvp_commands(status, expires_at);
CREATE INDEX mvp_commands_actor_id_operation_created_at_idx
  ON public.mvp_commands(actor_id, operation, created_at);

CREATE UNIQUE INDEX guest_invitations_guest_id_key
  ON public.guest_invitations(guest_id);
CREATE UNIQUE INDEX guest_invitations_token_hash_key
  ON public.guest_invitations(token_hash);
CREATE INDEX guest_invitations_event_id_idx
  ON public.guest_invitations(event_id);
CREATE INDEX guest_invitations_expires_at_idx
  ON public.guest_invitations(expires_at);
CREATE INDEX guest_invitations_revoked_at_idx
  ON public.guest_invitations(revoked_at);

CREATE INDEX invitation_deliveries_invitation_id_idx
  ON public.invitation_deliveries(invitation_id);
CREATE UNIQUE INDEX invitation_deliveries_command_id_guest_id_key
  ON public.invitation_deliveries(command_id, guest_id);
CREATE INDEX invitation_deliveries_event_id_status_idx
  ON public.invitation_deliveries(event_id, status);
CREATE INDEX invitation_deliveries_guest_id_created_at_idx
  ON public.invitation_deliveries(guest_id, created_at);
CREATE INDEX invitation_deliveries_status_lease_expires_at_idx
  ON public.invitation_deliveries(status, lease_expires_at);
CREATE INDEX invitation_deliveries_provider_provider_message_id_idx
  ON public.invitation_deliveries(provider, provider_message_id);

CREATE UNIQUE INDEX attendance_audits_command_id_key
  ON public.attendance_audits(command_id);
CREATE INDEX attendance_audits_event_id_occurred_at_idx
  ON public.attendance_audits(event_id, occurred_at);
CREATE INDEX attendance_audits_guest_id_occurred_at_idx
  ON public.attendance_audits(guest_id, occurred_at);
CREATE INDEX attendance_audits_actor_id_occurred_at_idx
  ON public.attendance_audits(actor_id, occurred_at);

CREATE UNIQUE INDEX account_deletion_requests_user_id_key
  ON public.account_deletion_requests(user_id);
CREATE UNIQUE INDEX account_deletion_requests_subject_hash_key
  ON public.account_deletion_requests(subject_hash);
CREATE INDEX account_deletion_requests_status_requested_at_idx
  ON public.account_deletion_requests(status, requested_at);
CREATE INDEX account_deletion_requests_completed_at_idx
  ON public.account_deletion_requests(completed_at);
CREATE INDEX account_deletion_requests_expires_at_idx
  ON public.account_deletion_requests(expires_at);

ALTER TABLE public.mvp_commands
  ADD CONSTRAINT mvp_commands_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.guest_invitations
  ADD CONSTRAINT guest_invitations_guest_id_fkey
  FOREIGN KEY (guest_id) REFERENCES public.guests(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT guest_invitations_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.invitation_deliveries
  ADD CONSTRAINT invitation_deliveries_command_id_fkey
  FOREIGN KEY (command_id) REFERENCES public.mvp_commands(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT invitation_deliveries_invitation_id_fkey
  FOREIGN KEY (invitation_id) REFERENCES public.guest_invitations(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT invitation_deliveries_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT invitation_deliveries_guest_id_fkey
  FOREIGN KEY (guest_id) REFERENCES public.guests(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.attendance_audits
  ADD CONSTRAINT attendance_audits_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT attendance_audits_guest_id_fkey
  FOREIGN KEY (guest_id) REFERENCES public.guests(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT attendance_audits_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT attendance_audits_command_id_fkey
  FOREIGN KEY (command_id) REFERENCES public.mvp_commands(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.normalize_guest_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.normalized_email := lower(btrim(NEW.email));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_normalize_guest_email
BEFORE INSERT OR UPDATE OF email ON public.guests
FOR EACH ROW
EXECUTE FUNCTION public.normalize_guest_email();

CREATE OR REPLACE FUNCTION public.enforce_event_guest_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  event_limit INTEGER;
  guest_count BIGINT;
BEGIN
  SELECT LEAST(max_guests, 50)
  INTO event_limit
  FROM public.events
  WHERE id = NEW.event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT count(*)
    INTO guest_count
    FROM public.guests
    WHERE event_id = NEW.event_id;
  ELSE
    SELECT count(*)
    INTO guest_count
    FROM public.guests
    WHERE event_id = NEW.event_id
      AND id <> OLD.id;
  END IF;

  IF guest_count >= event_limit THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'GUEST_LIMIT_REACHED';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_enforce_event_guest_limit
BEFORE INSERT OR UPDATE OF event_id ON public.guests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_event_guest_limit();

COMMIT;
