// Add global type for cleanup
declare global {
  interface Window {
    __partyhausCleanupRealtime?: () => void;
  }
}
import { useEffect } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Event, Guest } from '@/store/usePartyStore';

export const useRealtimeSubscriptions = (eventId?: string) => {
  const { setGuests, addGuest, updateGuest, setEvents, user } = usePartyStore();

  useEffect(() => {
    if (!user) return;

    let eventsChannel: RealtimeChannel;
    let guestsChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Subscribe to events changes (only update affected event)
      eventsChannel = supabase
        .channel('events-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: `host_id=eq.${user.id}`,
          },
          (payload) => {
            const currentEvents = usePartyStore.getState().events;
            if (payload.eventType === 'INSERT') {
              setEvents([...currentEvents, payload.new as Event]);
            } else if (payload.eventType === 'UPDATE') {
              setEvents(currentEvents.map(e => e.id === payload.new.id ? payload.new as Event : e));
            } else if (payload.eventType === 'DELETE') {
              setEvents(currentEvents.filter(e => e.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Subscribe to guests changes if we have an eventId
      if (eventId) {
        guestsChannel = supabase
          .channel('guests-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'guests',
              filter: `event_id=eq.${eventId}`,
            },
            (payload) => {
              const currentGuests = usePartyStore.getState().guests;
              if (payload.eventType === 'INSERT') {
                addGuest(payload.new as Guest);
              } else if (payload.eventType === 'UPDATE') {
                updateGuest(payload.new.id, payload.new as Guest);
              } else if (payload.eventType === 'DELETE') {
                setGuests(currentGuests.filter(g => g.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Initial fetch of guests
        const { data: guests } = await supabase
          .from('guests')
          .select('*')
          .eq('event_id', eventId);
        
        if (guests) setGuests(guests as Guest[]);
      }
    };

    setupSubscriptions();

    // Expose a global cleanup for logout
    window.__partyhausCleanupRealtime = () => {
      eventsChannel?.unsubscribe();
      guestsChannel?.unsubscribe();
    };

    return () => {
      eventsChannel?.unsubscribe();
      guestsChannel?.unsubscribe();
      if (window.__partyhausCleanupRealtime) {
        window.__partyhausCleanupRealtime = undefined;
      }
    };
  }, [user, eventId, setEvents, setGuests, addGuest, updateGuest]);
};
