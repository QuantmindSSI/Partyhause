/**
 * Concrete TokenStorage implementations, one per platform.
 *
 * Both are real, working adapters. The previous shared module tried to serve
 * both platforms from a single `localStorage` access guarded by
 * `typeof localStorage !== 'undefined'`. In React Native that guard is always
 * false, so the mobile app silently had no session storage at all and could
 * never authenticate.
 */

import type { TokenStorage } from './adapters';

/** Minimal surface of React Native's AsyncStorage, so core needs no RN dependency. */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Minimal surface of the DOM Storage interface. */
export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Adapter over a synchronous web Storage (localStorage or sessionStorage).
 *
 * @param storage Defaults to `globalThis.localStorage` when available.
 * @returns An async TokenStorage. If no storage exists (SSR, or a browser with
 *          storage disabled) every read resolves null and writes are dropped,
 *          which degrades to "not signed in" rather than throwing.
 *
 * Reads and writes are wrapped in try/catch because Safari private mode throws
 * on setItem once the quota is reached.
 */
export function createWebStorage(storage?: WebStorageLike): TokenStorage {
  const resolve = (): WebStorageLike | null => {
    if (storage) return storage;
    try {
      const candidate = (globalThis as { localStorage?: WebStorageLike }).localStorage;
      return candidate ?? null;
    } catch {
      return null;
    }
  };
  return {
    async getItem(key) {
      const s = resolve();
      if (!s) return null;
      try {
        return s.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key, value) {
      const s = resolve();
      if (!s) return;
      try {
        s.setItem(key, value);
      } catch {
        // Quota exceeded or storage disabled. The in-flight session still works;
        // it simply will not survive a reload.
      }
    },
    async removeItem(key) {
      const s = resolve();
      if (!s) return;
      try {
        s.removeItem(key);
      } catch {
        // Nothing actionable; the caller's intent was to forget the value.
      }
    },
  };
}

/**
 * Adapter over React Native's AsyncStorage.
 *
 * @param asyncStorage The default export of @react-native-async-storage/async-storage.
 *        Injected rather than imported so this package carries no React Native
 *        dependency and stays usable from the web build.
 * @returns An async TokenStorage. Failures resolve to null / no-op instead of
 *          rejecting, so a storage fault logs the user out rather than crashing
 *          the app.
 */
export function createAsyncStorage(asyncStorage: AsyncStorageLike): TokenStorage {
  if (!asyncStorage || typeof asyncStorage.getItem !== 'function') {
    throw new Error('createAsyncStorage: a valid AsyncStorage implementation is required');
  }
  return {
    async getItem(key) {
      try {
        return await asyncStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key, value) {
      try {
        await asyncStorage.setItem(key, value);
      } catch {
        // Persisting failed; the session remains valid for this launch only.
      }
    },
    async removeItem(key) {
      try {
        await asyncStorage.removeItem(key);
      } catch {
        // Nothing actionable.
      }
    },
  };
}
