import type { ApiResponse, Transport } from '../http/transport';
import type { Guest } from '../types';
import { unwrapList, unwrapOne } from './envelopes';

export interface GuestUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'maybe';
  plusOnes?: number;
  dietaryRestrictions?: string;
  customFields?: Record<string, unknown>;
  checkedIn?: boolean;
  email_status?: string;
  last_email_sent_at?: string;
  email_log_id?: string | null;
}

export interface GuestCreateInput {
  name: string;
  email?: string;
  phone?: string;
  plusOnes?: number;
  dietaryRestrictions?: string[];
  ticketType?: string;
  customFields?: Record<string, unknown>;
  role?: string;
}

export interface GuestStats {
  total: number;
  accepted: number;
  declined: number;
  maybe: number;
  pending: number;
  checkedIn: number;
}

export interface GuestsPage {
  guests: Guest[];
  stats: GuestStats;
}

export interface GuestsResource {
  listForEvent(eventId: string): Promise<ApiResponse<Guest[]>>;
  listForEventWithStats(eventId: string): Promise<ApiResponse<GuestsPage>>;
  create(eventId: string, guest: GuestCreateInput): Promise<ApiResponse<Guest>>;
  createMany(eventId: string, guests: GuestCreateInput[]): Promise<ApiResponse<Guest[]>>;
  update(id: string, input: GuestUpdateInput): Promise<ApiResponse<Guest>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

function normalizeLegacyRsvp(guest: Guest): Guest {
  return guest.rsvp_status === 'confirmed'
    ? { ...guest, rsvp_status: 'accepted' }
    : guest;
}

async function normalizedGuestList(
  response: Promise<ApiResponse<unknown>>,
): Promise<ApiResponse<Guest[]>> {
  const result = await unwrapList<Guest>(response, 'guests');
  return result.data
    ? { data: result.data.map(normalizeLegacyRsvp), error: null }
    : result;
}

/** Construct the legacy web-compatible guest resource. */
export function createGuestsResource(transport: Transport): GuestsResource {
  return {
    listForEvent: (eventId) => normalizedGuestList(
      transport.request('/api/guests', { method: 'GET', query: { eventId } }),
    ),
    listForEventWithStats: async (eventId) => {
      const result = await transport.request<GuestsPage>(
        '/api/guests',
        { method: 'GET', query: { eventId } },
      );
      return result.data
        ? {
            data: { ...result.data, guests: result.data.guests.map(normalizeLegacyRsvp) },
            error: null,
          }
        : result;
    },
    create: async (eventId, guest) => {
      const response = await normalizedGuestList(
        transport.request('/api/guests', { method: 'POST', body: { eventId, guests: [guest] } }),
      );
      if (response.error) return { data: null, error: response.error };
      const first = (response.data ?? [])[0];
      return first
        ? { data: first, error: null }
        : { data: null, error: { message: 'Guest was created but the server returned no row' } };
    },
    createMany: (eventId, guests) => normalizedGuestList(
      transport.request('/api/guests', { method: 'POST', body: { eventId, guests } }),
    ),
    update: async (id, input) => {
      const result = await unwrapOne<Guest>(
        transport.request(`/api/guests/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
        'guest',
      );
      return result.data
        ? { data: normalizeLegacyRsvp(result.data), error: null }
        : result;
    },
    remove: (id) => transport.request<{ success: boolean }>(
      `/api/guests/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),
  };
}
