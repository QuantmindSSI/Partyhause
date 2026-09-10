// scripts/e2e-account-recovery.mjs
//
// The journey that was reported as impossible, driven end to end against a
// real Postgres and the real Express app: someone registers, never clicks the
// confirmation link, forgets their password, and needs a way back in.
//
// WHY THIS IS A SCRIPT AND NOT A VITEST FILE
//   It boots the real server and writes to a real database. The vitest suite
//   runs under jsdom with no Postgres, so it cannot prove that a reset link is
//   actually issued, that using it flips email_verified in the column, or that
//   the NEXT login succeeds. src/test/account-recovery.test.ts covers the
//   rules; this covers the journey.
//
// IT DELETES the test account never-confirmed@recovery.local before running,
// and nothing else. Safe against a scratch database.
//
//   createdb partyhause_dev
//   DATABASE_URL="postgresql://$USER@localhost:5432/partyhause_dev?schema=public" \
//     npx prisma db push
//   npx tsx scripts/e2e-account-recovery.mjs
//
// NODE_ENV is set to 'test' rather than 'production' so the server prints the
// reset link to its log, which is how this script obtains a real token without
// a mail provider. That printing is disabled in production on purpose: raw
// tokens in production logs would let anyone with log access take the flow.
//
// Exit code is 0 when every check passes, 1 otherwise.

// An externally supplied DATABASE_URL wins; this used to override it.
process.env.DATABASE_URL =
  process.env.DATABASE_URL
  || `postgresql://${process.env.USER}@localhost:5432/partyhause_dev?schema=public`;
process.env.JWT_SECRET = 'verify-recovery-secret-that-is-long-enough-32c';
process.env.INVITATION_TOKEN_SECRET =
  process.env.INVITATION_TOKEN_SECRET
  || 'e2e-recovery-invitation-secret-distinct-from-jwt';
process.env.NODE_ENV = 'test';   // not production, so the reset link is printed to the log
process.env.PORT = '3995';

const { PrismaClient } = await import('@prisma/client');
const { PrismaPg } = await import('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const EMAIL = 'never-confirmed@recovery.local';
const USERNAME = 'never_confirmed'; // what signup derives from the local part

// Both rows, not just the user. Signup creates a user_profiles row whose
// `username` is unique and derived from the email's local part. Deleting only
// the user leaves that profile orphaned, and the next signup then fails with a
// 500 on the unique constraint, which reads like a broken signup route and is
// not one.
const stale = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
await prisma.userProfile.deleteMany({
  where: { OR: [{ username: USERNAME }, ...(stale ? [{ id: stale.id }] : [])] },
});
await prisma.user.deleteMany({ where: { email: EMAIL } });

// Capture the reset link the server prints in non-production.
let capturedLink = null;
const realLog = console.log;
console.log = (...args) => {
  const line = args.join(' ');
  if (line.includes('/auth/reset-password?token=')) capturedLink = line.trim();
  realLog(...args);
};

await import(new URL('../server/index.ts', import.meta.url).href);
await new Promise((r) => setTimeout(r, 1500));

const BASE = 'http://127.0.0.1:3995/api/auth';
const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  realLog(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
};

// 1. Register. No token is issued, by design.
//
// Consent is read from the same module the route validates against, so a
// version bump cannot leave this suite asserting a document nobody accepted.
const { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('../src/lib/legal.ts');
const signup = await post('/signup', {
  email: EMAIL,
  password: 'originalpw123',
  name: 'Nev Confirmed',
  ageEligible: true,
  termsVersion: CURRENT_TERMS_VERSION,
  privacyVersion: CURRENT_PRIVACY_VERSION,
});
check('signup succeeds', signup.status, 201);
check('signup issues no session token', signup.body?.token, undefined);

const created = await prisma.user.findUnique({ where: { email: EMAIL } });
check('account starts unverified', created.email_verified, false);

// 2. They never click confirm, and later forget the password.
const wrongPw = await post('/login', { email: EMAIL, password: 'iForgotThis' });
check('wrong password on an unverified account -> 401', wrongPw.status, 401);

const rightPw = await post('/login', { email: EMAIL, password: 'originalpw123' });
check('right password on an unverified account -> 403', rightPw.status, 403);
check('  ...with a code the client can branch on', rightPw.body?.code, 'EMAIL_NOT_VERIFIED');

// 3. THE FIX: request a reset. This must work for an unverified account.
const forgot = await post('/forgot-password', { email: EMAIL });
check('forgot-password accepts an unverified account', forgot.status, 200);
check('  ...and answers uniformly', forgot.body?.success, true);

const unknown = await post('/forgot-password', { email: 'nobody@nowhere.local' });
check('unknown address gets the identical answer (no enumeration)',
  JSON.stringify(unknown.body), JSON.stringify(forgot.body));

await new Promise((r) => setTimeout(r, 300));
check('a reset link was actually generated', capturedLink !== null, true);

const token = new URL(capturedLink).searchParams.get('token');

// 4. Use the link.
const reset = await post('/reset-password', { token, email: EMAIL, password: 'brandNewPw456' });
check('reset succeeds', reset.status, 200);
check('reset returns a usable session token', typeof reset.body?.token, 'string');

// The token alone is not a session on the web client: it stores the JWT and
// the cached user under two keys and hydrates only when both are present. A
// token-only response meant a successful reset rendered as signed out.
check('reset also returns the user, so the client can hydrate', typeof reset.body?.user?.id, 'string');
check('  ...with the address', reset.body?.user?.email, EMAIL);
check('  ...marked verified, matching the column it just set', reset.body?.user?.email_verified, true);

// 5. THE POINT: the address is now confirmed, not just the password changed.
const after = await prisma.user.findUnique({ where: { email: EMAIL } });
check('the account is now VERIFIED by the reset', after.email_verified, true);
check('the reset token is consumed', after.reset_token, null);

// 6. And the NEXT login works, which is what a token-only fix would have missed.
const relogin = await post('/login', { email: EMAIL, password: 'brandNewPw456' });
check('next login succeeds', relogin.status, 200);
check('  ...and issues a token', typeof relogin.body?.token, 'string');

const oldPw = await post('/login', { email: EMAIL, password: 'originalpw123' });
check('the old password no longer works', oldPw.status, 401);

// 7. Reusing the link must fail.
const replay = await post('/reset-password', { token, email: EMAIL, password: 'thirdPassword789' });
check('the reset link is single use', replay.status, 400);

// 8. The other route out: resend, which must be reachable without a session.
const resend = await post('/resend-verification', { email: EMAIL });
check('resend-verification is anonymous', resend.status, 200);

realLog(`\n${pass} passed, ${fail} failed`);
await prisma.$disconnect();
process.exit(fail === 0 ? 0 : 1);
