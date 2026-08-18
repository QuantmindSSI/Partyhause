// src/hooks/use-realtime.ts
//
// Realtime subscriptions via Azure Web PubSub (replaces Supabase Realtime).
//
// On mount the hook calls GET /api/realtime/negotiate to obtain a Web PubSub
// connection URL, then connects with a NATIVE WebSocket using the
// `json.webpubsub.azure.v1` subprotocol. The server broadcasts JSON envelopes
// `{ event, data }` via sendToAll (server/lib/pubsub.ts); the subprotocol
// wraps them as `{ type: 'message', from: 'server', dataType: 'json', data }`.
//
// Handled events:
//   'event-updated'    -> refetch the user's events list
//   'guest-updated'    -> refetch guests for the current event
//   'poll-updated'     -> (forwarded; consumers can refetch polls)
//   'timeline-updated' -> (forwarded; consumers can refetch timeline)
//
// Failure model (all paths degrade to polling — never to a dead UI):
//   - negotiate unavailable/unconfigured  -> polling
//   - socket errors/closes                -> bounded exponential backoff
//     reconnects (MAX_RECONNECT_ATTEMPTS), polling is active the whole time
//     the socket is down, and permanently once attempts are exhausted.

// Add global type for cleanup
declare global {
  interface Window {
    __partyhausCleanupRealtime?: () => void;
  }
}

import { useEffect, useRef } from 'react';
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

const WEBPUBSUB_SUBPROTOCOL = 'json.webpubsub.azure.v1';
const POLL_INTERVAL_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 8; // bounded: ~1s,2s,4s,...,30s capped
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export const useRealtimeSubscriptions = (eventId?: string) => {
  const { setGuests, addGuest, updateGuest, setEvents, user } = usePartyStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

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

    const startPolling = () => {
      if (cancelled || pollingRef.current) return;
      if (!eventId) return;
      pollingRef.current = setInterval(() => {
        refreshGuests(eventId);
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const negotiate = async (): Promise<string | null> => {
      try {
        const { data, error } = await apiGet<NegotiateResponse>('/api/realtime/negotiate');
        if (!error && data?.url) return data.url;
      } catch (err) {
        console.warn('[realtime] negotiate failed:', err);
      }
      return null;
    };

    const scheduleReconnect = (attempt: number) => {
      if (cancelled) return;
      // While the socket is down, poll so the UI keeps updating.
      startPolling();
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        console.warn('[realtime] max reconnect attempts reached — staying on polling');
        return;
      }
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * 2 ** (attempt - 1),
        RECONNECT_MAX_DELAY_MS,
      );
      reconnectTimerRef.current = setTimeout(async () => {
        if (cancelled) return;
        // Re-negotiate: the previous access token may have expired.
        const freshUrl = await negotiate();
        if (cancelled) return;
        if (freshUrl) {
          connectSocket(freshUrl, attempt);
        } else {
          scheduleReconnect(attempt + 1);
        }
      }, delay);
    };

    const connectSocket = (url: string, attempt: number) => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url, WEBPUBSUB_SUBPROTOCOL);
      } catch (err) {
        console.warn('[realtime] WebSocket construction failed:', err);
        scheduleReconnect(attempt + 1);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        // Live channel established — polling is redundant while connected.
        stopPolling();
      };

      ws.onmessage = (msg: MessageEvent) => {
        try {
          const frame = JSON.parse(String(msg.data));
          // Native subprotocol frames: system frames have type 'system';
          // data frames are { type: 'message', from, dataType, data }.
          // A raw-WebSocket (no subprotocol) delivery would be the envelope
          // itself — handle both shapes.
          const envelope = frame?.type === 'message' ? frame.data : frame;
          if (envelope && typeof envelope.event === 'string') {
            handleEvent(envelope.event as RealtimeEvent, envelope.data);
          }
        } catch {
          // Non-JSON frame — ignore.
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!cancelled) {
          scheduleReconnect(attempt + 1);
        }
      };

      ws.onerror = () => {
        // onclose fires after onerror; reconnection is handled there.
        try {
          ws.close();
        } catch {
          // Already closing/closed.
        }
      };
    };

    const setup = async () => {
      // 1. Negotiate a Web PubSub connection URL.
      const negotiateUrl = await negotiate();

      if (cancelled) return;

      if (!negotiateUrl) {
        // Web PubSub not configured / unavailable — fall back to light polling
        // for guests so the UI still updates without a manual refresh.
        startPolling();
        return;
      }

      // 2. Connect with a native WebSocket (json.webpubsub.azure.v1).
      connectSocket(negotiateUrl, 0);

      // 3. Initial fetch of guests for the current event (mirrors the old hook).
      const initialEventId = eventId || usePartyStore.getState().currentEvent?.id;
      if (initialEventId) {
        refreshGuests(initialEventId);
      }
    };

    setup();

    const cleanup = () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      stopPolling();
    };

    // Expose a global cleanup for logout.
    window.__partyhausCleanupRealtime = cleanup;

    return () => {
      cleanup();
      if (window.__partyhausCleanupRealtime === cleanup) {
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
