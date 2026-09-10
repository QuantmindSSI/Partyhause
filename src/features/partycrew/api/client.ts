/**
 * PartyCrew API adapter.
 *
 * This was a second, independent HTTP client. It had no timeout, no retry and
 * no 401 handling, so a partycrew request that hung, hung forever, and an
 * expired session surfaced as a generic error instead of a redirect to login.
 * It also read its bearer token from a separate store rather than from the
 * shared auth storage, so a sign-out did not reach it.
 *
 * It is now a thin adapter over `src/lib/api-client`, which owns the 15s
 * timeout, the idempotent-only retry on 502/503/504, the 401 redirect and the
 * request telemetry.
 *
 * The throwing convention is kept deliberately. The five partycrew hooks are
 * built around try/catch, and rewriting them to the `{ data, error }` shape at
 * the same time as changing the transport would mean two behavioural changes
 * in one step with no way to tell which caused a regression.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

type SupportedMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Parse the body a caller passed in RequestInit form.
 *
 * The hooks pass `body: JSON.stringify({...})`, while the shared client
 * serialises for them. Double-encoding would send a JSON string where the
 * route expects an object, so the string is parsed back before handing it on.
 */
function decodeBody(body: BodyInit | null | undefined): unknown {
  if (body == null) return undefined;
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    // Not JSON. Pass it through unchanged rather than discarding it.
    return body;
  }
}

/**
 * Make an authenticated API request.
 *
 * @param endpoint Path beginning with `/api/`.
 * @param options  `method` and `body` are honoured; `body` may be a
 *                 JSON string, as the existing callers pass.
 * @returns The parsed response body.
 * @throws Error carrying the server's message when the request fails, which is
 *         what every current caller catches.
 */
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const method = (options.method ?? 'GET').toUpperCase() as SupportedMethod;
  const body = decodeBody(options.body);

  let result;
  switch (method) {
    case 'POST':
      result = await apiPost<T>(endpoint, body);
      break;
    case 'PUT':
      result = await apiPut<T>(endpoint, body);
      break;
    case 'DELETE':
      result = await apiDelete<T>(endpoint);
      break;
    case 'GET':
      result = await apiGet<T>(endpoint);
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  // A 204, or a body that did not parse, yields null. Callers type this as a
  // concrete shape, so returning null here is the honest representation of
  // "the server sent nothing" rather than a fabricated empty object.
  return result.data as T;
};
