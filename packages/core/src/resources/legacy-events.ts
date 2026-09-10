import type { ApiResponse, Transport } from '../http/transport';
import type { PartyEvent } from '../types';
import { unwrapList, unwrapOne } from './envelopes';

export interface EventStats {
  total_guests: number;
  guests_accepted: number;
  guests_declined: number;
  guests_pending: number;
  guests_checked_in: number;
  timeline_blocks: number;
  media_count: number;
}

export interface EventWithStats {
  event: PartyEvent;
  stats: EventStats;
}

export interface EventsResource {
  list(): Promise<ApiResponse<PartyEvent[]>>;
  get(id: string): Promise<ApiResponse<PartyEvent>>;
  getWithStats(id: string): Promise<ApiResponse<EventWithStats>>;
  create(input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  update(id: string, input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

/** Construct the legacy web-compatible event resource. */
export function createEventsResource(transport: Transport): EventsResource {
  return {
    list: () => unwrapList<PartyEvent>(
      transport.request('/api/events', { method: 'GET' }),
      'events',
    ),
    get: (id) => unwrapOne<PartyEvent>(
      transport.request(`/api/events/${encodeURIComponent(id)}`, { method: 'GET' }),
      'event',
    ),
    getWithStats: (id) => transport.request<EventWithStats>(
      `/api/events/${encodeURIComponent(id)}`,
      { method: 'GET' },
    ),
    create: (input) => unwrapOne<PartyEvent>(
      transport.request('/api/events', { method: 'POST', body: input }),
      'event',
    ),
    update: (id, input) => unwrapOne<PartyEvent>(
      transport.request(`/api/events/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
      'event',
    ),
    remove: (id) => transport.request<{ success: boolean }>(
      `/api/events/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),
  };
}
