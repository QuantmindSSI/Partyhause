import { getStoredToken } from './supabase';
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
  const path = window.location.pathname || '';
  if (path.includes('/auth') || path.includes('/login')) return;
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
