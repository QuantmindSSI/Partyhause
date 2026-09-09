'use strict';

const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');

const MIGRATIONS = [
  {
    name: '20260905000000_baseline',
    checksum: '9bbb71e20b93512bde022f508fed6d9a3fdb34aee405f882f698e14109404603',
    baseline: true,
  },
  {
    name: '20260905000100_database_functions',
    checksum: '5505cda2090c1051e866929a1589d1683e6a671640cc9542f18aed3b83aa71c6',
    file: path.join(REPOSITORY_ROOT, 'prisma/migrations/20260905000100_database_functions/migration.sql'),
  },
  {
    name: '20260905000200_core_integrity_constraints',
    checksum: '7c9c5ca270b6bf922bc9d2ddcea51644201b837d216efb12bfe98cfd65bc532e',
    file: path.join(REPOSITORY_ROOT, 'prisma/migrations/20260905000200_core_integrity_constraints/migration.sql'),
  },
  {
    name: '20260906000000_ios_mvp_domain',
    checksum: '2762cd762beae573b13c9a562ba708e14a50d248955380fc3828270e68556157',
    file: path.join(REPOSITORY_ROOT, 'prisma/migrations/20260906000000_ios_mvp_domain/migration.sql'),
  },
];

const CREATE_HISTORY = `
  CREATE TABLE IF NOT EXISTS public._prisma_migrations (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMPTZ,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )
`;

const PREFLIGHT = `
  SELECT
    (SELECT count(*) FROM guests WHERE length(btrim(email)) = 0) AS blank_email,
    (SELECT count(*) FROM (
      SELECT event_id, lower(btrim(email))
      FROM guests
      GROUP BY event_id, lower(btrim(email))
      HAVING count(*) > 1
    ) duplicates) AS duplicate_email,
    (SELECT count(*) FROM (
      SELECT event_id FROM guests GROUP BY event_id HAVING count(*) > 50
    ) oversized) AS over_50,
    (SELECT count(*) FROM events
      WHERE max_guests IS NOT NULL AND (max_guests < 1 OR max_guests > 50)) AS bad_capacity,
    (SELECT count(*) FROM guests
      WHERE (checked_in OR is_checked_in)
        AND rsvp_status NOT IN ('accepted', 'confirmed')) AS bad_checkin,
    (SELECT count(*) FROM events WHERE end_date < start_date) AS bad_event_window,
    (SELECT count(*) FROM events
      WHERE event_type NOT IN ('single_day', 'multi_day')) AS bad_event_type,
    (SELECT count(*) FROM events
      WHERE privacy NOT IN ('public', 'private', 'unlisted')) AS bad_event_privacy,
    (SELECT count(*) FROM events
      WHERE status NOT IN ('draft', 'published', 'active', 'completed', 'cancelled', 'archived')) AS bad_event_status,
    (SELECT count(*) FROM guests
      WHERE email_status NOT IN ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')) AS bad_email_status,
    (SELECT count(*) FROM guests
      WHERE rsvp_status NOT IN ('pending', 'accepted', 'confirmed', 'declined', 'maybe')) AS bad_rsvp_status,
    (SELECT count(*) FROM guests
      WHERE role NOT IN ('host', 'co-host', 'guest', 'vendor', 'volunteer')) AS bad_guest_role,
    (SELECT count(*) FROM guests WHERE plus_ones < 0) AS bad_plus_ones,
    (SELECT count(*) FROM user_profiles
      WHERE char_length(username) < 3
        OR username !~ '^[a-zA-Z0-9_]+$') AS bad_username,
    (SELECT count(*) FROM (
      SELECT left(username, 30)
      FROM user_profiles
      GROUP BY left(username, 30)
      HAVING count(*) > 1 AND bool_or(char_length(username) > 30)
    ) collisions) AS username_truncation_collision,
    (SELECT count(*) FROM event_invite_tokens
      WHERE max_uses IS NOT NULL AND max_uses <= 0) AS bad_invite_max_uses,
    (SELECT count(*) FROM event_invite_tokens
      WHERE current_uses < 0
        OR current_uses > COALESCE(max_uses, current_uses)) AS bad_invite_current_uses
`;

function connectionConfig() {
  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: process.env.POSTGRES_SSL_MODE === 'disable' ? false : { rejectUnauthorized: false },
  };
}

function migrationSql(file) {
  return fs.readFileSync(file, 'utf8');
}

function executableSql(migration) {
  const sql = migrationSql(migration.file);
  const checksum = createHash('sha256').update(sql).digest('hex');
  if (checksum !== migration.checksum) {
    throw new Error(`Migration checksum mismatch: ${migration.name}`);
  }
  return sql.trim().replace(/^BEGIN;\s*/i, '').replace(/\s*COMMIT;\s*$/i, '');
}

async function recordMigration(client, migration) {
  await client.query(
    `INSERT INTO public._prisma_migrations (
       id, checksum, finished_at, migration_name, logs, rolled_back_at,
       started_at, applied_steps_count
     ) VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
    [randomUUID(), migration.checksum, migration.name],
  );
}

async function applyMigration(client, migration) {
  if (migration.baseline) {
    await client.query('BEGIN');
    try {
      await recordMigration(client, migration);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    return;
  }

  const sql = executableSql(migration);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await recordMigration(client, migration);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function assertPreflight(client) {
  const result = await client.query(PREFLIGHT);
  const unsafe = Object.entries(result.rows[0]).filter(([, count]) => Number(count) !== 0);
  if (unsafe.length > 0) {
    throw new Error(`Production preflight failed: ${unsafe.map(([name]) => name).join(', ')}`);
  }
}

async function readHistory(client) {
  await client.query(CREATE_HISTORY);
  const result = await client.query(
    `SELECT migration_name, checksum, finished_at, rolled_back_at
     FROM public._prisma_migrations
     ORDER BY started_at`,
  );
  if (result.rows.length > MIGRATIONS.length) {
    throw new Error('Migration history contains more entries than expected');
  }
  result.rows.forEach((row, index) => {
    const expected = MIGRATIONS[index];
    if (row.migration_name !== expected.name || row.checksum !== expected.checksum) {
      throw new Error(`Unexpected migration history entry: ${row.migration_name}`);
    }
    if (!row.finished_at || row.rolled_back_at) {
      throw new Error(`Incomplete migration history entry: ${row.migration_name}`);
    }
  });
  return result.rows;
}

async function applyPendingMigrations(client, history) {
  for (let index = history.length; index < MIGRATIONS.length; index += 1) {
    const migration = MIGRATIONS[index];
    await applyMigration(client, migration);
    console.log(`APPLIED ${migration.name}`);
  }
}

async function printHistory(client) {
  const result = await client.query(
    `SELECT migration_name, checksum, finished_at IS NOT NULL AS finished
     FROM public._prisma_migrations
     ORDER BY migration_name`,
  );
  console.log(JSON.stringify(result.rows));
}

async function main() {
  const client = new Client(connectionConfig());
  await client.connect();
  try {
    await client.query("SET lock_timeout = '10s'");
    await client.query("SET statement_timeout = '5min'");
    await assertPreflight(client);
    const history = await readHistory(client);
    await applyPendingMigrations(client, history);
    await printHistory(client);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
