import type { ApiClientConfig } from './http/adapters';
export { createSecureStoreStorage } from './http/storage-adapters';
import { createTransport } from './http/transport';
import { createAuthResource } from './resources/auth';
import type { AuthResource } from './resources/auth';
import { createMvpEventsResource } from './resources/events';
import type { MvpEventsResource } from './resources/events';
import { createMvpGuestsResource } from './resources/guests';
import type { MvpGuestsResource } from './resources/guests';
import { createMvpInvitationsResource } from './resources/invitations';
import type { MvpInvitationsResource } from './resources/invitations';
import { createAccountResource } from './resources/account';
import type { AccountResource } from './resources/account';

export {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_URLS,
  MINIMUM_ACCOUNT_AGE,
} from './legal';
export type { SignupConsent } from './legal';

export type {
  MvpEvent,
  MvpEventCreateInput,
  MvpEventDeleteResult,
  MvpEventStatus,
  MvpEventUpdateInput,
  MvpEventsResource,
} from './resources/events';
export type {
  MvpGuest,
  MvpGuestBatchResult,
  MvpGuestDeleteResult,
  MvpGuestInput,
  MvpGuestStats,
  MvpGuestUpdateInput,
  MvpGuestsPage,
  MvpGuestsResource,
  MvpRsvpStatus,
} from './resources/guests';
export type {
  MvpInvitationCandidate,
  MvpInvitationDeliveryStatus,
  MvpInvitationPreview,
  MvpInvitationSendItem,
  MvpInvitationSendResult,
  MvpInvitationsPage,
  MvpInvitationsResource,
} from './resources/invitations';
export type {
  AccountDeletion,
  AccountDeletionStatus,
  AccountLegalSummary,
  AccountResource,
} from './resources/account';

/** The complete API surface permitted in the iOS MVP application. */
export interface MvpApiClient {
  auth: AuthResource;
  events: MvpEventsResource;
  guests: MvpGuestsResource;
  invitations: MvpInvitationsResource;
  account: AccountResource;
  baseUrl: string;
}

/** Create a collision-resistant retry key without requiring a platform package. */
export function createMvpIdempotencyKey(scope: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const entropy = randomUuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  return `${scope}:${entropy}`;
}

/**
 * Construct an API client containing only iOS MVP endpoint families.
 *
 * @param config Base URL and platform adapters for transport and authentication.
 * @returns Auth, event, guest, and invitation resources plus the normalized base URL.
 * @throws Error when the base URL is empty or the timeout is not positive.
 */
export function createMvpApiClient(config: ApiClientConfig): MvpApiClient {
  const transport = createTransport(config);
  return {
    auth: createAuthResource(transport),
    events: createMvpEventsResource(transport),
    guests: createMvpGuestsResource(transport),
    invitations: createMvpInvitationsResource(transport),
    account: createAccountResource(transport),
    baseUrl: transport.baseUrl,
  };
}
