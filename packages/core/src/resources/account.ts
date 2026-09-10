import type { ApiResponse, Transport } from '../http/transport';
import { unwrapOne } from './envelopes';

export type AccountDeletionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AccountLegalSummary {
  account: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  legal: {
    termsVersion: string;
    privacyVersion: string;
    effectiveDate: string;
    acceptedTermsVersion: string | null;
    acceptedPrivacyVersion: string | null;
    ageEligible: boolean;
    minimumAge: number;
    urls: {
      privacy: string;
      terms: string;
      support: string;
    };
  };
}

export interface AccountDeletion {
  receipt: string;
  status: AccountDeletionStatus;
  requestedAt: string;
  eraseBy: string;
  completedAt: string | null;
  confirmationExpiresAt: string | null;
  retryable: boolean;
}

export interface AccountResource {
  summary(): Promise<ApiResponse<AccountLegalSummary>>;
  createDeletionIntent(password: string): Promise<ApiResponse<AccountDeletion>>;
  confirmDeletion(receipt: string): Promise<ApiResponse<{ accepted: true; deletion: AccountDeletion }>>;
  deletionStatus(receipt: string): Promise<ApiResponse<AccountDeletion>>;
}

/** Create the account, legal, and permanent-deletion API surface for IOS-MVP-1. */
export function createAccountResource(transport: Transport): AccountResource {
  return {
    summary: () => transport.request<AccountLegalSummary>('/api/mvp/account', { method: 'GET' }),
    createDeletionIntent: (password) => unwrapOne<AccountDeletion>(
      transport.request('/api/mvp/account/deletion-intent', {
        method: 'POST',
        body: { password },
      }),
      'deletion',
    ),
    confirmDeletion: (receipt) =>
      transport.request<{ accepted: true; deletion: AccountDeletion }>('/api/mvp/account/deletion', {
        method: 'POST',
        body: { receipt, confirmation: 'DELETE' },
        anonymous: true,
      }),
    deletionStatus: (receipt) => unwrapOne<AccountDeletion>(
      transport.request(
        `/api/mvp/account/deletion/${encodeURIComponent(receipt)}`,
        { method: 'GET', anonymous: true },
      ),
      'deletion',
    ),
  };
}
