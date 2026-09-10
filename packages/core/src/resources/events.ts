import type { ApiResponse, Transport } from '../http/transport';
import { unwrapList, unwrapOne } from './envelopes';

export type MvpEventStatus = 'draft' | 'published' | 'completed' | 'cancelled';

export interface MvpEvent {
  id: string;
  name: string;
  description: string | null;
  start: string;
  end: string;
  timezone: string;
  location: string;
  status: MvpEventStatus;
  privacy: 'private';
  maxGuests: 50;
  revision: number;
  publishedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MvpEventCreateInput {
  name: string;
  description: string | null;
  start: string;
  end: string;
  timezone: string;
  location: string;
}

interface MvpEventChanges {
  name?: string;
  description?: string | null;
  start?: string;
  end?: string;
  timezone?: string;
  location?: string;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type MvpEventUpdateInput = { expectedRevision: number } & AtLeastOne<MvpEventChanges>;

export interface MvpEventDeleteResult {
  deleted: true;
  eventId: string;
}

export interface MvpEventsResource {
  list(): Promise<ApiResponse<MvpEvent[]>>;
  get(id: string): Promise<ApiResponse<MvpEvent>>;
  create(input: MvpEventCreateInput, idempotencyKey: string): Promise<ApiResponse<MvpEvent>>;
  update(id: string, input: MvpEventUpdateInput): Promise<ApiResponse<MvpEvent>>;
  publish(id: string, expectedRevision: number, idempotencyKey: string): Promise<ApiResponse<MvpEvent>>;
  cancel(id: string, expectedRevision: number, idempotencyKey: string): Promise<ApiResponse<MvpEvent>>;
  remove(id: string, expectedRevision: number, idempotencyKey: string): Promise<ApiResponse<MvpEventDeleteResult>>;
}

function idempotencyHeaders(idempotencyKey: string): Record<string, string> {
  return { 'Idempotency-Key': idempotencyKey };
}

/** Construct the event resource used by the iOS MVP. */
export function createMvpEventsResource(transport: Transport): MvpEventsResource {
  return {
    list: () => unwrapList<MvpEvent>(
      transport.request('/api/mvp/events', { method: 'GET' }),
      'events',
    ),
    get: (id) => unwrapOne<MvpEvent>(
      transport.request(`/api/mvp/events/${encodeURIComponent(id)}`, { method: 'GET' }),
      'event',
    ),
    create: (input, idempotencyKey) => unwrapOne<MvpEvent>(
      transport.request('/api/mvp/events', {
        method: 'POST',
        body: input,
        headers: idempotencyHeaders(idempotencyKey),
      }),
      'event',
    ),
    update: (id, input) => unwrapOne<MvpEvent>(
      transport.request(`/api/mvp/events/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
      'event',
    ),
    publish: (id, expectedRevision, idempotencyKey) => unwrapOne<MvpEvent>(
      transport.request(`/api/mvp/events/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        body: { expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      }),
      'event',
    ),
    cancel: (id, expectedRevision, idempotencyKey) => unwrapOne<MvpEvent>(
      transport.request(`/api/mvp/events/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        body: { expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      }),
      'event',
    ),
    remove: (id, expectedRevision, idempotencyKey) => transport.request<MvpEventDeleteResult>(
      `/api/mvp/events/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        body: { expectedRevision },
        headers: idempotencyHeaders(idempotencyKey),
      },
    ),
  };
}
