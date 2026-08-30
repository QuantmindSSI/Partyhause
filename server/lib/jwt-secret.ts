/**
 * Resolution of the HS256 signing key used for application-issued JWTs.
 *
 * Single source of truth for `server/middleware/auth.ts` (verification) and
 * `server/routes/auth.ts` (issuance). Those two files previously carried
 * duplicate copies of this logic with a comment requiring them to stay in
 * sync by hand.
 *
 * Why this fails closed in production:
 * the previous implementation was `process.env.JWT_SECRET || '<default>'`,
 * where the default is a literal committed to this repository. An unset or
 * empty variable therefore produced a signing key that anyone reading the
 * source could use to mint a token for any user id, against every route
 * guarded by `requireAuth`. The failure was silent: the API started
 * normally, logged nothing, and served traffic.
 *
 * Read lazily rather than at module load. Imports are hoisted above
 * `dotenv.config()` in `server/index.ts`, so a module-load constant ignores
 * any value supplied through `.env`.
 */

/** The historical fallback. Public in this repository, so it is never valid in production. */
const DEV_FALLBACK_SECRET = 'partyhause-dev-jwt-secret-change-in-production';

/** Below this length an HS256 key is brute-forceable offline from a single captured token. */
const MIN_SECRET_LENGTH = 32;

const GENERATE_HINT = 'Generate one with: openssl rand -base64 48';

let devWarningEmitted = false;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function readConfiguredSecret(): string {
  const raw = process.env.JWT_SECRET;
  return typeof raw === 'string' ? raw.trim() : '';
}

function resolveForDevelopment(value: string): string {
  if (value !== '') {
    return value;
  }
  if (!devWarningEmitted) {
    devWarningEmitted = true;
    console.warn(
      '[auth] JWT_SECRET is not set; falling back to the development key. ' +
        'This key is committed to the repository and is rejected when NODE_ENV=production.',
    );
  }
  return DEV_FALLBACK_SECRET;
}

function resolveForProduction(value: string): string {
  if (value === '') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production: the development ' +
        'fallback is committed to this repository, so using it would make every ' +
        `account forgeable. Provision it via the jwtSecret Bicep parameter. ${GENERATE_HINT}`,
    );
  }
  if (value === DEV_FALLBACK_SECRET) {
    throw new Error(
      'JWT_SECRET is set to the committed development fallback, which is public ' +
        `in this repository's history and must never sign production tokens. ${GENERATE_HINT}`,
    );
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is ${value.length} characters; HS256 requires at least ` +
        `${MIN_SECRET_LENGTH}. ${GENERATE_HINT}`,
    );
  }
  return value;
}

/**
 * Returns the active signing key.
 *
 * @returns The configured secret in production, or the configured secret and
 *          otherwise the development fallback outside production.
 * @throws  Error in production when the secret is unset, equal to the committed
 *          development fallback, or shorter than {@link MIN_SECRET_LENGTH}.
 *
 * Not memoised: `jwt.sign` and `jwt.verify` dominate the cost of a call, and
 * re-reading keeps behaviour correct when tests mutate `process.env`.
 */
export function getJwtSecret(): string {
  const value = readConfiguredSecret();
  return isProduction() ? resolveForProduction(value) : resolveForDevelopment(value);
}

/**
 * Startup guard. Call once before the HTTP listener binds so a misconfigured
 * deployment crashes immediately and visibly, instead of accepting forged
 * tokens for the lifetime of the revision.
 *
 * @throws Error with the same conditions as {@link getJwtSecret}.
 */
export function assertJwtSecretConfigured(): void {
  getJwtSecret();
}
