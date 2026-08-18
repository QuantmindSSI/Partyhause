import { getStoredToken, clearAuth } from './supabase';
import { apiUrl } from './apiBase';

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

export async function getAuthToken(): Promise<string | null> {
  return getStoredToken();
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  // The app has no /auth URL route — auth is a state machine keyed off the
  // PERSISTED zustand store ('party-store'). If only the token is cleared,
  // the rehydrated store still says "logged in", every call 401s, and the
  // user is stuck in a loop. Clear both, then land on the root.
  try {
    clearAuth();
    window.localStorage.removeItem('party-store');
  } catch {
    // Storage unavailable — reload still forces re-auth because the token
    // is gone from memory.
  }
  const path = window.location.pathname || '';
  if (path === '/' || path.includes('/auth') || path.includes('/login')) {
    window.location.reload();
    return;
  }
  window.location.href = '/';
}

interface FetchOptions {
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Abort any request that hasn't completed within this window. */
const REQUEST_TIMEOUT_MS = 15_000;
/** GETs are idempotent — retry once on transient failures. */
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T = unknown>(path: string, options: FetchOptions): Promise<ApiResponse<T>> {
  const { method, body, headers } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers || {}),
  };

  if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const token = await getAuthToken();
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = apiUrl(path);
  const init: RequestInit = {
    method,
    headers: finalHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  };

  // Bounded retry: GET only (idempotent), at most 2 attempts total, on
  // network failure / timeout / gateway errors. Mutations never retry.
  const maxAttempts = method === 'GET' ? 2 : 1;

  let response: Response | null = null;
  let lastNetworkError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await fetchWithTimeout(url, init);
    } catch (err) {
      lastNetworkError =
        err instanceof DOMException && err.name === 'AbortError'
          ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
          : err instanceof Error
            ? err.message
            : 'Network request failed';
      response = null;
      if (attempt < maxAttempts) await sleep(RETRY_DELAY_MS);
      continue;
    }

    if (RETRYABLE_STATUS.has(response.status) && attempt < maxAttempts) {
      await sleep(RETRY_DELAY_MS);
      continue;
    }
    break;
  }

  if (!response) {
    return { data: null, error: { message: lastNetworkError || 'Network request failed' } };
  }

  if (response.status === 401) {
    redirectToLogin();
    return { data: null, error: { message: 'Unauthorized', status: 401 } };
  }

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

export async function apiGet<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'GET' });
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'POST', body });
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PUT', body });
}

export async function apiDelete<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' });
}
