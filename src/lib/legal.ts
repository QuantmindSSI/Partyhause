export const CURRENT_TERMS_VERSION = '2026-09-06';
export const CURRENT_PRIVACY_VERSION = '2026-09-06';
export const MINIMUM_ACCOUNT_AGE = 18;

export const LEGAL_URLS = {
  privacy: 'https://partyhause.com/privacy.html',
  terms: 'https://partyhause.com/terms.html',
  support: 'https://partyhause.com/support.html',
} as const;

export interface SignupConsent {
  ageEligible: true;
  termsVersion: typeof CURRENT_TERMS_VERSION;
  privacyVersion: typeof CURRENT_PRIVACY_VERSION;
}
