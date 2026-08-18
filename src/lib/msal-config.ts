// Type-only import — erased at build time so @azure/msal-browser stays out
// of the bundle until src/lib/msal.ts dynamically imports it.
import type { Configuration } from '@azure/msal-browser';

/**
 * MSAL configuration for Microsoft Entra External ID (CIAM).
 *
 * Env vars (build-time, Vite):
 *   VITE_ENTRA_TENANT_ID      — CIAM tenant ID
 *   VITE_ENTRA_SPA_CLIENT_ID  — SPA app registration client ID
 *   VITE_ENTRA_POLICY         — User flow name, e.g. "B2C_1_susi"
 *
 * If any of these are unset, `msalConfig` is exported as `null` so the app
 * can gracefully fall back to Supabase auth.
 */

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_ENTRA_SPA_CLIENT_ID as string | undefined;
const policy = import.meta.env.VITE_ENTRA_POLICY as string | undefined;

export const isMsalConfigured = Boolean(tenantId && clientId && policy);

/** Scopes requested for the access token. */
export const msalScopes = ['openid', 'profile', 'email', 'offline_access'];

/** Authority URL for CIAM: https://<tenantId>.ciamlogin.com/<tenantId>/<policy> */
export const msalAuthority = isMsalConfigured
  ? `https://${tenantId}.ciamlogin.com/${tenantId}/${policy}`
  : '';

export const msalConfig: Configuration | null = isMsalConfigured
  ? {
      auth: {
        clientId: clientId as string,
        authority: msalAuthority,
        // Use the current origin so it works for both localhost:5173 and the
        // deployed web app URL (must be registered in the app registration).
        redirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
        postLogoutRedirectUri:
          typeof window !== 'undefined' ? window.location.origin : '/',
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
    }
  : null;
