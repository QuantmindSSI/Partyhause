import type { ApiResponse } from '../http/transport';

/**
 * Lift one named property from an API response envelope.
 *
 * List and single-item routes wrap payloads under named keys. Returning those
 * envelopes directly would make callers receive an object where their types
 * promise an item or array.
 */
function unwrap<T>(
  response: ApiResponse<unknown>,
  key: string,
  fallback: T | null = null,
): ApiResponse<T> {
  if (response.error) return { data: null, error: response.error };
  const payload = response.data as Record<string, unknown> | null;
  if (!payload || typeof payload !== 'object') {
    return { data: fallback, error: null };
  }
  const value = payload[key];
  return { data: (value === undefined ? fallback : value) as T, error: null };
}

/** Lift an envelope containing a list, defaulting to an empty array. */
export async function unwrapList<T>(
  response: Promise<ApiResponse<unknown>>,
  key: string,
): Promise<ApiResponse<T[]>> {
  return unwrap<T[]>(await response, key, []);
}

/** Lift an envelope containing a single item. */
export async function unwrapOne<T>(
  response: Promise<ApiResponse<unknown>>,
  key: string,
): Promise<ApiResponse<T>> {
  return unwrap<T>(await response, key);
}
