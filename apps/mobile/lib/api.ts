/**
 * Single source of truth for backend and web URLs in the mobile app.
 *
 * WHY THIS EXISTS
 *   Nine files each carried their own copy of
 *   `process.env.EXPO_PUBLIC_API_URL || 'https://www.partyhause.com'`, and
 *   `lib/email.ts` separately hardcoded `https://partyhause.netlify.app`.
 *   Both defaults are dead: Netlify deployment was discontinued, and
 *   www.partyhause.com still resolves to a container app in an environment
 *   that no longer exists. Every network call in the shipped app therefore
 *   failed. A store reviewer opening the app sees nothing load, which is an
 *   automatic rejection under Apple Guideline 2.1.
 *
 *   Duplicated configuration is why that went unnoticed for so long: fixing
 *   one call site fixed nothing. There is now exactly one place to change.
 *
 * BUILD-TIME, NOT RUNTIME
 *   EXPO_PUBLIC_* values are inlined by Metro when the bundle is built. A
 *   store binary carries whatever was set at build time, so the default below
 *   must be correct on its own.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Live production API.
 *
 * Replace with https://api.partyhause.com once that hostname is bound to the
 * API container app. Until then this is the only address that answers; the
 * apex domain has no A record and www points at a deleted deployment.
 */
const PRODUCTION_API_URL =
  'https://ca-api-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io';

/** Live production web app, used to build shareable invitation links. */
const PRODUCTION_WEB_URL =
  'https://ca-web-partyhause-gipkzrenusqpy.calmtree-5b646dc8.eastus2.azurecontainerapps.io';

/**
 * Expo Go cannot reach a developer machine's localhost, so it must always use
 * production. Simulators and emulators each need a different loopback alias.
 */
const isExpoGo = Constants.appOwnership === 'expo';

/** Host that reaches the developer machine from each local runtime. */
const LOCAL_API_HOST = Platform.select({
  ios: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
}) as string;

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

/**
 * Resolve the API origin.
 *
 * Order: an explicit EXPO_PUBLIC_API_URL always wins, so CI and EAS profiles
 * can retarget without a code change. Otherwise production, except in a local
 * development build where the loopback host is used.
 *
 * @returns Origin with no trailing slash, for example `https://api.example.com`.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);
  if (isExpoGo || !__DEV__) return PRODUCTION_API_URL;
  return LOCAL_API_HOST;
}

/**
 * Resolve the web origin used for user-facing links (invitations, deep links).
 *
 * @returns Origin with no trailing slash.
 */
export function getWebBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);
  if (isExpoGo || !__DEV__) return PRODUCTION_WEB_URL;
  return 'http://localhost:5173';
}

/**
 * Build a fully qualified API URL.
 *
 * @param path Path beginning with `/`, for example `/api/events`.
 * @param query Optional parameters; null and undefined values are omitted.
 * @returns Absolute URL.
 *
 * @example
 *   apiUrl('/api/guests', { eventId: id })
 *   // https://.../api/guests?eventId=abc
 */
export function apiUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  const base = `${getApiBaseUrl()}${normalised}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Public link to a guest's invitation page on the web app.
 *
 * @param eventId Event identifier.
 * @param guestId Guest identifier.
 * @returns Absolute URL suitable for sharing.
 */
export function invitationUrl(eventId: string, guestId: string): string {
  return `${getWebBaseUrl()}/event/${eventId}/guest/${guestId}`;
}
