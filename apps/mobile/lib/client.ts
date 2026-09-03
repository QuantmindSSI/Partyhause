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
 * One instance, created once at module load. The token lives in AsyncStorage
 * and is attached by the transport, so no call site handles Authorization
 * headers by hand any more.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, createAsyncStorage, type ApiClient } from '@partyhause/core';
import { getApiBaseUrl } from './api';

/**
 * Called when the API rejects a request with 401.
 *
 * The transport has already cleared the stored token and user by this point.
 * Navigation is deliberately not performed here: expo-router's imperative API
 * is not safe to call before the root layout mounts, and a failed redirect
 * must never mask the 401 from the caller. Screens observe
 * `api.auth.isAuthenticated()` and route accordingly.
 */
function handleUnauthorized(): void {
  if (__DEV__) {
    console.warn('[api] session rejected (401); stored credentials cleared');
  }
}

export const api: ApiClient = createApiClient({
  baseUrl: getApiBaseUrl(),
  storage: createAsyncStorage(AsyncStorage),
  onUnauthorized: handleUnauthorized,
});

/**
 * Bearer token for the few call sites that still build requests by hand.
 *
 * Prefer the typed resources on `api`, which attach this automatically. This
 * exists so migration can proceed incrementally without leaving a screen
 * half-converted.
 *
 * @returns The stored JWT, or null when signed out.
 */
export function getAccessToken(): Promise<string | null> {
  return api.auth.getToken();
}
