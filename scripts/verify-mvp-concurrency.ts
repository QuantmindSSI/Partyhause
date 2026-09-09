import { randomUUID } from 'node:crypto';

import { Client } from 'pg';

const GUEST_LIMIT = 50;
const BLOCK_POLL_ATTEMPTS = 100;
const BLOCK_POLL_DELAY_MS = 20;
const TEST_DOMAIN = 'mvp-concurrency.invalid';

const INSERT_GUEST_SQL = `
  INSERT INTO public.guests (
    id, event_id, name, email, dietary_restrictions
  ) VALUES ($1, $2, $3, $4, ARRAY[]::TEXT[])
  RETURNING id, normalized_email
`;

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function errorField(error: unknown, field: 'code' | 'constraint' | 'message'): string {
  if (!error || typeof error !== 'object' || !(field in error)) return '';
  return String((error as Record<string, unknown>)[field] ?? '');
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function backendPid(client: Client): Promise<number> {
  const result = await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid');
  return result.rows[0].pid;
}

async function waitUntilBlocked(
  observer: Client,
  blockedPid: number,
  blockerPid: number,
): Promise<void> {
  for (let attempt = 0; attempt < BLOCK_POLL_ATTEMPTS; attempt += 1) {
    const result = await observer.query<{ blocked: boolean }>(
      'SELECT $2::int = ANY(pg_blocking_pids($1::int)) AS blocked',
      [blockedPid, blockerPid],
    );
    if (result.rows[0].blocked) return;
    await delay(BLOCK_POLL_DELAY_MS);
  }
  throw new Error(`Connection ${blockedPid} did not block on connection ${blockerPid}`);
}

async function createEvent(client: Client, userId: string, label: string): Promise<string> {
  const eventId = randomUUID();
  await client.query(
    `INSERT INTO public.events (
       id, host_id, name, location, start_date, end_date, max_guests
     ) VALUES ($1, $2, $3, 'Migration test venue', $4, $5, $6)`,
    [eventId, userId, label, new Date('2030-01-01T18:00:00Z'), new Date('2030-01-01T22:00:00Z'), GUEST_LIMIT],
  );
  return eventId;
}

async function insertGuest(
  client: Client,
  eventId: string,
  name: string,
  email: string,
): Promise<void> {
  await client.query(INSERT_GUEST_SQL, [randomUUID(), eventId, name, email]);
}

async function seedGuests(client: Client, eventId: string, count: number, prefix: string): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await insertGuest(client, eventId, `${prefix} ${index}`, `${prefix}-${index}@${TEST_DOMAIN}`);
  }
}

async function expectFailure(query: Promise<unknown>): Promise<unknown> {
  try {
    await query;
  } catch (error) {
    return error;
  }
  throw new Error('Database operation unexpectedly succeeded');
}

async function verifyGuestLimitTrigger(client: Client, userId: string): Promise<void> {
  const eventId = await createEvent(client, userId, 'Guest limit trigger');
  await seedGuests(client, eventId, GUEST_LIMIT, 'limit');
  const error = await expectFailure(
    insertGuest(client, eventId, 'Guest 51', `limit-51@${TEST_DOMAIN}`),
  );
  assertInvariant(errorField(error, 'code') === 'P0001', 'Guest limit used the wrong SQLSTATE');
  assertInvariant(
    errorField(error, 'message') === 'GUEST_LIMIT_REACHED',
    'Guest limit trigger did not return GUEST_LIMIT_REACHED',
  );
}

async function verifyFinalSlotRace(
  observer: Client,
  first: Client,
  second: Client,
  userId: string,
): Promise<void> {
  const eventId = await createEvent(observer, userId, 'Final slot race');
  await seedGuests(observer, eventId, GUEST_LIMIT - 1, 'slot');
  const [firstPid, secondPid] = await Promise.all([backendPid(first), backendPid(second)]);
  await Promise.all([first.query('BEGIN'), second.query('BEGIN')]);
  let firstOpen = true;
  let secondOpen = true;
  let secondOutcome: Promise<{ error?: unknown }> | undefined;
  try {
    await insertGuest(first, eventId, 'Final slot winner', `slot-winner@${TEST_DOMAIN}`);
    secondOutcome = insertGuest(second, eventId, 'Final slot loser', `slot-loser@${TEST_DOMAIN}`).then(
      () => ({}),
      (error: unknown) => ({ error }),
    );
    await waitUntilBlocked(observer, secondPid, firstPid);
    await first.query('COMMIT');
    firstOpen = false;
    const outcome = await secondOutcome;
    assertInvariant(outcome.error, 'Both concurrent final-slot inserts succeeded');
    assertInvariant(errorField(outcome.error, 'message') === 'GUEST_LIMIT_REACHED', 'Final-slot loser had the wrong error');
  } finally {
    if (firstOpen) await first.query('ROLLBACK');
    if (secondOutcome) await secondOutcome;
    if (secondOpen) {
      await second.query('ROLLBACK');
      secondOpen = false;
    }
  }
  const count = await observer.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM public.guests WHERE event_id = $1',
    [eventId],
  );
  assertInvariant(Number(count.rows[0].count) === GUEST_LIMIT, 'Final-slot race did not finish at 50 guests');
}

async function verifyNormalizedDuplicateRace(
  observer: Client,
  first: Client,
  second: Client,
  userId: string,
): Promise<void> {
  const eventId = await createEvent(observer, userId, 'Normalized duplicate race');
  const [firstPid, secondPid] = await Promise.all([backendPid(first), backendPid(second)]);
  await Promise.all([first.query('BEGIN'), second.query('BEGIN')]);
  let firstOpen = true;
  let secondOutcome: Promise<{ error?: unknown }> | undefined;
  try {
    await insertGuest(first, eventId, 'Duplicate winner', ` Duplicate@${TEST_DOMAIN} `);
    secondOutcome = insertGuest(second, eventId, 'Duplicate loser', `duplicate@${TEST_DOMAIN}`).then(
      () => ({}),
      (error: unknown) => ({ error }),
    );
    await waitUntilBlocked(observer, secondPid, firstPid);
    await first.query('COMMIT');
    firstOpen = false;
    const outcome = await secondOutcome;
    assertInvariant(outcome.error, 'Normalized duplicate race created two guests');
    assertInvariant(errorField(outcome.error, 'code') === '23505', 'Duplicate race did not use unique enforcement');
    assertInvariant(
      errorField(outcome.error, 'constraint') === 'guests_event_id_normalized_email_key',
      'Duplicate race violated an unexpected constraint',
    );
  } finally {
    if (firstOpen) await first.query('ROLLBACK');
    if (secondOutcome) await secondOutcome;
    await second.query('ROLLBACK');
  }
  const rows = await observer.query<{ normalized_email: string }>(
    'SELECT normalized_email FROM public.guests WHERE event_id = $1',
    [eventId],
  );
  assertInvariant(rows.rowCount === 1, 'Normalized duplicate race did not leave exactly one guest');
  assertInvariant(rows.rows[0].normalized_email === `duplicate@${TEST_DOMAIN}`, 'Stored email was not normalized');
}

async function verifyRevisionCompareAndSwap(
  observer: Client,
  first: Client,
  second: Client,
  userId: string,
): Promise<void> {
  const eventId = await createEvent(observer, userId, 'Revision compare and swap');
  const [firstPid, secondPid] = await Promise.all([backendPid(first), backendPid(second)]);
  await Promise.all([first.query('BEGIN'), second.query('BEGIN')]);
  let firstOpen = true;
  let secondUpdate: Promise<{ rowCount: number | null }> | undefined;
  try {
    const winner = await first.query(
      `UPDATE public.events
       SET location = 'Winner venue', revision = revision + 1
       WHERE id = $1 AND revision = 1`,
      [eventId],
    );
    assertInvariant(winner.rowCount === 1, 'First revision compare-and-swap did not update');
    secondUpdate = second.query(
      `UPDATE public.events
       SET location = 'Stale venue', revision = revision + 1
       WHERE id = $1 AND revision = 1`,
      [eventId],
    );
    await waitUntilBlocked(observer, secondPid, firstPid);
    await first.query('COMMIT');
    firstOpen = false;
    const stale = await secondUpdate;
    assertInvariant(stale.rowCount === 0, 'Stale revision compare-and-swap overwrote the winner');
    await second.query('COMMIT');
  } finally {
    if (firstOpen) await first.query('ROLLBACK');
    if (secondUpdate) await secondUpdate;
    await second.query('ROLLBACK');
  }
  const event = await observer.query<{ location: string; revision: number }>(
    'SELECT location, revision FROM public.events WHERE id = $1',
    [eventId],
  );
  assertInvariant(event.rows[0].revision === 2, 'Revision compare-and-swap did not increment exactly once');
  assertInvariant(event.rows[0].location === 'Winner venue', 'Stale revision changed event data');
}

async function cleanup(client: Client, userId: string): Promise<void> {
  const events = await client.query<{ id: string }>('SELECT id FROM public.events WHERE host_id = $1', [userId]);
  const eventIds = events.rows.map((event) => event.id);
  if (eventIds.length > 0) {
    await client.query('DELETE FROM public.guests WHERE event_id = ANY($1::text[])', [eventIds]);
    await client.query('DELETE FROM public.events WHERE id = ANY($1::text[])', [eventIds]);
  }
  await client.query('DELETE FROM public.account_deletion_requests WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM public.users WHERE id = $1', [userId]);
}

async function configure(client: Client): Promise<void> {
  await client.connect();
  await client.query("SET statement_timeout = '10s'");
  await client.query("SET lock_timeout = '5s'");
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to verify MVP concurrency');
  const clients = [new Client({ connectionString }), new Client({ connectionString }), new Client({ connectionString })];
  const [observer, first, second] = clients;
  const userId = randomUUID();
  await Promise.all(clients.map(configure));
  try {
    await observer.query(
      'INSERT INTO public.users (id, email, name) VALUES ($1, $2, $3)',
      [userId, `host-${userId}@${TEST_DOMAIN}`, 'MVP Concurrency Host'],
    );
    await verifyGuestLimitTrigger(observer, userId);
    await verifyFinalSlotRace(observer, first, second, userId);
    await verifyNormalizedDuplicateRace(observer, first, second, userId);
    await verifyRevisionCompareAndSwap(observer, first, second, userId);
    console.log('MVP database concurrency invariants verified');
  } finally {
    await Promise.allSettled([first.query('ROLLBACK'), second.query('ROLLBACK')]);
    await cleanup(observer, userId);
    await Promise.all(clients.map((client) => client.end()));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
