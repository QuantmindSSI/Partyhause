/**
 * The request engine shared by web and mobile.
 *
 * Ported from src/lib/api-client.ts, which already had the behaviour worth
 * keeping (bounded timeout, idempotent-only retry, 401 handling, error
 * normalisation) but reached directly for localStorage, window.location and a
 * web-only telemetry module. Those are now injected via ./adapters.
 *
 * Contains no browser or React Native API. `fetch`, `AbortController` and
 * `URLSearchParams` are the only globals used, and all three exist in modern
 * browsers and in React Native's Hermes runtime.
 */

import type { ApiClientConfig, TokenStorage, Telemetry, UnauthorizedHandler } from './adapters';
import { STORAGE_KEYS } from './adapters';

/** Uniform result. Exactly one of `data` and `error` is non-null. */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  /** Absent when the request never reached the server. */
  status?: number;
  /**
   * Machine-readable error code, when the route sends one.
   *
   * Only `POST /api/auth/login` sets one today: `EMAIL_NOT_VERIFIED`, on a 403
   * that is deliberately distinct from the 401 for bad credentials. The
   * distinction matters because the two need opposite remedies, a resend
   * versus a reset, and the client cannot tell them apart from the message
   * text. It was being discarded here, so mobile had to infer intent from the
   * status code, which is fragile the moment a second 403 appears on that
   * route.
   */
  code?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip the Authorization header. Used by login and signup. */
  anonymous?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;
/** Gateway failures are transient; retrying a GET is safe and usually works. */
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_DELAY_MS = 600;
/**
 * At most two attempts, and only for GET. Retrying a POST could duplicate an
 * event or a guest, so mutations are never retried (Power of 10 rule 2: every
 * loop has a provable bound).
 */
const MAX_GET_ATTEMPTS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions['query'],
): string {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl.replace(/\/+$/, '')}${normalisedPath}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Extract a human-usable message from a parsed error body.
 *
 * The API is not perfectly consistent: some routes return `{ error }`, others
 * `{ message }`, and a few return plain text. Falling back to the status code
 * guarantees a non-empty message in every case.
 */
function messageFromBody(parsed: unknown, status: number): string {
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error) return obj.error;
    if (typeof obj.message === 'string' && obj.message) return obj.message;
  }
  if (typeof parsed === 'string' && parsed.length > 0) return parsed;
  return `HTTP error! status: ${status}`;
}

/**
 * Extract a machine-readable `code` from a parsed error body.
 *
 * @returns the code, or undefined when the route did not send one.
 */
function codeFromBody(parsed: unknown): string | undefined {
  if (!parsed || typeof parsed !== 'object') return undefined;
  const code = (parsed as Record<string, unknown>).code;
  return typeof code === 'string' && code.length > 0 ? code : undefined;
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/** A bound request function plus the storage it authenticates from. */
export interface Transport {
  request<T = unknown>(path: string, options: RequestOptions): Promise<ApiResponse<T>>;
  storage: TokenStorage;
  baseUrl: string;
}

/**
 * Build a transport bound to one platform's adapters.
 *
 * @param config Base URL, storage, and optional telemetry / 401 handler.
 * @returns A transport whose `request` never throws; inspect `error`.
 * @throws Error if `baseUrl` is empty or `timeoutMs` is not positive.
 */
export function createTransport(config: ApiClientConfig): Transport {
  const baseUrl = (config.baseUrl || '').trim();
  if (!baseUrl) {
    throw new Error('createTransport: baseUrl is required');
  }
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`createTransport: timeoutMs must be positive, received ${timeoutMs}`);
  }
  const storage: TokenStorage = config.storage;
  const telemetry: Telemetry | undefined = config.telemetry;
  const onUnauthorized: UnauthorizedHandler | undefined = config.onUnauthorized;

  async function fetchWithTimeout(url: string, init: Record<string, unknown>): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal } as RequestInit);
    } finally {
      clearTimeout(timer);
    }
  }

  function report(record: Parameters<Telemetry>[0]): void {
    if (!telemetry) return;
    try {
      telemetry(record);
    } catch {
      // Observability must never change an outcome.
    }
  }

  async function request<T = unknown>(
    path: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const { method, body, headers, query, anonymous } = options;
    const startedAt = now();
    let attempts = 0;

    const finish = (
      status: number | null,
      ok: boolean,
      errorMessage: string | null,
    ): void => {
      report({
        timestamp: new Date().toISOString(),
        method,
        path,
        status,
        ok,
        durationMs: Math.round(now() - startedAt),
        attempts,
        errorMessage,
      });
    };

    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(headers || {}),
    };
    let requestToken: string | null = null;
    if (body !== undefined && body !== null) {
      finalHeaders['Content-Type'] = 'application/json';
    }
    if (!anonymous) {
      try {
        requestToken = await storage.getItem(STORAGE_KEYS.token);
        if (requestToken) finalHeaders['Authorization'] = `Bearer ${requestToken}`;
      } catch {
        const message = 'Secure credential storage is unavailable';
        finish(null, false, message);
        return { data: null, error: { message, code: 'STORAGE_UNAVAILABLE' } };
      }
    }

    const url = buildUrl(baseUrl, path, query);
    const init = {
      method,
      headers: finalHeaders,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    };

    const maxAttempts = method === 'GET' ? MAX_GET_ATTEMPTS : 1;
    let response: Response | null = null;
    let networkError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attempts = attempt;
      try {
        response = await fetchWithTimeout(url, init);
      } catch (err) {
        const aborted =
          typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError';
        networkError = aborted
          ? `Request timed out after ${Math.round(timeoutMs / 1000)}s`
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
      const message = networkError || 'Network request failed';
      finish(null, false, message);
      return { data: null, error: { message } };
    }

    let parsed: unknown = null;
    let bodyReadError: string | null = null;
    try {
      const text = await response.text();
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
    } catch (error) {
      bodyReadError = error instanceof Error ? error.message : 'Response body could not be read';
    }

    if (response.status === 401) {
      const message = bodyReadError || messageFromBody(parsed, 401);
      finish(401, false, message);
      if (requestToken) {
        try {
          if (storage.clearSessionIfToken) {
            await storage.clearSessionIfToken(requestToken);
          } else if (await storage.getItem(STORAGE_KEYS.token) === requestToken) {
            await storage.removeItem(STORAGE_KEYS.token);
            await storage.removeItem(STORAGE_KEYS.user);
          }
        } catch {
          // The platform observer below handles cleanup failure explicitly.
        }
        if (onUnauthorized) {
          try {
            await onUnauthorized(requestToken ?? undefined);
          } catch {
            // A failing navigation response must not mask the API result.
          }
        }
      }
      return {
        data: null,
        error: { message, status: 401, code: codeFromBody(parsed) },
      };
    }

    if (bodyReadError) {
      finish(response.status, false, bodyReadError);
      return { data: null, error: { message: bodyReadError, status: response.status } };
    }

    if (!response.ok) {
      const message = messageFromBody(parsed, response.status);
      const code = codeFromBody(parsed);
      finish(response.status, false, message);
      return {
        data: null,
        // `code` is omitted entirely when the route did not send one, rather
        // than present and undefined. A caller doing `'code' in error` should
        // get a truthful answer, and `toStrictEqual` in the tests distinguishes
        // the two.
        error: code ? { message, status: response.status, code } : { message, status: response.status },
      };
    }

    finish(response.status, true, null);
    return { data: parsed as T, error: null };
  }

  return { request, storage, baseUrl };
}
