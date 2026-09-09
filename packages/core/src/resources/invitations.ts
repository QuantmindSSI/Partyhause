import type { ApiResponse, Transport } from '../http/transport';
import type { MvpRsvpStatus } from './guests';

export type MvpInvitationDeliveryStatus =
  | 'not_sent'
  | 'queued'
  | 'accepted'
  | 'delivered'
  | 'bounced'
  | 'failed';

export interface MvpInvitationPreview {
  kind: 'fixed';
  subject: string;
  heading: string;
  eventName: string;
  hostName: string;
  start: string;
  end: string;
  timezone: string;
  location: string;
  message: string;
  actionLabel: string;
}

export interface MvpInvitationCandidate {
  guestId: string;
  name: string;
  email: string;
  rsvpStatus: MvpRsvpStatus;
  guestRevision: number;
  deliveryStatus: MvpInvitationDeliveryStatus;
  canSend: boolean;
}

export interface MvpInvitationsPage {
  event: {
    id: string;
    status: 'published';
    start: string;
    end: string;
  };
  preview: MvpInvitationPreview;
  candidates: MvpInvitationCandidate[];
}

export interface MvpInvitationSendItem {
  guestId: string;
  name: string;
  status: Exclude<MvpInvitationDeliveryStatus, 'not_sent'>;
  attempted: boolean;
  provider: 'acs';
  providerMessageId: string | null;
  errorCode: string | null;
}

export interface MvpInvitationSendResult {
  eventId: string;
  requestedCount: number;
  attemptedCount: number;
  results: MvpInvitationSendItem[];
}

export interface MvpInvitationsResource {
  getForEvent(eventId: string): Promise<ApiResponse<MvpInvitationsPage>>;
  send(
    eventId: string,
    guestIds: string[],
    idempotencyKey: string,
  ): Promise<ApiResponse<MvpInvitationSendResult>>;
}

/** Construct the fixed, host-only invitation resource used by the iOS MVP. */
export function createMvpInvitationsResource(transport: Transport): MvpInvitationsResource {
  return {
    getForEvent: (eventId) => transport.request<MvpInvitationsPage>(
      `/api/mvp/events/${encodeURIComponent(eventId)}/invitations`,
      { method: 'GET' },
    ),
    send: (eventId, guestIds, idempotencyKey) => transport.request<MvpInvitationSendResult>(
      `/api/mvp/events/${encodeURIComponent(eventId)}/invitations/send`,
      {
        method: 'POST',
        body: { guestIds },
        headers: { 'Idempotency-Key': idempotencyKey },
      },
    ),
  };
}
