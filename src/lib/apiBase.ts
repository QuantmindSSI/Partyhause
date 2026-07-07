/**
 * Centralized API base URL helper.
 *
 * All frontend code should call `apiUrl('/api/...')` instead of constructing
 * fetch URLs by hand. The base URL is resolved from a single env var:
 *
 *   VITE_API_URL  — the public origin of the API (e.g. https://ca-api-partyhause-xxx.eastus2.azurecontainerapps.io)
 *
 * When `VITE_API_URL` is empty (the default), requests are same-origin
 * relative (e.g. `/api/send-email`), which is correct whenever the API is
 * served from the same host as the PWA (e.g. via a reverse proxy or when
 * the API container is the only backend).
 *
 * In development, set VITE_API_URL=http://localhost:3001 to point at the
 * local Express API server.
 *
 * The env var is read lazily at call time (not at module load) so tests and
 * runtime env changes are respected.
 */

function rawApiUrl(): string {
  const v = (import.meta as any).env?.VITE_API_URL;
  return typeof v === 'string' ? v.replace(/\/+$/, '') : '';
}

/**
 * The current API base URL (read lazily from VITE_API_URL on each call).
 */
export function getApiBaseUrl(): string {
  return rawApiUrl();
}

/**
 * Resolve a full API URL from a path like `/api/send-email`.
 * - If VITE_API_URL is set, returns `${base}${path}`.
 * - Otherwise returns the path as-is (same-origin).
 */
export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  const base = rawApiUrl();
  return base ? `${base}${path}` : path;
}

/**
 * Convenience: the canonical email-send endpoint (read lazily).
 */
export function getEmailApiUrl(): string {
  return apiUrl('/api/send-email');
}
