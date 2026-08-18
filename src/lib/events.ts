import { apiGet, apiPost, apiPut, apiDelete } from './api-client';
import type { Event, Guest } from '@/store/usePartyStore';

// Normalize an event coming from the API so it matches the shape the UI
// expects (backward-compat for events missing the new multi-day fields).
const normalizeEvent = (event: any): Event => ({
  ...event,
  description: event.description ?? null,
  start_date: event.start_date || event.event_date || event.date,
  end_date: event.end_date || event.event_date || event.date,
  event_type: event.event_type || 'single_day',
});

export const eventService = {
  // Fetch all events for the current user
  getUserEvents: async (userId: string): Promise<Event[]> => {
    try {
      const { data, error } = await apiGet<{ events?: any[] }>('/api/events');

      if (error) {
        // No fallback query needed for the API; just surface an empty list.
        return [];
      }

      const events = data?.events || [];
      // The API already filters to events the user hosts / co-hosts / is invited
      // to, so we don't need to filter by host_id here. We still keep the param
      // for signature compatibility.
      void userId;

      return events.map(normalizeEvent);
    } catch (error) {
      return [];
    }
  },

  // Create a new event
  createEvent: async (event: Omit<Event, 'id'>): Promise<Event | null> => {
    try {
      const { data, error } = await apiPost<{ event?: any; success?: boolean }>('/api/events', event);
      if (error) throw error;
      const created = data?.event;
      return created ? normalizeEvent(created) : null;
    } catch (error) {
      return null;
    }
  },

  // Update an event
  updateEvent: async (id: string, updates: Partial<Event>): Promise<Event | null> => {
    try {
      const { data, error } = await apiPut<{ event?: any; success?: boolean }>(`/api/events/${id}`, updates);
      if (error) throw error;
      const updated = data?.event;
      return updated ? normalizeEvent(updated) : null;
    } catch (error) {
      return null;
    }
  },

  // Delete an event
  deleteEvent: async (id: string): Promise<boolean> => {
    try {
      const { error } = await apiDelete(`/api/events/${id}`);
      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get event guests
  getEventGuests: async (eventId: string): Promise<Guest[]> => {
    try {
      const { data, error } = await apiGet<{ guests?: any[]; stats?: any }>(
        `/api/guests?eventId=${encodeURIComponent(eventId)}`,
      );
      if (error) throw error;
      return data?.guests || [];
    } catch (error) {
      return [];
    }
  },

  // Get single event by id
  getEventById: async (id: string): Promise<Event | null> => {
    try {
      const { data, error } = await apiGet<{ event?: any; stats?: any }>(`/api/events/${id}`);
      if (error) throw error;
      const event = data?.event;
      if (!event) return null;
      return normalizeEvent(event);
    } catch (error) {
      return null;
    }
  },

  // Add guest to event
  addGuest: async (guest: Omit<Guest, 'id'>): Promise<Guest | null> => {
    try {
      // The API expects { eventId, guests: [...] } (bulk import shape).
      const payload = {
        eventId: guest.event_id,
        guests: [
          {
            name: guest.name,
            // guests.email is NOT NULL server-side; '' means "no email".
            email: guest.email || '',
            phone: guest.phone || null,
            plusOnes: guest.plus_ones ?? 0,
          },
        ],
      };
      const { data, error } = await apiPost<{ guests?: any[]; success?: boolean }>('/api/guests', payload);
      if (error) throw error;
      const created = data?.guests?.[0];
      return created || null;
    } catch (error) {
      return null;
    }
  },

  // Update guest
  updateGuest: async (id: string, updates: Partial<Guest>): Promise<Guest | null> => {
    try {
      // Map UI field names to the API's expected body shape.
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.email !== undefined) body.email = updates.email;
      if (updates.phone !== undefined) body.phone = updates.phone;
      if (updates.plus_ones !== undefined) body.plusOnes = updates.plus_ones;
      // Canonical API fields
      if (updates.rsvp_status !== undefined) body.rsvpStatus = updates.rsvp_status;
      if (updates.checked_in !== undefined) body.checkedIn = updates.checked_in;
      // Legacy `status` vocabulary: 'checked_in' is a check-in flag, not an
      // RSVP value; 'confirmed' maps to the canonical 'accepted'.
      if (updates.status !== undefined && body.rsvpStatus === undefined) {
        if (updates.status === 'checked_in') {
          if (body.checkedIn === undefined) body.checkedIn = true;
        } else if (updates.status === 'confirmed') {
          body.rsvpStatus = 'accepted';
        } else if (updates.status === 'pending') {
          body.rsvpStatus = 'pending';
        }
        // 'no_show' has no API equivalent — ignored.
      }
      if ((updates as any).is_checked_in !== undefined && body.checkedIn === undefined) {
        body.checkedIn = (updates as any).is_checked_in;
      }

      const { data, error } = await apiPut<{ guest?: any; success?: boolean }>(`/api/guests/${id}`, body);
      if (error) throw error;
      return data?.guest || null;
    } catch (error) {
      return null;
    }
  },

  // Remove guest
  removeGuest: async (id: string): Promise<boolean> => {
    try {
      const { error } = await apiDelete(`/api/guests/${id}`);
      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  },
};
