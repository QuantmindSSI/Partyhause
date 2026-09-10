/**
 * Which cross-origin callers the API answers.
 *
 * Extracted from server/index.ts so it can be tested against the real
 * implementation. The rule it encodes was previously inline, and the only test
 * that could reach inline server logic was one that copied it into the test
 * file, which passes happily when the copy and the original drift apart.
 */

/**
 * A cross-origin request that was refused.
 *
 * A distinct type rather than a plain `Error` so the global error handler can
 * answer 403 instead of 500. `cors` reports a rejected origin by invoking its
 * callback with an error, which lands in the same handler as a genuine fault,
 * so production answered a refused browser origin with `500 Internal server
 * error`. That is the wrong status for a client mistake, and it means every
 * stray origin probing the API raises the alert that a real fault would.
 */
export class CorsOriginError extends Error {
  /** HTTP status the handler should use. Refusal is the caller's problem. */
  readonly status = 403;

  constructor(readonly origin: string) {
    super(`CORS: origin ${origin} not allowed`);
    this.name = 'CorsOriginError';
  }
}

/**
 * Splits the `CORS_ALLOWED_ORIGINS` variable into an allowlist.
 *
 * @param raw Comma-separated origins, or `undefined` when the variable is
 *   unset. Blank entries and surrounding whitespace are discarded, so a
 *   trailing comma or a value wrapped across lines does not produce an empty
 *   origin that could never match anything.
 * @returns The origins in declaration order, with no empty strings.
 *
 * Complexity: O(n) in the length of `raw`.
 */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Inputs to the origin decision. */
export interface CorsPolicy {
  /** Origins named by configuration. Empty means the variable was unset. */
  allowedOrigins: string[];
  /**
   * What an empty `allowedOrigins` means.
   *
   * `true` outside production, `false` in production. See `isOriginAllowed`
   * for why the two differ.
   */
  allowAnyOriginWhenUnset: boolean;
}

/**
 * Decides whether one origin may make a credentialed cross-origin request.
 *
 * @param origin The `Origin` header, or `undefined`/`''` when absent.
 * @param policy Configured allowlist and the fail-open/fail-closed choice.
 * @returns `true` to allow, `false` to refuse. The caller raises
 *   `CorsOriginError` on a refusal; this function stays pure so it can be
 *   asserted directly.
 *
 * A missing `Origin` is always allowed, and that is deliberate rather than an
 * oversight. It is not a cross-origin browser request: the mobile app, `curl`,
 * health probes and every server-to-server caller send no `Origin`, and CORS
 * is not the control that governs them. Authentication is. Refusing them here
 * would break the iOS client and the Container Apps probe while protecting
 * nothing, because a non-browser caller is not bound by the same-origin policy
 * in the first place and would simply omit the header.
 *
 * An empty allowlist used to mean "allow everyone", unconditionally, while
 * `credentials: true` was also set. That pairing is the reason this changed: a
 * browser attaches the signed-in user's credentials to a cross-origin request
 * that the API then blesses, so an unset variable was not a cosmetic
 * misconfiguration.
 *
 * Production now fails closed, which is safe rather than theoretical. Bicep
 * sets the variable on the Container App (`infra/resources.bicep:315`) with the
 * apex, `www` and the web FQDN, so the deployed API has never depended on the
 * empty case. An unset variable in production is a provisioning accident, and
 * serving no cross-origin browser traffic is the correct answer to one.
 *
 * Development stays open, because `npm run dev` puts the web app on :5173 and
 * the API on :3001, which are different origins, and nothing local sets the
 * variable. Failing closed there would break every local session in order to
 * defend a machine that is not exposed.
 *
 * Complexity: O(n) in the size of the allowlist.
 */
export function isOriginAllowed(origin: string | undefined, policy: CorsPolicy): boolean {
  if (!origin) return true;
  if (policy.allowedOrigins.includes('*')) return true;
  if (policy.allowedOrigins.length === 0) return policy.allowAnyOriginWhenUnset;
  return policy.allowedOrigins.includes(origin);
}
