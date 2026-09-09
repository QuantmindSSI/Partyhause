'use strict';

const { Client } = require('pg');

const TIMESTAMP = 'timestamp(3) without time zone';
const column = (name, dataType, notNull, defaultValue = null) => ({ name, dataType, notNull, defaultValue });
const index = (table, columns, unique = false, primary = false) => ({ table, columns, unique, primary });

const REQUIRED_CONSTRAINTS = {
  check_end_date_after_start_date: ['events', 'CHECK ((end_date >= start_date))'],
  event_invite_tokens_current_uses_check: ['event_invite_tokens', 'CHECK (((current_uses >= 0) AND (current_uses <= COALESCE(max_uses, current_uses))))'],
  event_invite_tokens_max_uses_check: ['event_invite_tokens', 'CHECK (((max_uses IS NULL) OR (max_uses > 0)))'],
  events_event_type_check: ['events', `CHECK ((event_type = ANY (ARRAY['single_day'::text, 'multi_day'::text])))`],
  events_max_guests_check: ['events', 'CHECK (((max_guests >= 1) AND (max_guests <= 50)))'],
  events_privacy_check: ['events', `CHECK ((privacy = ANY (ARRAY['public'::text, 'private'::text, 'unlisted'::text])))`],
  events_revision_check: ['events', 'CHECK ((revision >= 1))'],
  events_status_check: ['events', `CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'archived'::text])))`],
  guests_check_in_requires_accepted_check: ['guests', `CHECK ((((NOT checked_in) AND (NOT is_checked_in)) OR (rsvp_status = 'accepted'::text)))`],
  guests_email_nonempty_check: ['guests', 'CHECK ((length(TRIM(BOTH FROM email)) > 0))'],
  guests_email_status_check: ['guests', `CHECK ((email_status = ANY (ARRAY['not_sent'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'failed'::text])))`],
  guests_normalized_email_check: ['guests', 'CHECK (((length(normalized_email) > 0) AND (normalized_email = lower(btrim(email)))))'],
  guests_plus_ones_check: ['guests', 'CHECK ((plus_ones >= 0))'],
  guests_revision_check: ['guests', 'CHECK ((revision >= 1))'],
  guests_role_check: ['guests', `CHECK ((role = ANY (ARRAY['host'::text, 'co-host'::text, 'guest'::text, 'vendor'::text, 'volunteer'::text])))`],
  guests_rsvp_status_check: ['guests', `CHECK ((rsvp_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'maybe'::text])))`],
  user_profiles_username_format_check: ['user_profiles', `CHECK ((username ~ '^[a-zA-Z0-9_]+$'::text))`],
  user_profiles_username_length_check: ['user_profiles', 'CHECK (((char_length(username) >= 3) AND (char_length(username) <= 30)))'],
  users_account_status_check: ['users', `CHECK ((account_status = ANY (ARRAY['active'::text, 'deletion_pending'::text])))`],
  users_token_version_check: ['users', 'CHECK ((token_version >= 0))'],
  mvp_commands_idempotency_key_check: ['mvp_commands', 'CHECK ((length(btrim(idempotency_key)) > 0))'],
  mvp_commands_operation_check: ['mvp_commands', 'CHECK ((length(btrim(operation)) > 0))'],
  mvp_commands_request_hash_check: ['mvp_commands', `CHECK ((request_hash ~ '^[0-9a-f]{64}$'::text))`],
  mvp_commands_status_check: ['mvp_commands', `CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))`],
  mvp_commands_expires_at_check: ['mvp_commands', 'CHECK ((expires_at > created_at))'],
  guest_invitations_token_hash_check: ['guest_invitations', `CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))`],
  guest_invitations_expires_at_check: ['guest_invitations', 'CHECK ((expires_at > created_at))'],
  invitation_deliveries_status_check: ['invitation_deliveries', `CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'accepted'::text, 'delivered'::text, 'bounced'::text, 'failed'::text])))`],
  invitation_deliveries_provider_check: ['invitation_deliveries', 'CHECK ((length(btrim(provider)) > 0))'],
  invitation_deliveries_attempt_count_check: ['invitation_deliveries', 'CHECK ((attempt_count >= 0))'],
  invitation_deliveries_lease_check: ['invitation_deliveries', `CHECK ((((status = 'processing'::text) AND (processing_started_at IS NOT NULL) AND (lease_expires_at IS NOT NULL) AND (lease_expires_at > processing_started_at) AND (lease_token IS NOT NULL) AND (length(btrim(lease_token)) > 0)) OR ((status <> 'processing'::text) AND (lease_expires_at IS NULL) AND (lease_token IS NULL))))`],
  attendance_audits_action_check: ['attendance_audits', `CHECK ((action = ANY (ARRAY['check_in'::text, 'correction'::text])))`],
  attendance_audits_guest_revision_check: ['attendance_audits', 'CHECK ((guest_revision >= 1))'],
  account_deletion_requests_status_check: ['account_deletion_requests', `CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))`],
  account_deletion_requests_error_code_check: ['account_deletion_requests', 'CHECK (((error_code IS NULL) OR (length(btrim(error_code)) > 0)))'],
  account_deletion_requests_subject_hash_check: ['account_deletion_requests', `CHECK (((subject_hash IS NULL) OR (subject_hash ~ '^[0-9a-f]{64}$'::text)))`],
  account_deletion_requests_attempt_count_check: ['account_deletion_requests', 'CHECK ((attempt_count >= 0))'],
  account_deletion_requests_erase_by_check: ['account_deletion_requests', 'CHECK ((erase_by >= requested_at))'],
  account_deletion_requests_expires_at_check: ['account_deletion_requests', 'CHECK ((expires_at > requested_at))'],
};

const REQUIRED_COLUMNS = {
  users: [
    column('token_version', 'integer', true, '0'),
    column('account_status', 'text', true, `'active'::text`),
    column('terms_version', 'text', false),
    column('privacy_version', 'text', false),
    column('age_eligible', 'boolean', true, 'false'),
    column('deletion_requested_at', TIMESTAMP, false),
  ],
  events: [
    column('max_guests', 'integer', true, '50'),
    column('revision', 'integer', true, '1'),
    column('published_at', TIMESTAMP, false),
    column('cancelled_at', TIMESTAMP, false),
    column('completed_at', TIMESTAMP, false),
  ],
  guests: [
    column('normalized_email', 'text', true, `''::text`),
    column('revision', 'integer', true, '1'),
    column('rsvp_responded_at', TIMESTAMP, false),
  ],
};

const REQUIRED_TABLES = {
  mvp_commands: [
    column('id', 'text', true, 'gen_random_uuid()'),
    column('actor_id', 'text', true),
    column('idempotency_key', 'text', true),
    column('operation', 'text', true),
    column('request_hash', 'text', true),
    column('status', 'text', true, `'pending'::text`),
    column('request_payload', 'jsonb', false),
    column('response', 'jsonb', false),
    column('created_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
    column('updated_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
    column('expires_at', TIMESTAMP, true),
  ],
  guest_invitations: [
    column('id', 'text', true, 'gen_random_uuid()'),
    column('guest_id', 'text', true),
    column('event_id', 'text', true),
    column('token_hash', 'text', true),
    column('expires_at', TIMESTAMP, true),
    column('revoked_at', TIMESTAMP, false),
    column('created_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
    column('updated_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
  ],
  invitation_deliveries: [
    column('id', 'text', true, 'gen_random_uuid()'),
    column('command_id', 'text', true),
    column('invitation_id', 'text', true),
    column('event_id', 'text', true),
    column('guest_id', 'text', true),
    column('status', 'text', true, `'queued'::text`),
    column('provider', 'text', true),
    column('provider_message_id', 'text', false),
    column('attempt_count', 'integer', true, '0'),
    column('error_code', 'text', false),
    column('processing_started_at', TIMESTAMP, false),
    column('lease_expires_at', TIMESTAMP, false),
    column('lease_token', 'text', false),
    column('accepted_at', TIMESTAMP, false),
    column('delivered_at', TIMESTAMP, false),
    column('bounced_at', TIMESTAMP, false),
    column('failed_at', TIMESTAMP, false),
    column('created_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
    column('updated_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
  ],
  attendance_audits: [
    column('id', 'text', true, 'gen_random_uuid()'),
    column('event_id', 'text', true),
    column('guest_id', 'text', true),
    column('actor_id', 'text', true),
    column('command_id', 'text', true),
    column('action', 'text', true),
    column('prior_state', 'boolean', true),
    column('new_state', 'boolean', true),
    column('guest_revision', 'integer', true),
    column('occurred_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
  ],
  account_deletion_requests: [
    column('id', 'text', true, 'gen_random_uuid()'),
    column('user_id', 'text', false),
    column('subject_hash', 'text', false),
    column('status', 'text', true, `'pending'::text`),
    column('requested_at', TIMESTAMP, true, 'CURRENT_TIMESTAMP'),
    column('confirmation_expires_at', TIMESTAMP, false),
    column('erase_by', TIMESTAMP, true),
    column('processing_started_at', TIMESTAMP, false),
    column('attempt_count', 'integer', true, '0'),
    column('completed_at', TIMESTAMP, false),
    column('expires_at', TIMESTAMP, true),
    column('error_code', 'text', false),
    column('error_at', TIMESTAMP, false),
  ],
};

const REQUIRED_INDEXES = {
  guests_event_id_normalized_email_key: index('guests', ['event_id', 'normalized_email'], true),
  mvp_commands_pkey: index('mvp_commands', ['id'], true, true),
  mvp_commands_actor_id_idempotency_key_key: index('mvp_commands', ['actor_id', 'idempotency_key'], true),
  mvp_commands_status_expires_at_idx: index('mvp_commands', ['status', 'expires_at']),
  mvp_commands_actor_id_operation_created_at_idx: index('mvp_commands', ['actor_id', 'operation', 'created_at']),
  guest_invitations_pkey: index('guest_invitations', ['id'], true, true),
  guest_invitations_guest_id_key: index('guest_invitations', ['guest_id'], true),
  guest_invitations_token_hash_key: index('guest_invitations', ['token_hash'], true),
  guest_invitations_event_id_idx: index('guest_invitations', ['event_id']),
  guest_invitations_expires_at_idx: index('guest_invitations', ['expires_at']),
  guest_invitations_revoked_at_idx: index('guest_invitations', ['revoked_at']),
  invitation_deliveries_pkey: index('invitation_deliveries', ['id'], true, true),
  invitation_deliveries_command_id_guest_id_key: index('invitation_deliveries', ['command_id', 'guest_id'], true),
  invitation_deliveries_invitation_id_idx: index('invitation_deliveries', ['invitation_id']),
  invitation_deliveries_event_id_status_idx: index('invitation_deliveries', ['event_id', 'status']),
  invitation_deliveries_guest_id_created_at_idx: index('invitation_deliveries', ['guest_id', 'created_at']),
  invitation_deliveries_status_lease_expires_at_idx: index('invitation_deliveries', ['status', 'lease_expires_at']),
  invitation_deliveries_provider_provider_message_id_idx: index('invitation_deliveries', ['provider', 'provider_message_id']),
  attendance_audits_pkey: index('attendance_audits', ['id'], true, true),
  attendance_audits_command_id_key: index('attendance_audits', ['command_id'], true),
  attendance_audits_event_id_occurred_at_idx: index('attendance_audits', ['event_id', 'occurred_at']),
  attendance_audits_guest_id_occurred_at_idx: index('attendance_audits', ['guest_id', 'occurred_at']),
  attendance_audits_actor_id_occurred_at_idx: index('attendance_audits', ['actor_id', 'occurred_at']),
  account_deletion_requests_pkey: index('account_deletion_requests', ['id'], true, true),
  account_deletion_requests_user_id_key: index('account_deletion_requests', ['user_id'], true),
  account_deletion_requests_subject_hash_key: index('account_deletion_requests', ['subject_hash'], true),
  account_deletion_requests_status_requested_at_idx: index('account_deletion_requests', ['status', 'requested_at']),
  account_deletion_requests_completed_at_idx: index('account_deletion_requests', ['completed_at']),
  account_deletion_requests_expires_at_idx: index('account_deletion_requests', ['expires_at']),
};

const REQUIRED_FOREIGN_KEYS = {
  mvp_commands_actor_id_fkey: ['mvp_commands', ['actor_id'], 'users', ['id']],
  invitation_deliveries_command_id_fkey: ['invitation_deliveries', ['command_id'], 'mvp_commands', ['id']],
  guest_invitations_guest_id_fkey: ['guest_invitations', ['guest_id'], 'guests', ['id']],
  guest_invitations_event_id_fkey: ['guest_invitations', ['event_id'], 'events', ['id']],
  invitation_deliveries_invitation_id_fkey: ['invitation_deliveries', ['invitation_id'], 'guest_invitations', ['id']],
  invitation_deliveries_event_id_fkey: ['invitation_deliveries', ['event_id'], 'events', ['id']],
  invitation_deliveries_guest_id_fkey: ['invitation_deliveries', ['guest_id'], 'guests', ['id']],
  attendance_audits_event_id_fkey: ['attendance_audits', ['event_id'], 'events', ['id']],
  attendance_audits_guest_id_fkey: ['attendance_audits', ['guest_id'], 'guests', ['id']],
  attendance_audits_actor_id_fkey: ['attendance_audits', ['actor_id'], 'users', ['id']],
  attendance_audits_command_id_fkey: ['attendance_audits', ['command_id'], 'mvp_commands', ['id']],
};

const REQUIRED_FUNCTIONS = [
  'check_poll_consensus',
  'convert_guest_to_crew',
  'enforce_event_guest_limit',
  'generate_invite_token',
  'get_mutual_crew_count',
  'increment_token_usage',
  'is_following',
  'is_invite_token_valid',
  'is_mutual_crew',
  'normalize_guest_email',
  'update_event_cost_summary',
  'update_partycrew_counts',
];

const FUNCTION_FRAGMENTS = {
  convert_guest_to_crew: ['v_event_host :=', 'p_guest_id::text'],
  increment_token_usage: ['for update', 'current_uses = current_uses + 1'],
  update_event_cost_summary: ["tg_op = 'delete'", 'on conflict (event_id) do update'],
};

const EXACT_FUNCTIONS = {
  normalize_guest_email: `
    BEGIN
      NEW.normalized_email := lower(btrim(NEW.email));
      RETURN NEW;
    END;
  `,
  enforce_event_guest_limit: `
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
  `,
};

const REQUIRED_TRIGGERS = {
  trigger_check_poll_consensus: ['poll_votes'],
  trigger_update_cost_summary: ['cost_split_requests'],
  trigger_update_partycrew_counts: ['connections'],
  trigger_enforce_event_guest_limit: [
    'guests',
    'CREATE TRIGGER trigger_enforce_event_guest_limit BEFORE INSERT OR UPDATE OF event_id ON public.guests FOR EACH ROW EXECUTE FUNCTION enforce_event_guest_limit()',
  ],
  trigger_normalize_guest_email: [
    'guests',
    'CREATE TRIGGER trigger_normalize_guest_email BEFORE INSERT OR UPDATE OF email ON public.guests FOR EACH ROW EXECUTE FUNCTION normalize_guest_email()',
  ],
};

function normalizeSql(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

async function loadColumns(client, tables) {
  const result = await client.query(
    `SELECT c.relname AS table_name, a.attnum, a.attname AS name,
            format_type(a.atttypid, a.atttypmod) AS data_type,
            a.attnotnull AS not_null,
            pg_get_expr(d.adbin, d.adrelid) AS default_value
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY($1::text[])
     ORDER BY c.relname, a.attnum`,
    [tables],
  );
  return result.rows;
}

function comparableColumn(row) {
  return column(row.name, row.data_type, row.not_null, row.default_value);
}

async function verifyTablesAndColumns(client) {
  const tableNames = [...Object.keys(REQUIRED_TABLES), ...Object.keys(REQUIRED_COLUMNS)];
  const rows = await loadColumns(client, tableNames);
  for (const [table, expected] of Object.entries(REQUIRED_TABLES)) {
    const actual = rows.filter((row) => row.table_name === table).map(comparableColumn);
    assertEqual(actual, expected, `Table ${table} has the wrong column definition`);
  }
  for (const [table, expected] of Object.entries(REQUIRED_COLUMNS)) {
    const byName = new Map(rows.filter((row) => row.table_name === table).map((row) => [row.name, comparableColumn(row)]));
    for (const expectedColumn of expected) {
      assertEqual(byName.get(expectedColumn.name), expectedColumn, `Column ${table}.${expectedColumn.name} has the wrong definition`);
    }
  }
}

async function verifyConstraints(client) {
  const names = Object.keys(REQUIRED_CONSTRAINTS);
  const result = await client.query(
    `SELECT conname, convalidated, conrelid::regclass::text AS table_name,
            pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE connamespace = 'public'::regnamespace AND conname = ANY($1::text[])`,
    [names],
  );
  const rows = new Map(result.rows.map((row) => [row.conname, row]));
  for (const [name, [table, definition]] of Object.entries(REQUIRED_CONSTRAINTS)) {
    const row = rows.get(name);
    if (!row || row.table_name !== table || row.convalidated !== true) {
      throw new Error(`Constraint ${name} is missing, unvalidated, or attached to the wrong table`);
    }
    assertEqual(normalizeSql(row.definition), normalizeSql(definition), `Constraint ${name} has the wrong definition`);
  }
}

async function verifyIndexes(client) {
  const tables = Object.keys(REQUIRED_TABLES);
  const result = await client.query(
    `SELECT idx.relname AS index_name, tbl.relname AS table_name,
            i.indisunique AS is_unique, i.indisprimary AS is_primary,
            i.indisvalid AS is_valid, i.indisready AS is_ready, am.amname AS method,
            ARRAY(SELECT pg_get_indexdef(i.indexrelid, position, true)
                  FROM generate_series(1, i.indnkeyatts) AS position
                  ORDER BY position) AS columns,
            pg_get_expr(i.indpred, i.indrelid) AS predicate
     FROM pg_index i
     JOIN pg_class idx ON idx.oid = i.indexrelid
     JOIN pg_class tbl ON tbl.oid = i.indrelid
     JOIN pg_namespace n ON n.oid = tbl.relnamespace
     JOIN pg_am am ON am.oid = idx.relam
     WHERE n.nspname = 'public'
       AND (tbl.relname = ANY($1::text[]) OR idx.relname = 'guests_event_id_normalized_email_key')`,
    [tables],
  );
  assertEqual(result.rows.map((row) => row.index_name).sort(), Object.keys(REQUIRED_INDEXES).sort(), 'MVP index set is wrong');
  for (const row of result.rows) {
    const expected = REQUIRED_INDEXES[row.index_name];
    const actual = index(row.table_name, row.columns, row.is_unique, row.is_primary);
    assertEqual(actual, expected, `Index ${row.index_name} has the wrong definition`);
    if (!row.is_valid || !row.is_ready || row.method !== 'btree' || row.predicate !== null) {
      throw new Error(`Index ${row.index_name} is invalid, unready, partial, or not btree`);
    }
  }
}

async function verifyForeignKeys(client) {
  const tables = Object.keys(REQUIRED_TABLES);
  const result = await client.query(
    `SELECT con.conname, child.relname AS table_name, parent.relname AS referenced_table,
            con.confdeltype, con.confupdtype,
            ARRAY(SELECT a.attname::text FROM unnest(con.conkey) WITH ORDINALITY key(attnum, position)
                  JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = key.attnum
                  ORDER BY key.position)::text[] AS columns,
            ARRAY(SELECT a.attname::text FROM unnest(con.confkey) WITH ORDINALITY key(attnum, position)
                  JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = key.attnum
                  ORDER BY key.position)::text[] AS referenced_columns
     FROM pg_constraint con
     JOIN pg_class child ON child.oid = con.conrelid
     JOIN pg_class parent ON parent.oid = con.confrelid
     JOIN pg_namespace n ON n.oid = child.relnamespace
     WHERE con.contype = 'f' AND n.nspname = 'public' AND child.relname = ANY($1::text[])
     ORDER BY con.conname`,
    [tables],
  );
  assertEqual(result.rows.map((row) => row.conname).sort(), Object.keys(REQUIRED_FOREIGN_KEYS).sort(), 'MVP foreign key set is wrong');
  for (const row of result.rows) {
    const expected = REQUIRED_FOREIGN_KEYS[row.conname];
    assertEqual([row.table_name, row.columns, row.referenced_table, row.referenced_columns], expected, `Foreign key ${row.conname} has the wrong columns`);
    if (row.confdeltype !== 'c' || row.confupdtype !== 'c') {
      throw new Error(`Foreign key ${row.conname} must cascade on delete and update`);
    }
  }
}

async function verifyFunctions(client) {
  const result = await client.query(
    `SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
            pg_get_function_result(p.oid) AS result, l.lanname AS language,
            p.provolatile AS volatility, p.prosecdef AS security_definer,
            p.prosrc AS source, pg_get_functiondef(p.oid) AS definition
     FROM pg_proc p
     JOIN pg_language l ON l.oid = p.prolang
     WHERE p.pronamespace = 'public'::regnamespace AND p.proname = ANY($1::text[])`,
    [REQUIRED_FUNCTIONS],
  );
  const names = new Set(result.rows.map((row) => row.proname));
  const absent = REQUIRED_FUNCTIONS.filter((name) => !names.has(name));
  if (absent.length > 0) throw new Error(`Missing functions: ${absent.join(', ')}`);
  for (const [name, fragments] of Object.entries(FUNCTION_FRAGMENTS)) {
    const definitions = result.rows.filter((row) => row.proname === name).map((row) => row.definition.toLowerCase());
    if (!definitions.some((definition) => fragments.every((fragment) => definition.includes(fragment)))) {
      throw new Error(`Function ${name} does not contain its required concurrency behavior`);
    }
  }
  for (const [name, source] of Object.entries(EXACT_FUNCTIONS)) {
    const matches = result.rows.filter((row) => row.proname === name);
    if (matches.length !== 1) throw new Error(`Function ${name} is missing or overloaded`);
    const row = matches[0];
    assertEqual([row.arguments, row.result, row.language, row.volatility, row.security_definer], ['', 'trigger', 'plpgsql', 'v', false], `Function ${name} has the wrong signature`);
    assertEqual(normalizeSql(row.source), normalizeSql(source), `Function ${name} has the wrong body`);
  }
}

async function verifyTriggers(client) {
  const result = await client.query(
    `SELECT tgname, tgrelid::regclass::text AS table_name, tgenabled,
            pg_get_triggerdef(oid) AS definition
     FROM pg_trigger
     WHERE NOT tgisinternal AND tgname = ANY($1::text[])
     ORDER BY tgname`,
    [Object.keys(REQUIRED_TRIGGERS)],
  );
  for (const [name, [table, definition]] of Object.entries(REQUIRED_TRIGGERS)) {
    const matches = result.rows.filter((row) => row.tgname === name && row.table_name === table);
    if (matches.length !== 1 || matches[0].tgenabled !== 'O') {
      throw new Error(`Trigger ${name} is missing, disabled, duplicated, or attached to the wrong table`);
    }
    if (definition) {
      assertEqual(normalizeSql(matches[0].definition), normalizeSql(definition), `Trigger ${name} has the wrong definition`);
    } else if (!matches[0].definition.includes('EXECUTE FUNCTION')) {
      throw new Error(`Trigger ${name} does not execute a function`);
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to verify migration invariants');
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await verifyTablesAndColumns(client);
    await verifyConstraints(client);
    await verifyIndexes(client);
    await verifyForeignKeys(client);
    await verifyFunctions(client);
    await verifyTriggers(client);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
