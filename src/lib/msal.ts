// Type-only imports — erased at build. The runtime module is loaded lazily
// via dynamic import() the first time MSAL is actually used, keeping
// @azure/msal-browser (~300 kB) out of the entry bundle entirely while the
// Entra CIAM rollout is gated behind env vars.
import type {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  SilentRequest,
} from '@azure/msal-browser';
import { msalConfig, msalScopes, isMsalConfigured } from './msal-config';

/**
 * MSAL client singleton + helper functions.
 *
 * When MSAL is not configured (env vars missing), all functions are no-ops
 * that return null so callers can fall back to the JWT auth flow.
 */

let msalInstance: PublicClientApplication | null = null;
let instancePromise: Promise<PublicClientApplication | null> | null = null;
let redirectHandled = false;

async function getInstance(): Promise<PublicClientApplication | null> {
  if (!isMsalConfigured || !msalConfig) return null;
  if (msalInstance) return msalInstance;

  if (!instancePromise) {
    instancePromise = (async () => {
      try {
        const { PublicClientApplication: MsalClient } = await import('@azure/msal-browser');
        const instance = new MsalClient(msalConfig);
        // Handle the redirect promise returned from login/logout redirects.
        // Must be called once on app initialization.
        if (!redirectHandled) {
          redirectHandled = true;
          instance
            .handleRedirectPromise()
            .then((response: AuthenticationResult | null) => {
              if (response) {
                instance.setActiveAccount(response.account);
              }
            })
            .catch((err) => {
              console.warn('MSAL handleRedirectPromise error:', err);
            });
        }
        msalInstance = instance;
        return instance;
      } catch (err) {
        console.error('MSAL initialization failed:', err);
        // Allow a later retry rather than caching the failure forever.
        instancePromise = null;
        return null;
      }
    })();
  }

  return instancePromise;
}

/** Returns true if MSAL env vars are set and the client can be used. */
export function isMsalReady(): boolean {
  return isMsalConfigured;
}

/** Triggers a redirect-based login. */
export async function msalLogin(): Promise<void> {
  const instance = await getInstance();
  if (!instance) return;
  try {
    await instance.loginRedirect({
      scopes: msalScopes,
      prompt: 'select_account',
    });
  } catch (err) {
    console.error('MSAL loginRedirect error:', err);
  }
}

/** Clears the MSAL cache and redirects to logout. */
export async function msalLogout(): Promise<void> {
  const instance = await getInstance();
  if (!instance) return;
  const account = instance.getActiveAccount();
  try {
    await instance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri:
        typeof window !== 'undefined' ? window.location.origin : '/',
    });
  } catch (err) {
    console.error('MSAL logoutRedirect error:', err);
  }
}

/** Gets the current logged-in account, or null. */
export async function msalGetAccount(): Promise<AccountInfo | null> {
  const instance = await getInstance();
  if (!instance) return null;
  const active = instance.getActiveAccount();
  if (active) return active;
  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    instance.setActiveAccount(accounts[0]);
    return accounts[0];
  }
  return null;
}

/**
 * Gets an access token. Tries silent acquisition first, then falls back to
 * a redirect. Returns null if MSAL is not configured or no account is signed in.
 */
export async function msalGetToken(): Promise<string | null> {
  const instance = await getInstance();
  if (!instance) return null;
  const account = await msalGetAccount();
  if (!account) return null;

  const silentRequest: SilentRequest = {
    scopes: msalScopes,
    account,
  };

  try {
    const response = await instance.acquireTokenSilent(silentRequest);
    return response.accessToken || response.idToken || null;
  } catch (err) {
    // Silent failed — fall back to redirect.
    try {
      await instance.acquireTokenRedirect({
        scopes: msalScopes,
        account,
      });
      // After redirect, the page reloads; return null in the meantime.
      return null;
    } catch (redirectErr) {
      console.warn('MSAL acquireTokenRedirect error:', redirectErr);
      return null;
    }
  }
}

/** Re-exported for convenience. */
export { isMsalConfigured };
