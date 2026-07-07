// src/hooks/use-realtime.ts
//
// Realtime subscriptions via Azure Web PubSub (replaces Supabase Realtime).
//
// On mount the hook calls GET /api/realtime/negotiate to obtain a Web PubSub
// connection URL, then connects with socket.io-client. It listens for the
// following server-broadcast events and refreshes the relevant store data:
//
//   'event-updated'    -> refetch the user's events list
//   'guest-updated'    -> refetch guests for the current event
//   'poll-updated'     -> (forwarded; consumers can refetch polls)
//   'timeline-updated' -> (forwarded; consumers can refetch timeline)
//
// If Web PubSub is not configured (the negotiate endpoint returns 503 / no
// url), the hook degrades to a no-op so the rest of the app keeps working.
// Reconnection is handled by socket.io-client's built-in retry logic.

// Add global type for cleanup
declare global {
  interface Window {
    __partyhausCleanupRealtime?: () => void;
  }
}

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';
import { apiGet } from '@/lib/api-client';
import { apiUrl } from '@/lib/apiBase';
import type { Event, Guest } from '@/store/usePartyStore';

// Server-broadcast event names. Keep in sync with server/lib/pubsub.ts calls.
type RealtimeEvent =
  | 'event-updated'
  | 'guest-updated'
  | 'poll-updated'
  | 'timeline-updated';

interface NegotiateResponse {
  url?: string;
  configured?: boolean;
}

export const useRealtimeSubscriptions = (eventId?: string) => {
  const { setGuests, addGuest, updateGuest, setEvents, user } = usePartyStore();
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let socket: Socket | null = null;

    const refreshEvents = async () => {
      const events = await eventService.getUserEvents(user.id);
      if (cancelled) return;
      setEvents(events as Event[]);
    };

    const refreshGuests = async (targetEventId: string) => {
      const guests = await eventService.getEventGuests(targetEventId);
      if (cancelled) return;
      setGuests(guests as Guest[]);
    };

    const handleEvent = (event: RealtimeEvent, payload?: any) => {
      const state = usePartyStore.getState();
      const currentEventId = eventId || state.currentEvent?.id;

      switch (event) {
        case 'event-updated': {
          // An event changed (create/update/delete). Refetch the list and, if
          // the affected event is the currently selected one, refresh guests.
          refreshEvents();
          if (payload?.id && payload.id === currentEventId) {
            refreshGuests(payload.id);
          }
          break;
        }
        case 'guest-updated': {
          // Guests for an event changed. Only refetch if it's the current event.
          const affectedEventId = payload?.eventId || payload?.event_id || currentEventId;
          if (affectedEventId) {
            refreshGuests(affectedEventId);
          }
          break;
        }
        case 'poll-updated':
        case 'timeline-updated':
          // Forwarded for consumers that subscribe to the store; no direct
          // store mutation here. Components reading polls/timeline should
          // refetch on receiving these (e.g. via a query invalidation).
          break;
      }
    };

    const setup = async () => {
      // 1. Negotiate a Web PubSub connection URL.
      let negotiateUrl: string | null = null;
      try {
        const { data, error } = await apiGet<NegotiateResponse>('/api/realtime/negotiate');
        if (!error && data?.url) {
          negotiateUrl = data.url;
        }
      } catch (err) {
        console.warn('[realtime] negotiate failed:', err);
      }

      if (cancelled || !negotiateUrl) {
        // Web PubSub not configured / unavailable — fall back to light polling
        // for guests so the UI still updates without a manual refresh.
        if (!cancelled && eventId) {
          pollingRef.current = setInterval(() => {
            refreshGuests(eventId);
          }, 30_000);
        }
        return;
      }

      // 2. Connect with socket.io-client using the negotiate URL.
      // The negotiate URL already contains the access token. We pass the
      // socket.io hub path so the service routes the connection to the
      // "partyhause" hub.
      socket = io(negotiateUrl, {
        path: '/clients/socketio/hubs/partyhause',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10_000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        // Connection established; nothing else to do — listeners below handle
        // inbound events.
      });

      socket.on('disconnect', (reason: string) => {
        console.warn('[realtime] disconnected:', reason);
      });

      socket.on('connect_error', (err: Error) => {
        console.warn('[realtime] connect_error:', err?.message);
      });

      // 3. Listen for server-broadcast events.
      const events: RealtimeEvent[] = [
        'event-updated',
        'guest-updated',
        'poll-updated',
        'timeline-updated',
      ];
      for (const e of events) {
        socket.on(e, (payload: any) => handleEvent(e, payload));
      }

      // 4. Initial fetch of guests for the current event (mirrors the old hook).
      const initialEventId = eventId || usePartyStore.getState().currentEvent?.id;
      if (initialEventId) {
        refreshGuests(initialEventId);
      }
    };

    setup();

    // Expose a global cleanup for logout.
    window.__partyhausCleanupRealtime = () => {
      cancelled = true;
      socket?.disconnect();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (window.__partyhausCleanupRealtime) {
        window.__partyhausCleanupRealtime = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, eventId, setEvents, setGuests, addGuest, updateGuest]);
};

// Re-export for callers that imported the hook under the shorter name.
export const useRealtime = useRealtimeSubscriptions;

// Helper kept for any external callers that build URLs manually.
export { apiUrl };
