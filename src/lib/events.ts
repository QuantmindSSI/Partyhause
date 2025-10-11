import { supabase } from './supabase';
import type { Event, Guest } from '@/store/usePartyStore';

export const eventService = {
  // Fetch all events for the current user
  getUserEvents: async (userId: string): Promise<Event[]> => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Ensure backward compatibility for events without new fields
      return events.map(event => ({
        ...event,
        start_date: event.start_date || event.event_date,
        end_date: event.end_date || event.event_date,
        event_type: event.event_type || 'single_day'
      }));
    } catch (error) {
  // ...removed bloatware error log...
      return [];
    }
  },

  // Create a new event
  createEvent: async (event: Omit<Event, 'id'>): Promise<Event | null> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  // ...removed bloatware error log...
      return null;
    }
  },

  // Update an event
  updateEvent: async (id: string, updates: Partial<Event>): Promise<Event | null> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  // ...removed bloatware error log...
      return null;
    }
  },

  // Delete an event
  deleteEvent: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
  // ...removed bloatware error log...
      return false;
    }
  },

  // Get event guests
  getEventGuests: async (eventId: string): Promise<Guest[]> => {
    try {
      const { data: guests, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return guests;
    } catch (error) {
  // ...removed bloatware error log...
      return [];
    }
  },

  // Get single event by id
  getEventById: async (id: string): Promise<Event | null> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      // Ensure backward compatibility for events without new fields
      return {
        ...data,
        start_date: data.start_date || data.event_date,
        end_date: data.end_date || data.event_date,
        event_type: data.event_type || 'single_day'
      };
    } catch (error) {
      return null;
    }
  },

  // Add guest to event
  addGuest: async (guest: Omit<Guest, 'id'>): Promise<Guest | null> => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([guest])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  // ...removed bloatware error log...
      return null;
    }
  },

  // Update guest
  updateGuest: async (id: string, updates: Partial<Guest>): Promise<Guest | null> => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  // ...removed bloatware error log...
      return null;
    }
  },

  // Remove guest
  removeGuest: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
  // ...removed bloatware error log...
      return false;
    }
  }
};
