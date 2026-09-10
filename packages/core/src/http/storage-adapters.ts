/**
 * Concrete TokenStorage implementations for web, generic async storage, and
 * native secure storage.
 *
 * Both are real, working adapters. The previous shared module tried to serve
 * both platforms from a single `localStorage` access guarded by
 * `typeof localStorage !== 'undefined'`. In React Native that guard is always
 * false, so the mobile app silently had no session storage at all and could
 * never authenticate.
 */

import { STORAGE_KEYS, type TokenStorage } from './adapters';

/** Minimal surface of React Native's AsyncStorage, so core needs no RN dependency. */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Minimal surface implemented by expo-secure-store. */
export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
  isAvailableAsync?(): Promise<boolean>;
}

export interface SecureStoreStorageOptions {
  /** Existing unencrypted storage used only for the one-time credential move. */
  legacyStorage?: AsyncStorageLike;
  /** Keys eligible for migration. Defaults to the shared token and user keys. */
  migrationKeys?: readonly string[];
  migrationMarkerKey?: string;
}

export const SECURE_STORE_MIGRATION_KEY = 'partyhause_auth_secure_store_migration_v1';
const SECURE_STORE_MIGRATION_COMPLETE = 'complete';

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
    async clearSessionIfToken(expectedToken) {
      const s = resolve();
      if (!s) return false;
      try {
        if (s.getItem(STORAGE_KEYS.token) !== expectedToken) return false;
        s.removeItem(STORAGE_KEYS.token);
        s.removeItem(STORAGE_KEYS.user);
        return true;
      } catch {
        return false;
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
  let operationQueue = Promise.resolve();
  function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = operationQueue.then(operation, operation);
    operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }
  return {
    async getItem(key) {
      return runExclusive(async () => {
        try {
          return await asyncStorage.getItem(key);
        } catch {
          return null;
        }
      });
    },
    async setItem(key, value) {
      return runExclusive(async () => {
        try {
          await asyncStorage.setItem(key, value);
        } catch {
          // Persisting failed; the session remains valid for this launch only.
        }
      });
    },
    async removeItem(key) {
      return runExclusive(async () => {
        try {
          await asyncStorage.removeItem(key);
        } catch {
          // Nothing actionable.
        }
      });
    },
    async clearSessionIfToken(expectedToken) {
      return runExclusive(async () => {
        try {
          if (await asyncStorage.getItem(STORAGE_KEYS.token) !== expectedToken) return false;
          await asyncStorage.removeItem(STORAGE_KEYS.token);
          await asyncStorage.removeItem(STORAGE_KEYS.user);
          return true;
        } catch {
          return false;
        }
      });
    },
  };
}

/**
 * Keychain/Keystore-backed token storage with a one-time AsyncStorage migration.
 *
 * A legacy value is deleted only after the SecureStore write is read back
 * successfully. The completion marker is written last. If any operation fails,
 * the promise rejects and a later call retries without losing the legacy copy.
 */
export function createSecureStoreStorage(
  secureStore: SecureStoreLike,
  options: SecureStoreStorageOptions = {},
): TokenStorage {
  if (!secureStore || typeof secureStore.getItemAsync !== 'function') {
    throw new Error('createSecureStoreStorage: a valid SecureStore implementation is required');
  }

  const legacyStorage = options.legacyStorage;
  const migrationKeys = [
    ...new Set(options.migrationKeys ?? [STORAGE_KEYS.token, STORAGE_KEYS.user]),
  ];
  const markerKey = options.migrationMarkerKey ?? SECURE_STORE_MIGRATION_KEY;
  let migrationPromise: Promise<void> | null = null;
  let operationQueue = Promise.resolve();

  async function migrateLegacyCredentials(): Promise<void> {
    if (!legacyStorage) return;
    if (secureStore.isAvailableAsync && !(await secureStore.isAvailableAsync())) {
      throw new Error('Secure credential storage is unavailable on this device');
    }
    if (await secureStore.getItemAsync(markerKey) === SECURE_STORE_MIGRATION_COMPLETE) {
      return;
    }

    for (const key of migrationKeys) {
      const legacyValue = await legacyStorage.getItem(key);
      if (legacyValue === null) continue;

      const secureValue = await secureStore.getItemAsync(key);
      if (secureValue === null) {
        await secureStore.setItemAsync(key, legacyValue);
        if (await secureStore.getItemAsync(key) !== legacyValue) {
          throw new Error(`Secure credential migration verification failed for ${key}`);
        }
      }

      await legacyStorage.removeItem(key);
      if (await legacyStorage.getItem(key) !== null) {
        throw new Error(`Legacy credential removal failed for ${key}`);
      }
    }

    await secureStore.setItemAsync(markerKey, SECURE_STORE_MIGRATION_COMPLETE);
  }

  async function ensureMigrated(): Promise<void> {
    if (!migrationPromise) {
      migrationPromise = migrateLegacyCredentials().catch((error: unknown) => {
        migrationPromise = null;
        throw error;
      });
    }
    await migrationPromise;
  }

  async function assertSecureStoreAvailable(): Promise<void> {
    if (secureStore.isAvailableAsync && !(await secureStore.isAvailableAsync())) {
      throw new Error('Secure credential storage is unavailable on this device');
    }
  }

  async function removeLegacyValue(key: string): Promise<void> {
    if (legacyStorage && migrationKeys.includes(key)) {
      await legacyStorage.removeItem(key);
    }
  }

  function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = operationQueue.then(operation, operation);
    operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  return {
    async getItem(key) {
      return runExclusive(async () => {
        await ensureMigrated();
        return secureStore.getItemAsync(key);
      });
    },
    async setItem(key, value) {
      return runExclusive(async () => {
        await ensureMigrated();
        await secureStore.setItemAsync(key, value);
        if (await secureStore.getItemAsync(key) !== value) {
          throw new Error(`Secure credential write verification failed for ${key}`);
        }
        await removeLegacyValue(key);
      });
    },
    async removeItem(key) {
      return runExclusive(async () => {
        await assertSecureStoreAvailable();
        let firstError: unknown = null;
        try {
          await secureStore.deleteItemAsync(key);
        } catch (error) {
          firstError = error;
        }
        try {
          await removeLegacyValue(key);
        } catch (error) {
          firstError ??= error;
        }
        if (firstError) throw firstError;
      });
    },
    async clearSessionIfToken(expectedToken) {
      return runExclusive(async () => {
        await assertSecureStoreAvailable();
        if (await secureStore.getItemAsync(STORAGE_KEYS.token) !== expectedToken) return false;
        await secureStore.deleteItemAsync(STORAGE_KEYS.token);
        await secureStore.deleteItemAsync(STORAGE_KEYS.user);
        await removeLegacyValue(STORAGE_KEYS.token);
        await removeLegacyValue(STORAGE_KEYS.user);
        return true;
      });
    },
  };
}
