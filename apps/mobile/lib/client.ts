/**
 * The mobile app's API client instance.
 *
 * Replaces lib/supabase.ts, which was non-functional in every build:
 * `requireSupabase()` threw whenever EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY were unset, which was always, because Supabase
 * was removed from this project in July 2026. The exported `supabase` const
 * evaluated to null for the same reason, so `supabase.auth.getSession()` threw
 * a TypeError. Every screen touching auth or data crashed on mount.
 *
 * One instance, created once at module load. Native credentials live in
 * SecureStore and are attached by the transport, so no call site handles
 * Authorization headers by hand any more.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMvpApiClient,
  createSecureStoreStorage,
  type MvpApiClient,
} from '@partyhause/core/mvp';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from './api';

type SessionRejectedHandler = (rejectedToken?: string) => void | Promise<void>;

let sessionRejectedHandler: SessionRejectedHandler | null = null;

const authStorage = createSecureStoreStorage(SecureStore, { legacyStorage: AsyncStorage });

/** Register the mounted session provider as the sole runtime 401 observer. */
export function subscribeToSessionRejection(handler: SessionRejectedHandler): () => void {
  sessionRejectedHandler = handler;
  return () => {
    if (sessionRejectedHandler === handler) sessionRejectedHandler = null;
  };
}

/**
 * Called when the API rejects a request with 401.
 *
 * The transport has already cleared the stored token and user by this point.
 * Navigation is deliberately not performed here: expo-router's imperative API
 * is not safe to call before the root layout mounts, and a failed redirect
 * must never mask the 401 from the caller. The mounted AuthSessionProvider
 * subscribes here and owns the navigation gate.
 */
async function handleUnauthorized(rejectedToken?: string): Promise<void> {
  if (sessionRejectedHandler) {
    await sessionRejectedHandler(rejectedToken);
    return;
  }
  if (__DEV__) {
    console.warn('[api] session rejected (401); stored credentials cleared');
  }
}

export const api: MvpApiClient = createMvpApiClient({
  baseUrl: getApiBaseUrl(),
  storage: authStorage,
  onUnauthorized: handleUnauthorized,
});
