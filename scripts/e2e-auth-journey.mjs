// scripts/e2e-auth-journey.mjs
//
// The whole authentication journey, driven against the real Express app and a
// real Postgres, in the order a new user actually experiences it:
//
//   signup -> what is written to the database -> email verification ->
//   access granted -> profile render -> profile update -> sign out
//
// WHY THIS IS A SCRIPT AND NOT A VITEST FILE
//   The vitest suite runs under jsdom with no Postgres. It can prove that
//   `requireAuth` refuses an unverified claim (src/test/email-verification-
//   gate.test.ts) and that the recovery rules are self-consistent
//   (src/test/account-recovery.test.ts), but it cannot prove that a row was
//   written, that a bcrypt-hashed verification token in a column matches the
//   raw token that went out in the email, or that the id the profile page
//   fetches is the id signup created. Those are the claims here.
//
//   scripts/e2e-account-recovery.mjs covers the adjacent journey: the user who
//   never confirms and forgets their password. This one covers the happy path
//   and the gates around it.
//
// IT DELETES the two accounts named in ACCOUNTS below, and nothing else.
// Point it at a scratch database.
//
//   createdb partyhause_dev
//   DATABASE_URL="postgresql://$USER@localhost:5432/partyhause_dev?schema=public" \
//     npx prisma db push
//   npx tsx scripts/e2e-auth-journey.mjs
//
// NODE_ENV is 'test', not 'production', so the server prints the verification
// link to its log. That is how a token is obtained with no mail provider
// configured. The printing is suppressed in production deliberately: raw
// tokens in production logs would hand the flow to anyone with log access.
//
// Exit code is 0 when every check passes, 1 otherwise.

// An externally supplied DATABASE_URL wins. This used to assign
// partyhause_dev unconditionally, which silently discarded the connection
// string the caller exported: the run reported failures from whichever
// database happened to be called partyhause_dev, while the operator watched
// the one they had just migrated. Defaulting is fine; overriding is not.
process.env.DATABASE_URL =
  process.env.DATABASE_URL
  || `postgresql://${process.env.USER}@localhost:5432/partyhause_dev?schema=public`;
process.env.JWT_SECRET = 'e2e-auth-journey-secret-long-enough-for-prod-check';
// Independent of JWT_SECRET, which server/lib/invitation-token.ts enforces.
process.env.INVITATION_TOKEN_SECRET =
  process.env.INVITATION_TOKEN_SECRET
  || 'e2e-auth-journey-invitation-secret-distinct-from-jwt';
process.env.NODE_ENV = 'test';
process.env.PORT = '3996';
// The bypass must be off. It is enabled by dev-api.ts and would let an
// unauthenticated request through as the synthetic dev user, which would make
// every authorization check below pass for the wrong reason.
delete process.env.AUTH_BYPASS;

const { PrismaClient } = await import('@prisma/client');
const { PrismaPg } = await import('@prisma/adapter-pg');
const jwt = (await import('jsonwebtoken')).default;
const bcrypt = (await import('bcryptjs')).default;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD = 'correct-horse-99';

/**
 * Consent the signup route requires, read from the same module the route reads.
 *
 * Hardcoding the dates here would make this suite pass a version bump it should
 * fail: the point of the check is that client and server agree on which
 * document was accepted, and a literal copied into the test agrees with
 * nothing.
 */
const { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('../src/lib/legal.ts');
const CONSENT = {
  ageEligible: true,
  termsVersion: CURRENT_TERMS_VERSION,
  privacyVersion: CURRENT_PRIVACY_VERSION,
};
// `username` is deliberately absent here and resolved from the database after
// signup. It used to be the email local part, which made a public field a
// disclosure of a private one: `journey_newuser` tells any viewer that the
// address is journey.newuser@something. It is now derived from the user's
// UUID, so it carries no information the account did not choose to publish.
const ACCOUNTS = [
  { email: 'journey.newuser@partyhause.local', name: 'Journey User' },
  { email: 'journey.viewer@partyhause.local', name: 'Journey Viewer' },
];

// ---------------------------------------------------------------------------
// Cleanup. Both rows, not just the user.
//
// Signup writes a `users` row and a `user_profiles` row whose `username` is
// unique and derived from the email's local part. Deleting only the user
// leaves the profile orphaned, and the next signup then 500s on that unique
// constraint, which reads like a broken signup route and is not one.
// ---------------------------------------------------------------------------
for (const account of ACCOUNTS) {
  const stale = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  });
  await prisma.userProfile.deleteMany({
    where: { OR: [{ username: account.username }, ...(stale ? [{ id: stale.id }] : [])] },
  });
  await prisma.user.deleteMany({ where: { email: account.email } });
}

// ---------------------------------------------------------------------------
// Capture the verification links the server prints in non-production.
// Keyed by the email in the query string, because two accounts register.
// ---------------------------------------------------------------------------
const verificationLinks = new Map();
const realLog = console.log;
console.log = (...args) => {
  const line = args.join(' ');
  if (line.includes('/auth/verify-email?token=')) {
    const url = new URL(line.trim().split(/\s+/).find((part) => part.includes('/auth/verify-email')));
    verificationLinks.set(url.searchParams.get('email'), url);
  }
  realLog(...args);
};

await import(new URL('../server/index.ts', import.meta.url).href);
await new Promise((resolve) => setTimeout(resolve, 1500));

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
const ORIGIN = 'http://127.0.0.1:3996';

async function request(method, path, { body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${ORIGIN}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const post = (path, body, token) => request('POST', path, { body, token });
const get = (path, token) => request('GET', path, { token });
const put = (path, body, token) => request('PUT', path, { body, token });

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
let pass = 0;
let fail = 0;
const failures = [];

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    pass += 1;
    realLog(`PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    realLog(`FAIL  ${name}\n        got  ${JSON.stringify(actual)}\n        want ${JSON.stringify(expected)}`);
  }
}

function checkTrue(name, actual) {
  check(name, actual === true, true);
}

function section(title) {
  realLog(`\n\u2500\u2500 ${title} ${'\u2500'.repeat(Math.max(0, 62 - title.length))}`);
}

// ===========================================================================
// STAGE 1. A new user registers
// ===========================================================================
section('STAGE 1  new user registers');

const [primary, viewer] = ACCOUNTS;

const tooShort = await post('/api/auth/signup', { email: primary.email, password: 'short' });
check('a password under 8 characters is refused', tooShort.status, 400);

const noEmail = await post('/api/auth/signup', { password: PASSWORD });
check('a missing email is refused', noEmail.status, 400);

// Signup records the legal versions the account accepted, so every request
// here has to carry them. The server compares them for exact equality against
// its own constants rather than accepting any string: an account created
// against last month's terms must not be recorded as having accepted this
// month's.
const noConsent = await post('/api/auth/signup', {
  email: primary.email,
  password: PASSWORD,
  name: primary.name,
});
check('signup without consent is refused', noConsent.status, 400);
check('  ...with a code the client can branch on', noConsent.body?.code, 'LEGAL_CONSENT_REQUIRED');

const staleConsent = await post('/api/auth/signup', {
  email: primary.email,
  password: PASSWORD,
  name: primary.name,
  ...CONSENT,
  termsVersion: '1970-01-01',
});
check('signup against a superseded terms version is refused', staleConsent.status, 400);

const signup = await post('/api/auth/signup', {
  email: primary.email,
  password: PASSWORD,
  name: primary.name,
  ...CONSENT,
});
check('signup succeeds', signup.status, 201);
check('signup reports the account is unverified', signup.body?.user?.email_verified, false);
check('signup issues NO session token', signup.body?.token, undefined);
checkTrue('signup tells the user to check their email',
  typeof signup.body?.message === 'string' && /email/i.test(signup.body.message));

const duplicate = await post('/api/auth/signup', {
  email: primary.email,
  password: PASSWORD,
  ...CONSENT,
});
check('registering the same address twice is refused', duplicate.status, 409);

// ===========================================================================
// STAGE 2. What was actually written to the database
// ===========================================================================
section('STAGE 2  data storage');

const stored = await prisma.user.findUnique({ where: { email: primary.email } });
checkTrue('a users row exists', stored !== null);
check('  email matches', stored.email, primary.email);
check('  name matches', stored.name, primary.name);
check('  email_verified defaults to false', stored.email_verified, false);
checkTrue('  the id is a non-empty string', typeof stored.id === 'string' && stored.id.length > 0);

checkTrue('  the password is hashed, not stored in clear',
  typeof stored.password_hash === 'string' && stored.password_hash !== PASSWORD);
checkTrue('  the hash is bcrypt at cost 12', /^\$2[aby]\$12\$/.test(stored.password_hash));
checkTrue('  the hash verifies against the real password',
  await bcrypt.compare(PASSWORD, stored.password_hash));
checkTrue('  the hash rejects a wrong password',
  (await bcrypt.compare('not-the-password', stored.password_hash)) === false);

checkTrue('  a verification token was issued', typeof stored.verification_token === 'string');
checkTrue('  the verification token is stored HASHED, not raw',
  /^\$2[aby]\$/.test(stored.verification_token));
checkTrue('  the verification token expires', stored.verification_token_expires instanceof Date);
const ttlHours = (stored.verification_token_expires - Date.now()) / 3_600_000;
checkTrue(`  the expiry is ~24h (measured ${ttlHours.toFixed(1)}h)`, ttlHours > 23 && ttlHours <= 24);

check('  no reset token is issued at signup', stored.reset_token, null);

const profile = await prisma.userProfile.findUnique({ where: { id: stored.id } });
checkTrue('a user_profiles row exists with the same id', profile !== null);

// Derived from the UUID, not the address. The two assertions that matter are
// that it is opaque and that it does not contain the local part: a username is
// shown to other people and an email address is not.
checkTrue('  username is derived from the user id, not the email',
  /^u_[0-9a-z]+$/.test(profile.username));
checkTrue('  username does not leak the email local part',
  !profile.username.includes('journey') && !profile.username.includes('newuser'));

// Every later assertion compares against what signup actually wrote, so a
// change in the derivation is caught once, here, rather than four times.
primary.username = profile.username;
check('  display_name is set', profile.display_name, primary.name);
check('  haus_score starts at zero', profile.haus_score, 0);
check('  the account is not private by default', profile.is_private, false);
check('  account_type defaults to personal', profile.account_type, 'personal');

// ===========================================================================
// STAGE 3. The verification gate holds before the link is clicked
// ===========================================================================
section('STAGE 3  the gate before verification');

const wrongPassword = await post('/api/auth/login', {
  email: primary.email,
  password: 'wrong-password-entirely',
});
check('a wrong password is 401', wrongPassword.status, 401);
check('  and carries no machine-readable code', wrongPassword.body?.code, undefined);

const unknownAccount = await post('/api/auth/login', {
  email: 'nobody@partyhause.local',
  password: PASSWORD,
});
check('an unknown address is also 401', unknownAccount.status, 401);
check('  byte-identical to a wrong password (no enumeration)',
  JSON.stringify(unknownAccount.body), JSON.stringify(wrongPassword.body));

const unverifiedLogin = await post('/api/auth/login', { email: primary.email, password: PASSWORD });
check('the CORRECT password on an unverified account is 403, not 401', unverifiedLogin.status, 403);
check('  with a code the client can branch on', unverifiedLogin.body?.code, 'EMAIL_NOT_VERIFIED');
check('  and still no token', unverifiedLogin.body?.token, undefined);

// A token minted with the claim set to false must be refused by requireAuth,
// which is the gate that catches tokens issued before the gate existed.
//
// token_version is included so this exercises the verification gate and not
// the revocation one. Omitting it makes the request fail earlier, for a
// different and correct reason, and the assertion below would then pass
// without the gate it names ever running.
const unverifiedToken = jwt.sign(
  {
    sub: stored.id,
    email: primary.email,
    name: primary.name,
    email_verified: false,
    token_version: stored.token_version,
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
);
const meUnverified = await get('/api/auth/me', unverifiedToken);
check('requireAuth refuses a token whose claim says unverified', meUnverified.status, 403);
check('  with the same code', meUnverified.body?.code, 'EMAIL_NOT_VERIFIED');

// A token from a superseded epoch is refused whatever else it claims. This is
// what makes logout and password reset actually end a session.
const staleEpochToken = jwt.sign(
  {
    sub: stored.id,
    email: primary.email,
    name: primary.name,
    email_verified: true,
    token_version: stored.token_version - 1,
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
);
const meStale = await get('/api/auth/me', staleEpochToken);
check('requireAuth refuses a token from a superseded epoch', meStale.status, 401);
check('  with SESSION_REVOKED', meStale.body?.code, 'SESSION_REVOKED');

// A token predating the epoch claim entirely carries no epoch to compare, so
// it cannot be trusted and is refused as revoked rather than merely unverified.
const legacyToken = jwt.sign(
  { sub: stored.id, email: primary.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
);
const meLegacy = await get('/api/auth/me', legacyToken);
check('requireAuth refuses a legacy token with no claim at all', meLegacy.status, 401);

// ===========================================================================
// STAGE 4. Email verification
// ===========================================================================
section('STAGE 4  email verification');

await new Promise((resolve) => setTimeout(resolve, 300));
const link = verificationLinks.get(primary.email);
checkTrue('a verification link was generated', link !== undefined);

const rawToken = link.searchParams.get('token');
checkTrue('the link carries a token', typeof rawToken === 'string' && rawToken.length === 64);
check('the link carries the address', link.searchParams.get('email'), primary.email);
check('the link points at the SPA route that handles it', link.pathname, '/auth/verify-email');
checkTrue('the raw token in the link matches the hash in the column',
  await bcrypt.compare(rawToken, stored.verification_token));

const wrongToken = await post('/api/auth/verify-email', {
  email: primary.email,
  token: 'f'.repeat(64),
});
check('a forged token is refused', wrongToken.status, 400);

const wrongEmail = await post('/api/auth/verify-email', {
  email: 'nobody@partyhause.local',
  token: rawToken,
});
check('a token presented with the wrong address is refused', wrongEmail.status, 400);
check('  identically, so the response reveals nothing',
  JSON.stringify(wrongEmail.body), JSON.stringify(wrongToken.body));

const verify = await post('/api/auth/verify-email', { email: primary.email, token: rawToken });
check('verification succeeds', verify.status, 200);
check('  and says so', verify.body?.success, true);
check('  but issues no session (the user must still sign in)', verify.body?.token, undefined);

const afterVerify = await prisma.user.findUnique({ where: { email: primary.email } });
check('the email_verified COLUMN is now true', afterVerify.email_verified, true);
check('  the verification token is consumed', afterVerify.verification_token, null);
check('  and its expiry is cleared', afterVerify.verification_token_expires, null);

const replay = await post('/api/auth/verify-email', { email: primary.email, token: rawToken });
check('the verification link is single use', replay.status, 400);

// ===========================================================================
// STAGE 5. Access granted
// ===========================================================================
section('STAGE 5  access granted');

const login = await post('/api/auth/login', { email: primary.email, password: PASSWORD });
check('login now succeeds', login.status, 200);
checkTrue('  and issues a token', typeof login.body?.token === 'string');
check('  the returned user id matches the stored row', login.body?.user?.id, stored.id);
check('  and reports the address as verified', login.body?.user?.email_verified, true);

const token = login.body.token;
const claims = jwt.verify(token, process.env.JWT_SECRET);
check('the token subject is the user id', claims.sub, stored.id);
check('the token carries the email', claims.email, primary.email);
check('the token asserts email_verified', claims.email_verified, true);
checkTrue('the token carries no password material',
  !JSON.stringify(claims).toLowerCase().includes('password'));
checkTrue('the token expires', typeof claims.exp === 'number' && claims.exp > claims.iat);

// Negative paths on the same protected route.
check('no Authorization header -> 401', (await get('/api/auth/me')).status, 401);
check('a malformed token -> 401', (await get('/api/auth/me', 'not-a-jwt')).status, 401);
check('a token signed with another key -> 401',
  (await get('/api/auth/me', jwt.sign({ sub: stored.id, email_verified: true }, 'a-different-secret-entirely'))).status,
  401);
check('an expired token -> 401',
  (await get('/api/auth/me',
    jwt.sign({ sub: stored.id, email: primary.email, email_verified: true },
      process.env.JWT_SECRET, { expiresIn: '-1s' }))).status,
  401);

// ===========================================================================
// STAGE 6. Profile render
// ===========================================================================
section('STAGE 6  profile render');

// 6a. GET /api/auth/me. Called once on app boot by
//     src/lib/auth.ts:initializeAuthStateListener.
const me = await get('/api/auth/me', token);
check('GET /api/auth/me succeeds with the session token', me.status, 200);
check('  returns the right id', me.body?.id, stored.id);
check('  returns the email', me.body?.email, primary.email);
check('  reports verification state', me.body?.email_verified, true);
checkTrue('  embeds the profile the UI needs', me.body?.profile !== null && me.body?.profile !== undefined);
check('  with the derived username', me.body?.profile?.username, primary.username);
checkTrue('  and never leaks the password hash',
  !JSON.stringify(me.body).toLowerCase().includes('password_hash'));
checkTrue('  nor the verification token',
  !JSON.stringify(me.body).includes('verification_token'));

// 6b. GET /api/users/:id. This is what src/pages/ProfilePage.tsx actually
//     renders from, via useUserProfile -> apiGet('/api/users/:id').
const own = await get(`/api/users/${stored.id}`, token);
check('GET /api/users/:id succeeds', own.status, 200);

const FIELDS_PROFILEPAGE_READS = [
  'id', 'username', 'display_name', 'bio', 'avatar_url', 'cover_photo_url',
  'location', 'website_url', 'partycrew_count', 'crewing_count',
  'events_hosted', 'haus_score', 'is_verified', 'is_private', 'account_type',
];
for (const field of FIELDS_PROFILEPAGE_READS) {
  checkTrue(`  the response carries "${field}"`,
    own.body !== null && Object.prototype.hasOwnProperty.call(own.body, field));
}
check('  username matches what signup derived', own.body?.username, primary.username);
check('  display_name matches', own.body?.display_name, primary.name);
check('  the viewer is recognised as the owner', own.body?.id, stored.id);
checkTrue('  the profile response leaks no email address',
  !JSON.stringify(own.body).includes(primary.email));

// 6c. GET /api/users/me/profile. Used by PrivacySettingsPage.
const settings = await get('/api/users/me/profile', token);
check('GET /api/users/me/profile succeeds', settings.status, 200);

// ===========================================================================
// STAGE 7. The profile is writable, and the write is durable
// ===========================================================================
section('STAGE 7  profile update round-trip');

const NEW_BIO = 'Hosts four dinners a year and plans all of them.';
const update = await put('/api/users/me/profile', { bio: NEW_BIO, location: 'Lagos' }, token);
check('updating the profile succeeds', update.status, 200);

const reread = await get(`/api/users/${stored.id}`, token);
check('  the new bio is readable back through the render path', reread.body?.bio, NEW_BIO);
check('  and so is the location', reread.body?.location, 'Lagos');

const persisted = await prisma.userProfile.findUnique({ where: { id: stored.id } });
check('  and it reached the database', persisted.bio, NEW_BIO);

const anonUpdate = await put('/api/users/me/profile', { bio: 'anonymous edit' });
check('an anonymous caller cannot edit the profile', anonUpdate.status, 401);
const stillMine = await prisma.userProfile.findUnique({ where: { id: stored.id } });
check('  and the bio is unchanged', stillMine.bio, NEW_BIO);

// ===========================================================================
// STAGE 8. A second user sees the profile as a viewer, not as the owner
// ===========================================================================
section('STAGE 8  a second account views the profile');

await post('/api/auth/signup', { email: viewer.email, password: PASSWORD, name: viewer.name, ...CONSENT });
await new Promise((resolve) => setTimeout(resolve, 300));
const viewerLink = verificationLinks.get(viewer.email);
checkTrue('the second account also received a link', viewerLink !== undefined);
await post('/api/auth/verify-email', {
  email: viewer.email,
  token: viewerLink.searchParams.get('token'),
});
const viewerLogin = await post('/api/auth/login', { email: viewer.email, password: PASSWORD });
check('the second account can sign in', viewerLogin.status, 200);
const viewerToken = viewerLogin.body.token;

const viewerSees = await get(`/api/users/${stored.id}`, viewerToken);
check('the second account can render the first profile', viewerSees.status, 200);
check('  and sees the same public identity', viewerSees.body?.username, primary.username);
checkTrue('  the response still carries no email address',
  !JSON.stringify(viewerSees.body).includes(primary.email));

const viewerCannotEdit = await put('/api/users/me/profile', { bio: 'edited by someone else' }, viewerToken);
check('editing /me/profile as the viewer targets their OWN row', viewerCannotEdit.status, 200);
const untouched = await prisma.userProfile.findUnique({ where: { id: stored.id } });
check('  the first user\'s bio is untouched', untouched.bio, NEW_BIO);

// ===========================================================================
// STAGE 9. Sign out
// ===========================================================================
section('STAGE 9  sign out');

const logout = await post('/api/auth/logout', {}, token);
check('logout answers 200', logout.status, 200);

// Logout now actually ends the session. It increments the user's token epoch,
// which invalidates every token issued before it, so signing out on a shared
// or stolen device is effective rather than advisory.
//
// This assertion previously read "the token still verifies (stateless JWT,
// revocation is client-side)" and expected 200. That was a true description of
// a real limitation, and it is the check that surfaced the change when the
// epoch was added, which is exactly what it was written for.
const afterLogout = await get('/api/auth/me', token);
check('the token no longer verifies: logout revoked it', afterLogout.status, 401);
check('  with SESSION_REVOKED', afterLogout.body?.code, 'SESSION_REVOKED');

// ===========================================================================
section('RESULT');
realLog(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  realLog('\nFailed checks:');
  for (const name of failures) realLog(`  - ${name}`);
}

await prisma.$disconnect();
process.exit(fail === 0 ? 0 : 1);
