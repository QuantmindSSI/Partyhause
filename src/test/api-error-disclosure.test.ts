/**
 * Tests for the two API defects that were open in production on 2026-09-10.
 *
 * WHY THIS EXISTS
 *   Both were listed under "Known API defects" in AGENTS.md and both were
 *   confirmed live before being changed, not inferred from reading the code.
 *
 *   1. The global error handler returned `err.message` to the client in every
 *      500. Demonstrated against the deployed API:
 *
 *        curl -H 'Origin: https://evil.example.com' $API/api/health
 *        -> HTTP 500
 *           {"error":"Internal server error",
 *            "message":"CORS: origin https://evil.example.com not allowed"}
 *
 *      The CORS text is harmless in itself. The handler is the terminus for
 *      every unhandled throw, and Prisma is the layer most likely to reach it,
 *      carrying table, column and constraint names and, on a uniqueness
 *      violation, the conflicting value.
 *
 *   2. That same response shows the second defect: a refused origin, which is
 *      a client mistake, was answered `500 Internal server error`. 500 is what
 *      monitoring escalates on, so any stray origin probing the API produced
 *      the same signal as a real fault.
 *
 *   3. An empty `CORS_ALLOWED_ORIGINS` allowed every origin, while
 *      `credentials: true` was also set.
 *
 * WHAT IS ASSERTED
 *   The real implementation, imported from server/lib. These decisions were
 *   inline in server/index.ts, which binds an Express app and a Prisma client
 *   at module load and so cannot be imported here; they were extracted for
 *   exactly that reason. The alternative used by send-email-scoping.test.ts is
 *   to copy the rule into the test file, which keeps passing when the copy and
 *   the original drift apart.
 *
 *   Each rule is asserted separately. A single happy-path test would still
 *   pass with the production branch of the disclosure rule deleted.
 */

import { describe, it, expect } from 'vitest';

import {
  CorsOriginError,
  isOriginAllowed,
  parseAllowedOrigins,
  type CorsPolicy,
} from '../../server/lib/cors-policy';
import { describeError, logFor } from '../../server/lib/error-response';

const WEB_ORIGIN = 'https://partyhause.com';
const OTHER_ORIGIN = 'https://evil.example.com';

/** The production shape: an allowlist is configured and unset means refuse. */
const configured: CorsPolicy = {
  allowedOrigins: [WEB_ORIGIN, 'https://www.partyhause.com'],
  allowAnyOriginWhenUnset: false,
};

describe('parseAllowedOrigins', () => {
  it('splits a comma-separated list and trims each entry', () => {
    expect(parseAllowedOrigins('https://a.com, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('drops blank entries so a trailing comma cannot produce an empty origin', () => {
    // An empty string in the allowlist would be an entry that never matches a
    // real Origin header but does make `length === 0` false, quietly turning
    // the fail-closed branch off.
    expect(parseAllowedOrigins('https://a.com,,  ,')).toEqual(['https://a.com']);
  });

  it('treats an unset variable as an empty allowlist rather than throwing', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins('')).toEqual([]);
  });
});

describe('isOriginAllowed', () => {
  it('allows an origin named in the allowlist', () => {
    expect(isOriginAllowed(WEB_ORIGIN, configured)).toBe(true);
  });

  it('refuses an origin that is not named', () => {
    expect(isOriginAllowed(OTHER_ORIGIN, configured)).toBe(false);
  });

  it('allows a request with no Origin header', () => {
    // The mobile app, curl, and the Container Apps health probe all send no
    // Origin. They are not cross-origin browser requests and CORS is not the
    // control that governs them; authentication is. Refusing here would break
    // the iOS client while protecting nothing, since a non-browser caller can
    // simply omit the header.
    expect(isOriginAllowed(undefined, configured)).toBe(true);
    expect(isOriginAllowed('', configured)).toBe(true);
  });

  it('refuses every origin in production when the variable is unset', () => {
    // The defect being closed. This returned true for anything, with
    // credentials: true also set, so a browser would attach the signed-in
    // user's token to a cross-origin request the API then blessed.
    const productionUnset: CorsPolicy = {
      allowedOrigins: [],
      allowAnyOriginWhenUnset: false,
    };
    expect(isOriginAllowed(OTHER_ORIGIN, productionUnset)).toBe(false);
    expect(isOriginAllowed(WEB_ORIGIN, productionUnset)).toBe(false);
    // Still reachable by non-browser callers, which is what keeps a
    // misprovisioned deploy diagnosable instead of entirely dark.
    expect(isOriginAllowed(undefined, productionUnset)).toBe(true);
  });

  it('allows any origin outside production when the variable is unset', () => {
    // npm run dev puts the web app on :5173 and the API on :3001. Failing
    // closed here would break every local session to defend a machine that is
    // not exposed.
    const developmentUnset: CorsPolicy = {
      allowedOrigins: [],
      allowAnyOriginWhenUnset: true,
    };
    expect(isOriginAllowed('http://localhost:5173', developmentUnset)).toBe(true);
  });

  it('honours an explicit wildcard even in production', () => {
    // Distinct from the unset case: '*' is somebody stating an intent, an
    // empty variable is somebody having forgotten.
    const wildcard: CorsPolicy = { allowedOrigins: ['*'], allowAnyOriginWhenUnset: false };
    expect(isOriginAllowed(OTHER_ORIGIN, wildcard)).toBe(true);
  });
});

describe('describeError', () => {
  it('answers a refused origin with 403, not 500', () => {
    const { status, body } = describeError(new CorsOriginError(OTHER_ORIGIN), true);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Origin not allowed' });
  });

  it('does not echo the refused origin back to the caller', () => {
    // Production returned the full "CORS: origin <x> not allowed" string.
    const { body } = describeError(new CorsOriginError(OTHER_ORIGIN), true);
    expect(JSON.stringify(body)).not.toContain(OTHER_ORIGIN);
  });

  it('withholds the underlying message in production', () => {
    const prismaish = new Error(
      'Unique constraint failed on the fields: (`event_id`,`normalized_email`)',
    );
    const { status, body } = describeError(prismaish, true);
    expect(status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    // The key must be absent, not present and undefined: a caller cannot then
    // distinguish "withheld" from "there was no message".
    expect('message' in body).toBe(false);
    expect(JSON.stringify(body)).not.toContain('normalized_email');
  });

  it('still returns the message outside production', () => {
    const { status, body } = describeError(new Error('boom'), false);
    expect(status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', message: 'boom' });
  });

  it('survives a thrown value that is not an Error', () => {
    // Any value can be thrown and a rejected promise can carry a string, so
    // the handler must not assume `.message` exists.
    expect(describeError('a bare string', true)).toEqual({
      status: 500,
      body: { error: 'Internal server error' },
    });
    expect(describeError(undefined, false)).toEqual({
      status: 500,
      body: { error: 'Internal server error', message: undefined },
    });
  });
});

describe('logFor', () => {
  it('logs a refused origin at warn, with the origin retained', () => {
    // The message moves from the response to the log rather than being
    // discarded: operators keep everything they had.
    const log = logFor(new CorsOriginError(OTHER_ORIGIN));
    expect(log.level).toBe('warn');
    expect(log.message).toContain(OTHER_ORIGIN);
  });

  it('logs a genuine fault at error, keeping the value for its stack', () => {
    const err = new Error('boom');
    const log = logFor(err);
    expect(log.level).toBe('error');
    expect(log.detail).toBe(err);
  });
});
