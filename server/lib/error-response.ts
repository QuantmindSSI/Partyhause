/**
 * What the API tells a caller when a request fails unexpectedly.
 *
 * Extracted from the global error handler in server/index.ts so the disclosure
 * rule can be asserted directly. The rule is a security boundary, and a
 * boundary that only exists inline in a 450-line entrypoint is one nobody can
 * write a test against.
 */

import { CorsOriginError } from './cors-policy';

/** A status code and the exact JSON body to send with it. */
export interface ErrorResponse {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Maps an unhandled error to the response the client receives.
 *
 * @param err Whatever reached the error handler. Not necessarily an `Error`:
 *   any value can be thrown, and a rejected promise can carry a string.
 * @param isProduction `true` when `NODE_ENV === 'production'`. Drives whether
 *   the underlying message is disclosed.
 * @returns Status and body. Never throws, and never returns `undefined` for
 *   either field, so the handler has nothing to guard.
 *
 * A refused origin is a client mistake and becomes 403 with a fixed body. It
 * previously became `500 Internal server error`, which is what monitoring
 * escalates on, so a stray origin probing the API read as a server fault.
 *
 * Everything else is 500, and in production the underlying message is
 * withheld. It used to be returned verbatim. A CORS message is harmless, but
 * this is the terminus for *every* unhandled throw, and Prisma is the layer
 * most likely to reach it: its errors carry table names, column names,
 * constraint names and, on a uniqueness violation, the conflicting value. That
 * is a description of the schema and sometimes of another user's data, handed
 * to an anonymous caller.
 *
 * The message is not discarded, it moves. `logFor` returns what the server
 * should write to its own log, so operators keep everything they had and only
 * the client loses it. Outside production the message is still returned,
 * because that is where a developer reads it from the response and there is
 * nothing there worth concealing.
 *
 * Complexity: O(1).
 */
export function describeError(err: unknown, isProduction: boolean): ErrorResponse {
  if (err instanceof CorsOriginError) {
    return { status: err.status, body: { error: 'Origin not allowed' } };
  }

  const message = err instanceof Error ? err.message : undefined;

  return {
    status: 500,
    body: {
      error: 'Internal server error',
      // Spread rather than `message: undefined`, so the key is absent in
      // production instead of present and null. A client cannot tell the
      // difference between "withheld" and "there was no message", which is
      // the intent.
      ...(isProduction ? {} : { message }),
    },
  };
}

/** Severity for an error, so an expected refusal does not log as a fault. */
export type ErrorLogLevel = 'warn' | 'error';

/**
 * How the server should log an error it has just answered.
 *
 * @param err The same value passed to `describeError`.
 * @returns The level to log at and the text to log. A refused origin is
 *   expected traffic and logs at `warn` with no stack; anything else keeps the
 *   full value at `error` so the stack survives.
 *
 * Complexity: O(1).
 */
export function logFor(err: unknown): { level: ErrorLogLevel; message: string; detail?: unknown } {
  if (err instanceof CorsOriginError) {
    return { level: 'warn', message: `[cors] refused origin: ${err.origin}` };
  }
  return { level: 'error', message: 'Unhandled error:', detail: err };
}
