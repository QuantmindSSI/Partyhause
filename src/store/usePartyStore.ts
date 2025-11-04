import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { eventService } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type { TimelineBlock } from '@/features/timeline/types';

export interface User {
  id: string;
  email: string;
  name?: string;
  user_metadata?: {
    name?: string;
  };
}

export interface Event {
  id: string;
  host_id: string;
  name: string;
  description?: string;
  // Legacy field - maintained for backward compatibility
  date?: string;
  // New multi-day support fields
  start_date: string;
  end_date: string;
  event_type: 'single_day' | 'multi_day';
  location?: string;
  max_guests?: number;
  is_public: boolean;
  invite_image_url?: string;
  // Template and customization data
  template_type?: string;
  template_data?: Record<string, any>;
  timeline_blocks?: TimelineBlock[];
  spotify_playlist_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'no_show';
  plus_ones: number;
  special_requirements?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PartyState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPage: 'auth' | 'dashboard' | 'create-event' | 'event-management' | 'qr-scanner' | 'party-culture-blog' | 'games' | string;
  events: Event[];
  currentEvent: Event | null;
  guests: Guest[];
  loadedEventIds: Set<string>;
  fetchingEventId: string | null;
  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  setEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => Promise<void>;
  setGuests: (guests: Guest[]) => void;
  addGuest: (guest: Guest) => void;
  removeGuest: (guestId: string) => void;
  updateGuest: (guestId: string, updates: Partial<Guest>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentPage: 'auth',
      events: [],
      currentEvent: null,
      guests: [],
      loadedEventIds: new Set<string>(),
      fetchingEventId: null,
      isLoading: false,

      setUser: (user) => {
        if (user) {
          const normalizedUser = {
            id: user.id,
            email: user.email ?? '',
            user_metadata: user.user_metadata || {},
            name: user.user_metadata?.name || user.name || user.email || 'User'
          };

          set({
            user: normalizedUser,
            isAuthenticated: true,
            isLoading: false
          });

              const loadEvents = async () => {
            try {
              const events = await eventService.getUserEvents(user.id);
                  set((state) => {
                    if (state.user?.id !== user.id) return state;

                    // If a currentEvent is already selected by the user and it exists in the newly
                    // loaded events, keep it. Otherwise, default to the first event if available.
                    const existingCurrentId = state.currentEvent?.id;
                    const hasExistingCurrent = existingCurrentId && events.some(e => e.id === existingCurrentId);

                    const newCurrent = hasExistingCurrent ? state.currentEvent : (events.length > 0 ? events[0] : null);

                    return { events, currentEvent: newCurrent, isLoading: false };
                  });
            } catch (error) {
              console.warn('Failed to load user events:', error);
              set((state) => ({ ...state, isLoading: false }));
            }
          };

          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(loadEvents);
          } else {
            setTimeout(loadEvents, 100);
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            events: [],
            currentEvent: null,
            guests: [],
            isLoading: false,
            loadedEventIds: new Set<string>()
          });
        }
      },

      setCurrentPage: (page) => {
        if (get().currentPage !== page) set({ currentPage: page });
      },

      setEvents: (events) => set((state) => {
        // Preserve the currently selected event when possible. Important safety:
        // - If the user already has a currentEvent selected and it still appears in the
        //   incoming events list, keep it.
        // - If there is no currentEvent selected, DO NOT automatically select the first
        //   event here. Previously this could cause background event refreshes to change
        //   the user's selection unexpectedly. Leave currentEvent null and let the UI
        //   or explicit user action pick an event.
        const currentId = state.currentEvent?.id;
        const currentStillPresent = currentId && events.some(e => e.id === currentId);
        return {
          events,
          // If the previously selected event is still present, keep it.
          // Otherwise clear currentEvent to avoid pointing at a stale/removed event.
          currentEvent: currentStillPresent ? state.currentEvent : null
        };
      }),

      setCurrentEvent: async (event) => {
        const state = get();

        console.log('🔎 setCurrentEvent called with id=', event?.id);
        console.log('    currentEvent id=', state.currentEvent?.id, 'fetchingEventId=', state.fetchingEventId);
        console.log('    loadedEventIds=', Array.from(state.loadedEventIds));

        if (!event) {
          console.log('    setCurrentEvent: clearing currentEvent');
          set({ currentEvent: null, guests: [] });
          return;
        }

        if (state.currentEvent?.id === event.id && state.loadedEventIds.has(event.id)) {
          console.log('    setCurrentEvent: early return (already current and loaded)', event.id);
          return;
        }

        if (state.fetchingEventId === event.id) {
          console.log('    setCurrentEvent: early return (already fetching)', event.id);
          return;
        }

        console.log('    setCurrentEvent: proceeding to set and fetch guests for', event.id);
        set({ currentEvent: event, fetchingEventId: event.id, isLoading: true });

        try {
          const guests = await eventService.getEventGuests(event.id);
          set((s) => ({
            ...s,
            guests,
            loadedEventIds: new Set([...s.loadedEventIds, event.id]),
            fetchingEventId: null,
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to load event guests:', error);
          set((s) => ({
            ...s,
            guests: [],
            fetchingEventId: null,
            isLoading: false
          }));
        }
      },

      setGuests: (guests) => set({ guests }),
      addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
      removeGuest: (guestId) => set((state) => ({ guests: state.guests.filter(g => g.id !== guestId) })),
      updateGuest: (guestId, updates) => set((state) => ({
        guests: state.guests.map(guest => 
          guest.id === guestId ? { ...guest, ...updates } : guest
        )
      })),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          currentPage: 'auth',
          events: [],
          currentEvent: null,
          guests: [],
          isLoading: false,
          loadedEventIds: new Set<string>()
        });
        
        supabase.auth.signOut().catch(e => {
          console.warn('Logout: Supabase sign out failed:', e);
        });
      },
    }),
    {
      name: 'party-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        events: state.events,
        currentEvent: state.currentEvent
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate store:', error);
          return;
        }
        
        if (state) {
          state.loadedEventIds = new Set<string>();
          state.fetchingEventId = null;
          state.isLoading = false;
          
          if (state.currentEvent && (!state.events || state.events.length === 0)) {
            state.currentEvent = null;
          }
        }
      }
    }
  )
);