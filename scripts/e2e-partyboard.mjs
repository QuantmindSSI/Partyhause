// scripts/e2e-partyboard.mjs
//
// Live end-to-end exercise of /api/partyboard against a real Postgres.
//
// WHY THIS IS A SCRIPT AND NOT A VITEST FILE
//   It boots the real Express app and writes to a real database. The vitest
//   suite runs under jsdom with no Postgres, so route-level authorization and
//   persistence cannot be asserted there. src/test/partyboard-contract.test.ts
//   covers the pure validation and serialisation rules; this covers everything
//   that only a database can prove: that a sticky survives a reload, that a
//   declined guest is refused, that deleting a converted idea takes its task
//   and votes with it.
//
// IT DESTROYS DATA. It truncates users, events, guests and all three
// partyboard tables before running. Point it at a scratch database only.
//
//   createdb partyhause_dev
//   DATABASE_URL="postgresql://$USER@localhost:5432/partyhause_dev?schema=public" \
//     npx prisma db push
//   npx tsx scripts/e2e-partyboard.mjs
//
// Exit code is 0 when every check passes, 1 otherwise.

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.USER}@localhost:5432/partyhause_dev?schema=public`;
process.env.JWT_SECRET = 'e2e-partyboard-secret-that-is-definitely-long-enough-32';
process.env.INVITATION_TOKEN_SECRET =
  process.env.INVITATION_TOKEN_SECRET
  || 'e2e-partyboard-invitation-secret-distinct-from-jwt';
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';

const { PrismaClient } = await import('@prisma/client');
const { PrismaPg } = await import('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const jwt = (await import('jsonwebtoken')).default;

// Seed: host, accepted guest, outsider, and an event.
await prisma.partyBoardStickyVote.deleteMany({});
await prisma.partyBoardTask.deleteMany({});
await prisma.partyBoardSticky.deleteMany({});
await prisma.guest.deleteMany({});
await prisma.event.deleteMany({});
await prisma.user.deleteMany({});

const mk = (email, name) => prisma.user.create({ data: { email, name, email_verified: true } });
const host = await mk('host@e2e.local', 'Host Hazel');
const guest = await mk('guest@e2e.local', 'Guest Gus');
const outsider = await mk('outsider@e2e.local', 'Outsider Otto');

const event = await prisma.event.create({
  data: { name: 'E2E Party', host_id: host.id, start_date: new Date(), end_date: new Date(Date.now() + 3600e3), location: 'Somewhere', privacy: 'private' },
});
await prisma.guest.create({
  data: { event_id: event.id, name: 'Guest Gus', email: guest.email, user_id: guest.id, rsvp_status: 'accepted' },
});
const declined = await mk('declined@e2e.local', 'Declined Dana');
await prisma.guest.create({
  data: { event_id: event.id, name: 'Declined Dana', email: declined.email, user_id: declined.id, rsvp_status: 'declined' },
});

// token_version binds the token to the user's current session epoch. Without
// it requireAuth answers 401 SESSION_REVOKED to every request, and because
// this suite collects results rather than printing as it goes, that surfaced
// as a TypeError on an undefined body several stages later rather than as a
// failed check.
const tok = (u) => jwt.sign(
  {
    sub: u.id,
    email: u.email,
    name: u.name,
    email_verified: true,
    token_version: u.token_version,
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
);
const T = { host: tok(host), guest: tok(guest), outsider: tok(outsider), declined: tok(declined) };

// Boot the real server.
await import(new URL('../server/index.ts', import.meta.url).href);
await new Promise((r) => setTimeout(r, 1500));

const BASE = 'http://127.0.0.1:3999';
let pass = 0, fail = 0;
const results = [];

async function call(method, path, who, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${T[who]}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json };
}

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${actual}, want ${expected})`);
}

// --- no auth ---
const anon = await fetch(`${BASE}/api/partyboard/stickies?event_id=${event.id}`);
check('anonymous list is rejected', anon.status, 401);

// --- access control ---
check('outsider cannot list', (await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'outsider')).status, 403);
check('declined guest cannot list', (await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'declined')).status, 403);
check('host can list', (await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'host')).status, 200);
check('accepted guest can list', (await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'guest')).status, 200);
check('missing event_id is 400', (await call('GET', '/api/partyboard/stickies', 'host')).status, 400);

// --- create ---
const note = await call('POST', '/api/partyboard/stickies', 'host', {
  event_id: event.id, type: 'note', position: { x: 40, y: 60 }, size: { width: 200, height: 200 },
  category: 'venue', data: { content: 'Book the hall', color: 'blue', font_size: 14 },
});
check('create note is 201', note.status, 201);
check('note persists content', note.body?.sticky?.data?.content, 'Book the hall');
check('note keeps position x', note.body?.sticky?.position?.x, 40);

const idea = await call('POST', '/api/partyboard/stickies', 'guest', {
  event_id: event.id, type: 'idea', position: { x: 300, y: 120 },
  category: 'food', data: { content: 'Taco truck', category: 'food', estimated_cost: 450.5 },
});
check('create idea is 201', idea.status, 201);
check('idea starts at zero votes', idea.body?.sticky?.data?.votes, 0);
check('idea starts unvoted by creator', idea.body?.sticky?.data?.user_has_voted, false);
check('idea starts unconverted', idea.body?.sticky?.data?.converted_to_task, false);
const ideaId = idea.body?.sticky?.id;

// --- validation ---
check('rejects unknown type', (await call('POST', '/api/partyboard/stickies', 'host', { event_id: event.id, type: 'video', data: { content: 'x' } })).status, 400);
check('rejects empty content', (await call('POST', '/api/partyboard/stickies', 'host', { event_id: event.id, type: 'note', data: { content: '   ' } })).status, 400);
check('rejects bad category', (await call('POST', '/api/partyboard/stickies', 'host', { event_id: event.id, type: 'note', category: 'nonsense', data: { content: 'x' } })).status, 400);
check('rejects out-of-bounds position', (await call('POST', '/api/partyboard/stickies', 'host', { event_id: event.id, type: 'note', position: { x: 1e9, y: 0 }, data: { content: 'x' } })).status, 400);
check('rejects NaN position', (await call('POST', '/api/partyboard/stickies', 'host', { event_id: event.id, type: 'note', position: { x: 'left', y: 0 }, data: { content: 'x' } })).status, 400);
check('outsider cannot create', (await call('POST', '/api/partyboard/stickies', 'outsider', { event_id: event.id, type: 'note', data: { content: 'x' } })).status, 403);

// client-supplied vote counts must not be trusted
const forged = await call('POST', '/api/partyboard/stickies', 'host', {
  event_id: event.id, type: 'idea', data: { content: 'Forged', votes: 9999, user_has_voted: true },
});
check('client-supplied vote count is ignored', forged.body?.sticky?.data?.votes, 0);

// --- voting ---
const v1 = await call('PATCH', `/api/partyboard/stickies/${ideaId}/vote`, 'host');
check('first vote is 200', v1.status, 200);
check('first vote counts one', v1.body?.votes, 1);
check('first vote sets user_has_voted', v1.body?.user_has_voted, true);

const v2 = await call('PATCH', `/api/partyboard/stickies/${ideaId}/vote`, 'host');
check('same user voting again toggles off', v2.body?.votes, 0);
check('toggle clears user_has_voted', v2.body?.user_has_voted, false);

await call('PATCH', `/api/partyboard/stickies/${ideaId}/vote`, 'host');
const v3 = await call('PATCH', `/api/partyboard/stickies/${ideaId}/vote`, 'guest');
check('two distinct voters count two', v3.body?.votes, 2);

const seenByGuest = await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'guest');
const ideaForGuest = seenByGuest.body.stickies.find((s) => s.id === ideaId);
check('guest sees own vote', ideaForGuest.data.user_has_voted, true);
const seenByOther = await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'host');
check('host sees own vote', seenByOther.body.stickies.find((s) => s.id === ideaId).data.user_has_voted, true);
check('vote total agrees across viewers', ideaForGuest.data.votes, 2);

check('cannot vote on a note', (await call('PATCH', `/api/partyboard/stickies/${note.body.sticky.id}/vote`, 'host')).status, 400);
check('outsider voting gets 404 not 403', (await call('PATCH', `/api/partyboard/stickies/${ideaId}/vote`, 'outsider')).status, 404);
check('unknown sticky is 404', (await call('PATCH', `/api/partyboard/stickies/00000000-0000-0000-0000-000000000000/vote`, 'host')).status, 404);

// --- position ---
const mv = await call('PATCH', `/api/partyboard/stickies/${ideaId}/position`, 'host', { position: { x: 777, y: 888 } });
check('move is 200', mv.status, 200);
check('move persists x', mv.body?.sticky?.position?.x, 777);
const after = await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'host');
check('move survives a reload', after.body.stickies.find((s) => s.id === ideaId).position.y, 888);
check('move rejects malformed body', (await call('PATCH', `/api/partyboard/stickies/${ideaId}/position`, 'host', { position: { x: null, y: 3 } })).status, 400);

// --- convert to task ---
const c1 = await call('POST', `/api/partyboard/stickies/${ideaId}/convert-to-task`, 'host');
check('convert is 201', c1.status, 201);
check('convert returns a task id', typeof c1.body?.task_id, 'string');
const c2 = await call('POST', `/api/partyboard/stickies/${ideaId}/convert-to-task`, 'host');
check('convert twice is idempotent status', c2.status, 200);
check('convert twice returns the same task', c2.body?.task_id, c1.body?.task_id);

const afterConvert = await call('GET', `/api/partyboard/stickies?event_id=${event.id}`, 'host');
const convertedIdea = afterConvert.body.stickies.find((s) => s.id === ideaId);
check('converted flag is reflected on read', convertedIdea.data.converted_to_task, true);
check('task id is reflected on read', convertedIdea.data.task_id, c1.body.task_id);
check('task status is reflected on read', convertedIdea.data.task_status, 'open');

const tasks = await call('GET', `/api/partyboard/tasks?event_id=${event.id}`, 'host');
check('tasks list is 200', tasks.status, 200);
check('tasks list has one row', tasks.body?.tasks?.length, 1);
check('task carries the idea text', tasks.body?.tasks?.[0]?.title, 'Taco truck');
check('task carries the estimated cost', tasks.body?.tasks?.[0]?.estimated_cost, 450.5);
check('outsider cannot read tasks', (await call('GET', `/api/partyboard/tasks?event_id=${event.id}`, 'outsider')).status, 403);

check('cannot convert a note', (await call('POST', `/api/partyboard/stickies/${note.body.sticky.id}/convert-to-task`, 'host')).status, 400);

// --- delete ---
const guestIdea = await call('POST', '/api/partyboard/stickies', 'guest', {
  event_id: event.id, type: 'idea', data: { content: 'Guest idea' },
});
check("host cannot be blocked from moderating", (await call('DELETE', `/api/partyboard/stickies/${guestIdea.body.sticky.id}`, 'host')).status, 200);

const hostNote2 = await call('POST', '/api/partyboard/stickies', 'host', {
  event_id: event.id, type: 'note', data: { content: 'Host only' },
});
check('a guest cannot delete the host note', (await call('DELETE', `/api/partyboard/stickies/${hostNote2.body.sticky.id}`, 'guest')).status, 403);
check('the author can delete their own', (await call('DELETE', `/api/partyboard/stickies/${hostNote2.body.sticky.id}`, 'host')).status, 200);

// deleting a converted idea must take its task and votes with it
const del = await call('DELETE', `/api/partyboard/stickies/${ideaId}`, 'host');
check('delete converted idea is 200', del.status, 200);
check('its task row is gone', await prisma.partyBoardTask.count({ where: { sticky_id: ideaId } }), 0);
check('its vote rows are gone', await prisma.partyBoardStickyVote.count({ where: { sticky_id: ideaId } }), 0);
check('deleting twice is 404', (await call('DELETE', `/api/partyboard/stickies/${ideaId}`, 'host')).status, 404);

console.log('\n' + results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
await prisma.$disconnect();
process.exit(fail === 0 ? 0 : 1);
