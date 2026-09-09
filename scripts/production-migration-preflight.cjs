'use strict';

const { Client } = require('pg');

const CHECKS = [
  ['prisma_history_exists', "SELECT CASE WHEN to_regclass('public._prisma_migrations') IS NULL THEN 0 ELSE 1 END::bigint AS count"],
  ['blank_guest_email', "SELECT count(*) FROM guests WHERE length(btrim(email)) = 0"],
  ['duplicate_guest_email_groups', "SELECT count(*) FROM (SELECT event_id, lower(btrim(email)) FROM guests GROUP BY event_id, lower(btrim(email)) HAVING count(*) > 1) duplicates"],
  ['events_over_50', "SELECT count(*) FROM (SELECT event_id FROM guests GROUP BY event_id HAVING count(*) > 50) oversized"],
  ['invalid_event_capacity', "SELECT count(*) FROM events WHERE max_guests IS NOT NULL AND (max_guests < 1 OR max_guests > 50)"],
  ['invalid_checkin_rsvp', "SELECT count(*) FROM guests WHERE (checked_in OR is_checked_in) AND rsvp_status NOT IN ('accepted', 'confirmed')"],
  ['invalid_event_window', 'SELECT count(*) FROM events WHERE end_date < start_date'],
  ['invalid_event_type', "SELECT count(*) FROM events WHERE event_type NOT IN ('single_day', 'multi_day')"],
  ['invalid_event_privacy', "SELECT count(*) FROM events WHERE privacy NOT IN ('public', 'private', 'unlisted')"],
  ['invalid_event_status', "SELECT count(*) FROM events WHERE status NOT IN ('draft', 'published', 'active', 'completed', 'cancelled', 'archived')"],
  ['invalid_guest_email_status', "SELECT count(*) FROM guests WHERE email_status NOT IN ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')"],
  ['invalid_guest_rsvp', "SELECT count(*) FROM guests WHERE rsvp_status NOT IN ('pending', 'accepted', 'confirmed', 'declined', 'maybe')"],
  ['invalid_guest_role', "SELECT count(*) FROM guests WHERE role NOT IN ('host', 'co-host', 'guest', 'vendor', 'volunteer')"],
  ['invalid_guest_plus_ones', 'SELECT count(*) FROM guests WHERE plus_ones < 0'],
  ['invalid_username', "SELECT count(*) FROM user_profiles WHERE char_length(username) < 3 OR username !~ '^[a-zA-Z0-9_]+$'"],
  ['username_truncation_collision', 'SELECT count(*) FROM (SELECT left(username, 30) FROM user_profiles GROUP BY left(username, 30) HAVING count(*) > 1 AND bool_or(char_length(username) > 30)) collisions'],
  ['invalid_invite_max_uses', 'SELECT count(*) FROM event_invite_tokens WHERE max_uses IS NOT NULL AND max_uses <= 0'],
  ['invalid_invite_current_uses', 'SELECT count(*) FROM event_invite_tokens WHERE current_uses < 0 OR current_uses > COALESCE(max_uses, current_uses)'],
];

function clientConfig() {
  if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_PASSWORD) {
    throw new Error('POSTGRES_HOST and POSTGRES_PASSWORD are required');
  }
  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: process.env.POSTGRES_SSL_MODE === 'disable' ? false : { rejectUnauthorized: false },
  };
}

async function main() {
  const client = new Client(clientConfig());
  await client.connect();
  try {
    const results = [];
    for (const [name, sql] of CHECKS) {
      const result = await client.query(sql);
      results.push({ name, count: Number(result.rows[0].count) });
    }
    console.log(JSON.stringify(results));
    const failures = results.filter((result) => result.name !== 'prisma_history_exists' && result.count !== 0);
    if (results[0].count !== 0) failures.push(results[0]);
    if (failures.length > 0) process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.name : 'UnknownError');
  process.exit(1);
});
