/**
 * PartyHause WebMCP monitoring tools.
 *
 * Registers tools on the browser's Model Context (`navigator.modelContext`,
 * falling back to `document.modelContext`) so connected agents can observe
 * application state, API traffic, runtime errors, backend health and
 * performance. All tools are read-only except `navigate_to_page`.
 *
 * Sensitive data policy: auth tokens, request headers and request/response
 * bodies are never exposed. Guest lists are returned as aggregates only
 * (no names, emails or phone numbers).
 */

import { usePartyStore } from '@/store/usePartyStore';
import type { Event, Guest } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';
import { apiGet } from '@/lib/api-client';
import { getApiActivity, getRuntimeErrors, getMonitorStats } from './monitor';

/** Pages reachable through the catch-all state machine in App.tsx. */
const NAVIGABLE_PAGES = [
  'dashboard',
  'user-dashboard',
  'creator-dashboard',
  'vendor-dashboard',
  'my-tickets',
  'saved-events',
  'create-event',
  'event-management',
  'qr-scanner',
  'games',
  'settings',
  'feed',
  'explore',
  'templates',
  'profile',
  'party-culture-blog',
] as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function summarizeEvent(event: Event): Record<string, unknown> {
  return {
    id: event.id,
    name: event.name,
    event_type: event.event_type,
    start_date: event.start_date,
    end_date: event.end_date,
    location: event.location ?? null,
    is_public: event.is_public,
    max_guests: event.max_guests ?? null,
    created_at: event.created_at,
  };
}

/** Aggregate guest stats — intentionally no per-guest PII. */
function summarizeGuests(guests: Guest[]): Record<string, unknown> {
  const byRsvpStatus: Record<string, number> = {};
  let checkedIn = 0;
  let plusOnes = 0;
  for (const guest of guests) {
    const key = guest.rsvp_status || guest.status || 'pending';
    byRsvpStatus[key] = (byRsvpStatus[key] || 0) + 1;
    if (guest.checked_in || guest.status === 'checked_in') {
      checkedIn += 1;
    }
    plusOnes += guest.plus_ones || 0;
  }
  return { total: guests.length, checkedIn, plusOnes, byRsvpStatus };
}

function buildTools(): ModelContextToolDescriptor[] {
  return [
    {
      name: 'get_app_state',
      description:
        'Returns a snapshot of the PartyHause application state: authentication status, ' +
        'current user, active page, current event, loading flags and connectivity.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => {
        const state = usePartyStore.getState();
        return {
          status: 'success',
          authenticated: state.isAuthenticated,
          user: state.user
            ? {
                id: state.user.id,
                name: state.user.name ?? null,
                email: state.user.email,
                role: state.user.role ?? 'user',
              }
            : null,
          currentPage: state.currentPage,
          urlPath: window.location.pathname,
          isLoading: state.isLoading,
          online: navigator.onLine,
          eventCount: state.events.length,
          currentEvent: state.currentEvent ? summarizeEvent(state.currentEvent) : null,
          guestsLoadedForCurrentEvent: state.guests.length,
        };
      },
    },
    {
      name: 'get_events',
      description:
        "Lists the signed-in user's events (id, name, dates, type, location, visibility). " +
        'Set refresh=true to re-fetch from the API instead of reading the local store.',
      inputSchema: {
        type: 'object',
        properties: {
          refresh: {
            type: 'boolean',
            description: 'Re-fetch events from the backend before returning. Default false.',
          },
        },
      },
      execute: async (args) => {
        const state = usePartyStore.getState();
        if (!state.isAuthenticated || !state.user) {
          return { status: 'error', message: 'Not authenticated — no events available. Log in first.' };
        }
        let events = state.events;
        if (args.refresh === true) {
          events = await eventService.getUserEvents(state.user.id);
          usePartyStore.getState().setEvents(events);
        }
        return {
          status: 'success',
          source: args.refresh === true ? 'api' : 'store',
          count: events.length,
          events: events.map(summarizeEvent),
        };
      },
    },
    {
      name: 'get_event_details',
      description:
        'Returns full details for one event plus aggregated guest statistics ' +
        '(totals, RSVP breakdown, check-ins, plus-ones). No per-guest personal data is returned.',
      inputSchema: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The ID of the event to inspect.' },
        },
        required: ['event_id'],
      },
      execute: async (args) => {
        const eventId = args.event_id;
        if (typeof eventId !== 'string' || eventId.length === 0) {
          return { status: 'error', message: 'event_id (non-empty string) is required.' };
        }
        const state = usePartyStore.getState();
        let event: Event | undefined =
          state.events.find((e) => e.id === eventId) ??
          (state.currentEvent?.id === eventId ? state.currentEvent : undefined);
        if (!event) {
          const fetched = await eventService.getEventById(eventId);
          if (fetched) {
            event = fetched;
          }
        }
        if (!event) {
          return { status: 'error', message: `Event '${eventId}' not found.` };
        }
        const guests = await eventService.getEventGuests(eventId);
        return {
          status: 'success',
          event: { ...summarizeEvent(event), description: event.description ?? null },
          guests: summarizeGuests(guests),
        };
      },
    },
    {
      name: 'get_api_activity',
      description:
        'Returns recent PartyHause API requests (method, path, status, duration, attempts, ' +
        'error message) plus aggregate stats. Headers and bodies are never included.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Max calls to return, 1-200. Default 20.',
          },
          errors_only: {
            type: 'boolean',
            description: 'Return only failed requests. Default false.',
          },
        },
      },
      execute: (args) => {
        const limit = clampInt(args.limit, 1, 200, 20);
        const stats = getMonitorStats();
        return {
          status: 'success',
          stats: stats.api,
          calls: getApiActivity(limit, args.errors_only === true),
        };
      },
    },
    {
      name: 'get_error_log',
      description:
        'Returns recent runtime errors and warnings captured from window errors, unhandled ' +
        'promise rejections and console.error/console.warn, newest first.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Max entries to return, 1-100. Default 20.',
          },
          level: {
            type: 'string',
            enum: ['all', 'error', 'warning'],
            description: "Filter by severity. Default 'all'.",
          },
        },
      },
      execute: (args) => {
        const limit = clampInt(args.limit, 1, 100, 20);
        const level = args.level === 'error' || args.level === 'warning' ? args.level : 'all';
        const stats = getMonitorStats();
        return {
          status: 'success',
          stats: stats.errors,
          entries: getRuntimeErrors(limit, level),
        };
      },
    },
    {
      name: 'get_health_status',
      description:
        'Checks overall health: pings the PartyHause backend (/api/health) and reports ' +
        'frontend connectivity, uptime, runtime error counts and API error rates.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        const start = performance.now();
        const { data, error } = await apiGet<Record<string, unknown>>('/api/health');
        const latencyMs = Math.round(performance.now() - start);
        const stats = getMonitorStats();
        return {
          status: 'success',
          frontend: {
            online: navigator.onLine,
            monitorUptimeMs: stats.uptimeMs,
            runtimeErrors: stats.errors.errorCount,
            runtimeWarnings: stats.errors.warningCount,
          },
          backend: error
            ? { reachable: false, latencyMs, error: error.message, httpStatus: error.status ?? null }
            : {
                reachable: true,
                latencyMs,
                ...(data && typeof data === 'object' ? data : { raw: data }),
              },
          apiActivity: stats.api,
        };
      },
    },
    {
      name: 'get_performance_metrics',
      description:
        'Returns frontend performance metrics: JS heap usage (Chrome), page navigation ' +
        'timing, loaded resource count and monitor uptime.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => {
        const memory = (performance as unknown as { memory?: Record<string, number> }).memory;
        const [navEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        return {
          status: 'success',
          monitorUptimeMs: getMonitorStats().uptimeMs,
          jsHeap: memory
            ? {
                usedBytes: memory.usedJSHeapSize,
                totalBytes: memory.totalJSHeapSize,
                limitBytes: memory.jsHeapSizeLimit,
              }
            : null,
          navigationTiming: navEntry
            ? {
                domContentLoadedMs: Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime),
                loadEventMs: Math.round(navEntry.loadEventEnd - navEntry.startTime),
                transferSizeBytes: navEntry.transferSize,
              }
            : null,
          resourcesLoaded: performance.getEntriesByType('resource').length,
        };
      },
    },
    {
      name: 'navigate_to_page',
      description:
        'Navigates the PartyHause UI to an internal page (state-machine navigation, the URL ' +
        'does not change). The only tool that mutates app state. Requires an authenticated session.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: [...NAVIGABLE_PAGES],
            description: 'The internal page to show.',
          },
        },
        required: ['page'],
      },
      execute: (args) => {
        const page = args.page;
        if (typeof page !== 'string' || !(NAVIGABLE_PAGES as readonly string[]).includes(page)) {
          return {
            status: 'error',
            message: `Unknown page '${String(page)}'. Valid pages: ${NAVIGABLE_PAGES.join(', ')}.`,
          };
        }
        const state = usePartyStore.getState();
        if (!state.isAuthenticated) {
          return {
            status: 'error',
            message: 'Not authenticated — the app will only show the landing/auth screen.',
          };
        }
        state.setCurrentPage(page);
        return {
          status: 'success',
          message: `Navigated to '${page}'.`,
          currentPage: usePartyStore.getState().currentPage,
        };
      },
    },
  ];
}

/**
 * Register every monitoring tool on the page's Model Context.
 * Returns the number of tools registered (0 when WebMCP is unavailable).
 * Safe to call more than once: duplicate registrations are caught and skipped.
 */
export function registerMonitoringTools(): number {
  const context = navigator.modelContext ?? document.modelContext;
  if (!context || typeof context.registerTool !== 'function') {
    return 0;
  }
  let registered = 0;
  for (const tool of buildTools()) {
    try {
      context.registerTool(tool);
      registered += 1;
    } catch (err) {
      // Registration is init-guarded (see src/mcp/index.ts), so this is a
      // genuine failure (e.g. rejected schema), not a duplicate. Surface it.
      console.warn(`WebMCP: failed to register tool '${tool.name}'`, err);
    }
  }
  return registered;
}
