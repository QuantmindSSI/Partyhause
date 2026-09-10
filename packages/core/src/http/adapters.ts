/**
 * Platform seams for the shared API client.
 *
 * The transport in ./transport.ts contains no browser or React Native APIs.
 * Everything platform-specific enters through these four interfaces, which is
 * what allows one implementation to serve both the Vite web app and the Expo
 * mobile app.
 *
 * The previous shared module assumed `localStorage` existed everywhere. React
 * Native has no such global, so `typeof localStorage !== 'undefined'` was
 * always false and every session lookup returned null: the mobile app could
 * never authenticate. TokenStorage is therefore async, matching AsyncStorage,
 * and the web adapter wraps its synchronous storage in resolved promises
 * rather than the reverse.
 */

/**
 * Persistent key/value storage for the auth token and cached user.
 *
 * Async by necessity: React Native's AsyncStorage is promise-based. Making the
 * narrower platform fit the wider contract keeps one code path.
 */
export interface TokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  /** Atomically clear token and user only when the current token matches. */
  clearSessionIfToken?(expectedToken: string): Promise<boolean>;
}

/** One completed request, for observability. Never includes headers or bodies. */
export interface ApiCallRecord {
  timestamp: string;
  method: string;
  path: string;
  /** Null when the request never produced a response (network failure/timeout). */
  status: number | null;
  ok: boolean;
  durationMs: number;
  /** Attempts actually made, including the first. */
  attempts: number;
  errorMessage: string | null;
}

/**
 * Optional observability sink.
 *
 * Implementations must not throw; the transport guards the call anyway, because
 * monitoring must never change a request's outcome.
 */
export type Telemetry = (record: ApiCallRecord) => void;

/**
 * Invoked once when the server rejects a request with 401.
 *
 * Web clears persisted state and navigates to the root; mobile resets the
 * navigation stack. The transport does not care which, and still returns a
 * normal error result to the caller so no request silently hangs.
 */
export type UnauthorizedHandler = (rejectedToken?: string) => void | Promise<void>;

/** Everything the client factory needs to bind itself to a platform. */
export interface ApiClientConfig {
  /** Origin with no trailing slash, for example `https://api.example.com`. */
  baseUrl: string;
  storage: TokenStorage;
  telemetry?: Telemetry;
  onUnauthorized?: UnauthorizedHandler;
  /** Overrides the 15s default. Must be > 0. */
  timeoutMs?: number;
}

/** Storage keys, shared so web and mobile agree on where the session lives. */
export const STORAGE_KEYS = {
  token: 'partyhause_auth_token',
  user: 'partyhause_auth_user',
} as const;

/**
 * An in-memory TokenStorage.
 *
 * Used by tests and by server-side rendering, where no persistent storage
 * exists. Fully functional, not a stub: values survive for the process
 * lifetime.
 */
export function createMemoryStorage(): TokenStorage {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
    async clearSessionIfToken(expectedToken) {
      if (map.get(STORAGE_KEYS.token) !== expectedToken) return false;
      map.delete(STORAGE_KEYS.token);
      map.delete(STORAGE_KEYS.user);
      return true;
    },
  };
}
