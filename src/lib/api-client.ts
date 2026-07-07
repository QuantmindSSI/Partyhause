/**
 * API client for the Express backend.
 *
 * All frontend data access should go through this module instead of calling
 * Supabase database queries directly. Auth is still handled by Supabase
 * (transitionally): the Supabase access token is sent to the API as a
 * `Bearer` token in the Authorization header.
 *
 * The base URL is resolved from `VITE_API_URL`. When empty, requests are
 * same-origin relative (`/api/*`), which works when the web container
 * proxies `/api/*` to the API container.
 */

import { supabase } from './supabase';
import { apiUrl } from './apiBase';

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

/**
 * Returns the current Supabase session access token, or null if there is
 * no active session.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  // Avoid redirect loops: only redirect when we're not already on the auth page.
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  if (path.includes('/auth') || path.includes('/login')) return;
  // Preserve the current location so we can return after re-auth.
  const returnUrl = window.location.pathname + window.location.search;
  window.location.href = `/auth?redirect=${encodeURIComponent(returnUrl)}`;
}

interface FetchOptions {
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T = unknown>(path: string, options: FetchOptions): Promise<ApiResponse<T>> {
  const { method, body, headers } = options;

  // Build headers
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers || {}),
  };

  if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // Attach the auth token (transitional: Supabase access token).
  const token = await getAuthToken();
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = apiUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return { data: null, error: { message } };
  }

  // 401 -> redirect to login
  if (response.status === 401) {
    redirectToLogin();
    return { data: null, error: { message: 'Unauthorized', status: 401 } };
  }

  // Parse the response body (JSON when possible, otherwise text).
  let parsed: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj['error'] === 'string') message = obj['error'];
      else if (typeof obj['message'] === 'string') message = obj['message'];
    } else if (typeof parsed === 'string' && parsed.length > 0) {
      message = parsed;
    }
    return { data: null, error: { message, status: response.status } };
  }

  return { data: parsed as T, error: null };
}

/**
 * GET request. `path` should be a relative API path, e.g. `/api/events`.
 * Query params can be appended to `path` by the caller.
 */
export async function apiGet<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'GET' });
}

/**
 * POST request with a JSON body.
 */
export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'POST', body });
}

/**
 * PUT request with a JSON body.
 */
export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PUT', body });
}

/**
 * DELETE request.
 */
export async function apiDelete<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' });
}
