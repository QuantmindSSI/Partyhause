/**
 * Typed resource modules, one per API family.
 *
 * Paths and verbs here were taken from an AST walk of server/routes/*.ts, not
 * from memory. Two mismatches that walk exposed are corrected at the source:
 *
 *   - mobile issued `PATCH /api/guests`, but the server exposes
 *     `PUT /api/guests/:id`. The old call 404'd.
 *   - web calls `/api/partyboard/*` (7 call sites), for which no server route,
 *     router or Prisma model exists. It is deliberately absent below rather
 *     than given a client method that could never succeed.
 */

import type { Transport, ApiResponse } from '../http/transport';
import type {
  PartyEvent, Guest, TimelineBlock, Poll, CrewMember, CrewMemberRow, CrewCreatorRow,
  Notification, UploadedBlob, UserProfileDetail, SuggestedUser,
} from '../types';

/**
 * Unwrap an envelope response into the value callers actually want.
 *
 * Every list and single-item route wraps its payload under a named key:
 * `{ events }`, `{ event, stats }`, `{ guests, stats }`, `{ blocks }`,
 * `{ polls }`, `{ notifications }`, `{ profile }`. Returning the envelope
 * would make `data` an object where callers expect an array, so
 * `data.map(...)` throws at runtime while the types look fine.
 *
 * @param res Raw transport result.
 * @param key Envelope property to lift.
 * @param fallback Value when the key is absent, so a list route that omits an
 *        empty array yields [] rather than null.
 */
function unwrap<T>(res: ApiResponse<unknown>, key: string, fallback: T | null = null): ApiResponse<T> {
  if (res.error) return { data: null, error: res.error };
  const payload = res.data as Record<string, unknown> | null;
  if (!payload || typeof payload !== 'object') {
    return { data: fallback, error: null };
  }
  const value = payload[key];
  return { data: (value === undefined ? fallback : value) as T, error: null };
}

/** Lift an envelope containing a list, defaulting to an empty array. */
async function unwrapList<T>(p: Promise<ApiResponse<unknown>>, key: string): Promise<ApiResponse<T[]>> {
  return unwrap<T[]>(await p, key, []);
}

/** Lift an envelope containing a single item. */
async function unwrapOne<T>(p: Promise<ApiResponse<unknown>>, key: string): Promise<ApiResponse<T>> {
  return unwrap<T>(await p, key);
}

export interface EventsResource {
  list(): Promise<ApiResponse<PartyEvent[]>>;
  get(id: string): Promise<ApiResponse<PartyEvent>>;
  create(input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  update(id: string, input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createEventsResource(t: Transport): EventsResource {
  return {
    list: () => unwrapList<PartyEvent>(t.request('/api/events', { method: 'GET' }), 'events'),
    // Path parameter, not a query string. server/routes/events.ts declares
    // `router.get('/:id?')` and reads `req.params.id`, so `/api/events?id=x`
    // silently returns the full list instead of one event. Mobile did exactly
    // that in two screens.
    get: (id) => unwrapOne<PartyEvent>(t.request(`/api/events/${encodeURIComponent(id)}`, { method: 'GET' }), 'event'),
    create: (input) => unwrapOne<PartyEvent>(t.request('/api/events', { method: 'POST', body: input }), 'event'),
    update: (id, input) =>
      unwrapOne<PartyEvent>(t.request(`/api/events/${encodeURIComponent(id)}`, { method: 'PUT', body: input }), 'event'),
    remove: (id) =>
      t.request<{ success: boolean }>(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

/**
 * Body accepted by PUT /api/guests/:id.
 *
 * Deliberately not `Partial<Guest>`. The route destructures a mixed-case set
 * of names and ignores anything else, so passing the row shape silently
 * discards the update. `checkedIn` maps to the `checked_in` column and also
 * sets `checked_in_at`.
 *
 * Note the Guest model carries a legacy `is_checked_in` column alongside
 * `checked_in`. The API reads and writes only `checked_in`; anything written
 * to the legacy column is invisible to both this API and the web app.
 */
export interface GuestUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'maybe' | 'confirmed';
  plusOnes?: number;
  dietaryRestrictions?: string;
  customFields?: Record<string, unknown>;
  checkedIn?: boolean;
  email_status?: string;
  last_email_sent_at?: string;
  email_log_id?: string | null;
}

/** One guest in a bulk create. The route takes an array, never a single row. */
export interface GuestCreateInput {
  name: string;
  email?: string;
  phone?: string;
  plus_ones?: number;
}

export interface GuestsResource {
  listForEvent(eventId: string): Promise<ApiResponse<Guest[]>>;
  /**
   * Add one guest.
   *
   * POST /api/guests is a bulk endpoint: it requires `{ eventId, guests: [] }`
   * and answers `{ guests, success, count }`. Sending a single flat guest, as
   * this client originally did, fails validation with "eventId is required".
   * This wraps the single case and lifts the first row back out.
   */
  create(eventId: string, guest: GuestCreateInput): Promise<ApiResponse<Guest>>;
  /** Add several guests in one request. */
  createMany(eventId: string, guests: GuestCreateInput[]): Promise<ApiResponse<Guest[]>>;
  update(id: string, input: GuestUpdateInput): Promise<ApiResponse<Guest>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createGuestsResource(t: Transport): GuestsResource {
  return {
    listForEvent: (eventId) => unwrapList<Guest>(t.request('/api/guests', { method: 'GET', query: { eventId } }), 'guests'),
    create: async (eventId, guest) => {
      const res = await unwrapList<Guest>(
        t.request('/api/guests', { method: 'POST', body: { eventId, guests: [guest] } }),
        'guests',
      );
      if (res.error) return { data: null, error: res.error };
      const first = (res.data ?? [])[0];
      return first
        ? { data: first, error: null }
        : { data: null, error: { message: 'Guest was created but the server returned no row' } };
    },
    createMany: (eventId, guests) =>
      unwrapList<Guest>(t.request('/api/guests', { method: 'POST', body: { eventId, guests } }), 'guests'),
    // PUT /:id, not PATCH with a query string. The mobile app had this wrong.
    update: (id, input) =>
      unwrapOne<Guest>(t.request(`/api/guests/${encodeURIComponent(id)}`, { method: 'PUT', body: input }), 'guest'),
    remove: (id) =>
      t.request<{ success: boolean }>(`/api/guests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export interface TimelineResource {
  listForEvent(eventId: string): Promise<ApiResponse<TimelineBlock[]>>;
  create(input: Partial<TimelineBlock>): Promise<ApiResponse<TimelineBlock>>;
  update(id: string, input: Partial<TimelineBlock>): Promise<ApiResponse<TimelineBlock>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createTimelineResource(t: Transport): TimelineResource {
  return {
    listForEvent: (eventId) =>
      unwrapList<TimelineBlock>(t.request(`/api/timeline/${encodeURIComponent(eventId)}`, { method: 'GET' }), 'blocks'),
    create: (input) => t.request<TimelineBlock>('/api/timeline', { method: 'POST', body: input }),
    update: (id, input) =>
      t.request<TimelineBlock>(`/api/timeline/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
    remove: (id) =>
      t.request<{ success: boolean }>(`/api/timeline/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export interface PollsResource {
  list(eventId: string): Promise<ApiResponse<Poll[]>>;
  get(id: string): Promise<ApiResponse<Poll>>;
  create(input: Partial<Poll>): Promise<ApiResponse<Poll>>;
  /** Both return the updated poll under { poll }, not a success flag. */
  vote(pollId: string, optionId: string): Promise<ApiResponse<Poll>>;
  close(pollId: string): Promise<ApiResponse<Poll>>;
}

export function createPollsResource(t: Transport): PollsResource {
  return {
    list: (eventId) => unwrapList<Poll>(t.request('/api/polls', { method: 'GET', query: { eventId } }), 'polls'),
    get: (id) => unwrapOne<Poll>(t.request(`/api/polls/${encodeURIComponent(id)}`, { method: 'GET' }), 'poll'),
    create: (input) => unwrapOne<Poll>(t.request('/api/polls', { method: 'POST', body: input }), 'poll'),
    vote: (pollId, optionId) =>
      unwrapOne<Poll>(t.request(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
        method: 'POST', body: { optionId },
      }), 'poll'),
    close: (pollId) =>
      unwrapOne<Poll>(t.request(`/api/polls/${encodeURIComponent(pollId)}/close`, { method: 'POST' }), 'poll'),
  };
}

/**
 * GET /api/partycrew/toggle?creatorId=...
 *
 * Note the parameter is `creatorId`, not `userId`: the caller is identified by
 * the bearer token, and this names the crew being inspected. An earlier version
 * of this client sent `userId`, which the route ignores, so it always answered
 * for an undefined creator.
 */
export interface CrewConnection {
  id: string;
  created_at: string;
  notify_on_events: boolean;
  notify_on_posts: boolean;
}

export interface CrewRequest {
  id: string;
  status: string;
  created_at: string;
}

export interface CrewStatus {
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  connection: CrewConnection | null;
  request: CrewRequest | null;
}

/** POST /api/partycrew/toggle answers with the action taken, not a flag. */
export interface CrewToggleResult {
  success: boolean;
  /**
   * A private account does not join immediately; the route creates a pending
   * connection request and answers 'requested'. Treating this as a join is the
   * bug that makes a follow button flip to "Crewing" when nothing was granted.
   */
  action: 'joined' | 'left' | 'requested';
  partycrew_count?: number;
  message?: string;
}

/** GET /api/partycrew/members is paginated. */
export interface CrewMembersPage {
  members: CrewMemberRow[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

/**
 * GET /api/partycrew/crewing-with is paginated and keys its rows under
 * `creators`, not `members`. It also requires an explicit `userId` query
 * parameter naming whose crew list to read; the bearer token identifies the
 * caller but does not select the subject.
 */
export interface CrewingWithPage {
  creators: CrewCreatorRow[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

/** GET /api/partycrew/requests is paginated under `requests`. */
export interface CrewRequestsPage {
  requests: CrewMember[];
  total: number;
  has_more: boolean;
}

export interface PartyCrewResource {
  /** Paginated; returns the whole page so callers can drive infinite scroll. */
  /**
   * Paginated; returns the whole page so callers can drive infinite scroll.
   * `includeMutualCount` opts into the route's `include_mutual_count=true`
   * branch, which costs two extra queries and populates `mutual_crew_count`.
   */
  members(options?: {
    limit?: number;
    offset?: number;
    includeMutualCount?: boolean;
  }): Promise<ApiResponse<CrewMembersPage>>;
  /** `userId` names whose crew to read; the token identifies the caller. */
  crewingWith(userId: string, options?: { limit?: number; offset?: number }): Promise<ApiResponse<CrewingWithPage>>;
  status(creatorId: string): Promise<ApiResponse<CrewStatus>>;
  /** `action` is required by the route; omitting it yields a 400. */
  toggle(creatorId: string, action: 'join' | 'leave'): Promise<ApiResponse<CrewToggleResult>>;
  requests(type?: 'received' | 'sent'): Promise<ApiResponse<CrewRequestsPage>>;
  sendRequest(creatorId: string): Promise<ApiResponse<{ success: boolean }>>;
  cancelRequest(creatorId: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createPartyCrewResource(t: Transport): PartyCrewResource {
  return {
    members: (options) =>
      t.request<CrewMembersPage>('/api/partycrew/members', {
        method: 'GET',
        query: {
          limit: options?.limit,
          offset: options?.offset,
          // The route compares against the literal string 'true'.
          include_mutual_count: options?.includeMutualCount ? 'true' : undefined,
        },
      }),
    crewingWith: (userId, options) =>
      t.request<CrewingWithPage>('/api/partycrew/crewing-with', {
        method: 'GET',
        query: { userId, limit: options?.limit, offset: options?.offset },
      }),
    status: (creatorId) =>
      t.request<CrewStatus>('/api/partycrew/toggle', { method: 'GET', query: { creatorId } }),
    toggle: (creatorId, action) =>
      t.request<CrewToggleResult>('/api/partycrew/toggle', {
        method: 'POST',
        body: { creatorId, action },
      }),
    requests: (type = 'received') =>
      t.request<CrewRequestsPage>('/api/partycrew/requests', { method: 'GET', query: { type } }),
    sendRequest: (creatorId) =>
      t.request<{ success: boolean }>('/api/partycrew/requests', { method: 'POST', body: { creatorId } }),
    cancelRequest: (creatorId) =>
      t.request<{ success: boolean }>('/api/partycrew/requests', { method: 'DELETE', body: { creatorId } }),
  };
}

export interface UsersResource {
  /** Rows arrive under `suggestions`, not as a bare array. */
  suggested(): Promise<ApiResponse<SuggestedUser[]>>;
  /** Returned flat by the route; nothing to unwrap. */
  get(id: string): Promise<ApiResponse<UserProfileDetail>>;
}

export function createUsersResource(t: Transport): UsersResource {
  return {
    suggested: () =>
      unwrapList<SuggestedUser>(
        t.request('/api/users/suggested', { method: 'GET' }),
        'suggestions',
      ),
    // Deliberately NOT unwrapped. GET /api/users/:id answers with the profile
    // object itself; asking for a `profile` key returned null with no error,
    // so every caller saw an empty profile and no failure to report.
    get: (id) =>
      t.request<UserProfileDetail>(`/api/users/${encodeURIComponent(id)}`, { method: 'GET' }),
  };
}

export interface NotificationsResource {
  list(): Promise<ApiResponse<Notification[]>>;
  markRead(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createNotificationsResource(t: Transport): NotificationsResource {
  return {
    list: () => unwrapList<Notification>(t.request('/api/notifications', { method: 'GET' }), 'notifications'),
    // POST /api/notifications does not exist; the route is /mark-read and it
    // takes an array of ids.
    markRead: (id) =>
      t.request<{ success: boolean; updated: number }>('/api/notifications/mark-read', {
        method: 'POST', body: { ids: [id] },
      }),
  };
}

export interface StorageResource {
  /** Returns the SAS/public URL for a stored blob. */
  urlFor(blobName: string): Promise<ApiResponse<{ url: string }>>;
  remove(blobName: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createStorageResource(t: Transport): StorageResource {
  return {
    urlFor: (blobName) =>
      t.request<{ url: string }>(`/api/storage/url/${encodeURIComponent(blobName)}`, { method: 'GET' }),
    remove: (blobName) =>
      t.request<{ success: boolean }>(`/api/storage/${encodeURIComponent(blobName)}`, { method: 'DELETE' }),
  };
}

export interface EmailLogInput {
  event_id: string;
  guest_id?: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status?: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';
}

export interface EmailLog {
  id: string;
  event_id: string;
  guest_id?: string | null;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  sent_at?: string | null;
  error_message?: string | null;
}

export interface EmailLogsResource {
  listForEvent(eventId: string): Promise<ApiResponse<EmailLog[]>>;
  create(input: EmailLogInput): Promise<ApiResponse<EmailLog>>;
  update(id: string, input: Partial<EmailLog>): Promise<ApiResponse<EmailLog>>;
}

export function createEmailLogsResource(t: Transport): EmailLogsResource {
  return {
    listForEvent: (eventId) =>
      unwrapList<EmailLog>(t.request('/api/email-logs', { method: 'GET', query: { eventId } }), 'email_logs'),
    create: (input) => unwrapOne<EmailLog>(t.request('/api/email-logs', { method: 'POST', body: input }), 'email_log'),
    update: (id, input) =>
      unwrapOne<EmailLog>(t.request(`/api/email-logs/${encodeURIComponent(id)}`, { method: 'PUT', body: input }), 'email_log'),
  };
}

export interface EmailResource {
  send(to: string | string[], subject: string, html: string): Promise<ApiResponse<{ success: boolean; id?: string }>>;
}

export function createEmailResource(t: Transport): EmailResource {
  return {
    send: (to, subject, html) =>
      t.request<{ success: boolean; id?: string }>('/api/send-email', {
        method: 'POST', body: { to, subject, html },
      }),
  };
}

export type { UploadedBlob };
