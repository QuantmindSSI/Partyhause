import type { ApiResponse, Transport } from '../http/transport';
import type { MvpEventStatus } from './events';
import { unwrapList, unwrapOne } from './envelopes';

export type MvpRsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe';

export interface MvpGuest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  rsvpStatus: MvpRsvpStatus;
  rsvpRespondedAt: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface MvpGuestInput {
  name: string;
  email: string;
}

interface MvpGuestChanges {
  name?: string;
  email?: string;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type MvpGuestUpdateInput = { expectedRevision: number } & AtLeastOne<MvpGuestChanges>;

export interface MvpGuestStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  maybe: number;
  checkedIn: number;
}

export interface MvpGuestsPage {
  event: { id: string; status: MvpEventStatus; capacity: 50 };
  guests: MvpGuest[];
  stats: MvpGuestStats;
}

export interface MvpGuestBatchResult {
  guests: MvpGuest[];
  createdCount: number;
  existingCount: number;
}

export interface MvpGuestDeleteResult {
  deleted: true;
  guestId: string;
  eventId: string;
}

export interface MvpGuestsResource {
  listForEvent(eventId: string): Promise<ApiResponse<MvpGuest[]>>;
  listForEventWithStats(eventId: string): Promise<ApiResponse<MvpGuestsPage>>;
  get(id: string): Promise<ApiResponse<MvpGuest>>;
  create(eventId: string, guest: MvpGuestInput, idempotencyKey: string): Promise<ApiResponse<MvpGuest>>;
  createMany(eventId: string, guests: MvpGuestInput[], idempotencyKey: string): Promise<ApiResponse<MvpGuestBatchResult>>;
  update(id: string, input: MvpGuestUpdateInput): Promise<ApiResponse<MvpGuest>>;
  remove(id: string, expectedRevision: number, idempotencyKey: string): Promise<ApiResponse<MvpGuestDeleteResult>>;
  checkIn(id: string, expectedRevision: number, idempotencyKey: string): Promise<ApiResponse<MvpGuest>>;
  correctCheckIn(
    id: string,
    checkedIn: boolean,
    expectedRevision: number,
    idempotencyKey: string,
  ): Promise<ApiResponse<MvpGuest>>;
}

function idempotencyHeaders(idempotencyKey: string): Record<string, string> {
  return { 'Idempotency-Key': idempotencyKey };
}

/** Construct the guest and attendance resource used by the iOS MVP. */
export function createMvpGuestsResource(transport: Transport): MvpGuestsResource {
  return {
    listForEvent: (eventId) => unwrapList<MvpGuest>(
      transport.request(`/api/mvp/events/${encodeURIComponent(eventId)}/guests`, { method: 'GET' }),
      'guests',
    ),
    listForEventWithStats: (eventId) => transport.request<MvpGuestsPage>(
      `/api/mvp/events/${encodeURIComponent(eventId)}/guests`,
      { method: 'GET' },
    ),
    get: (id) => unwrapOne<MvpGuest>(
      transport.request(`/api/mvp/guests/${encodeURIComponent(id)}`, { method: 'GET' }),
      'guest',
    ),
    create: async (eventId, guest, idempotencyKey) => {
      const response = await transport.request<MvpGuestBatchResult>(
        `/api/mvp/events/${encodeURIComponent(eventId)}/guests`,
        { method: 'POST', body: guest, headers: idempotencyHeaders(idempotencyKey) },
      );
      if (response.error) return { data: null, error: response.error };
      const created = response.data?.guests[0];
      return created
        ? { data: created, error: null }
        : { data: null, error: { message: 'The server returned no guest', code: 'INVALID_RESPONSE' } };
    },
    createMany: (eventId, guests, idempotencyKey) => transport.request<MvpGuestBatchResult>(
      `/api/mvp/events/${encodeURIComponent(eventId)}/guests`,
      {
        method: 'POST',
        body: { guests },
        headers: idempotencyHeaders(idempotencyKey),
      },
    ),
    update: (id, input) => unwrapOne<MvpGuest>(
      transport.request(`/api/mvp/guests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
      'guest',
    ),
    remove: (id, expectedRevision, idempotencyKey) => transport.request<MvpGuestDeleteResult>(
      `/api/mvp/guests/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        body: { expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      },
    ),
    checkIn: (id, expectedRevision, idempotencyKey) => unwrapOne<MvpGuest>(
      transport.request(`/api/mvp/guests/${encodeURIComponent(id)}/check-in`, {
        method: 'POST',
        body: { expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      }),
      'guest',
    ),
    correctCheckIn: (id, checkedIn, expectedRevision, idempotencyKey) => unwrapOne<MvpGuest>(
      transport.request(`/api/mvp/guests/${encodeURIComponent(id)}/check-in/correction`, {
        method: 'POST',
        body: { checkedIn, expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      }),
      'guest',
    ),
  };
}
