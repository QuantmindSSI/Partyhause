import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type SilentRequest,
} from '@azure/msal-browser';
import { msalConfig, msalScopes, isMsalConfigured } from './msal-config';

/**
 * MSAL client singleton + helper functions.
 *
 * When MSAL is not configured (env vars missing), all functions are no-ops
 * that return null so callers can fall back to Supabase auth.
 */

let msalInstance: PublicClientApplication | null = null;
let redirectHandled = false;

function getInstance(): PublicClientApplication | null {
  if (!isMsalConfigured || !msalConfig) return null;
  if (!msalInstance) {
    try {
      msalInstance = new PublicClientApplication(msalConfig);
      // Handle the redirect promise returned from login/logout redirects.
      // Must be called once on app initialization.
      if (!redirectHandled) {
        redirectHandled = true;
        msalInstance
          .handleRedirectPromise()
          .then((response: AuthenticationResult | null) => {
            if (response) {
              msalInstance?.setActiveAccount(response.account);
            }
          })
          .catch((err) => {
            console.warn('MSAL handleRedirectPromise error:', err);
          });
      }
    } catch (err) {
      console.error('MSAL initialization failed:', err);
      msalInstance = null;
    }
  }
  return msalInstance;
}

// NOTE: Do NOT eagerly initialize MSAL at module load time. The initialization
// is deferred to the first call of getInstance() (lazy) so that if the CIAM
// tenant or user flow is not yet configured, the app doesn't crash on load.

/** Returns true if MSAL env vars are set and the client can be used. */
export function isMsalReady(): boolean {
  return isMsalConfigured;
}

/** Triggers a redirect-based login. */
export async function msalLogin(): Promise<void> {
  const instance = getInstance();
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
  const instance = getInstance();
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
export function msalGetAccount(): AccountInfo | null {
  const instance = getInstance();
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
  const instance = getInstance();
  if (!instance) return null;
  const account = msalGetAccount();
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
