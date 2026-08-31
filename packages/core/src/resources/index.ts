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
  PartyEvent, Guest, TimelineBlock, Poll, CrewMember, Notification, UploadedBlob, UserProfile,
} from '../types';

export interface EventsResource {
  list(): Promise<ApiResponse<PartyEvent[]>>;
  get(id: string): Promise<ApiResponse<PartyEvent>>;
  create(input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  update(id: string, input: Partial<PartyEvent>): Promise<ApiResponse<PartyEvent>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createEventsResource(t: Transport): EventsResource {
  return {
    list: () => t.request<PartyEvent[]>('/api/events', { method: 'GET' }),
    // Path parameter, not a query string. server/routes/events.ts declares
    // `router.get('/:id?')` and reads `req.params.id`, so `/api/events?id=x`
    // silently returns the full list instead of one event. Mobile did exactly
    // that in two screens.
    get: (id) => t.request<PartyEvent>(`/api/events/${encodeURIComponent(id)}`, { method: 'GET' }),
    create: (input) => t.request<PartyEvent>('/api/events', { method: 'POST', body: input }),
    update: (id, input) =>
      t.request<PartyEvent>(`/api/events/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
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

export interface GuestCreateInput {
  event_id: string;
  name: string;
  email?: string;
  phone?: string;
  plus_ones?: number;
}

export interface GuestsResource {
  listForEvent(eventId: string): Promise<ApiResponse<Guest[]>>;
  create(input: GuestCreateInput): Promise<ApiResponse<Guest>>;
  update(id: string, input: GuestUpdateInput): Promise<ApiResponse<Guest>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createGuestsResource(t: Transport): GuestsResource {
  return {
    listForEvent: (eventId) => t.request<Guest[]>('/api/guests', { method: 'GET', query: { eventId } }),
    create: (input) => t.request<Guest>('/api/guests', { method: 'POST', body: input }),
    // PUT /:id, not PATCH with a query string. The mobile app had this wrong.
    update: (id, input) =>
      t.request<Guest>(`/api/guests/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
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
      t.request<TimelineBlock[]>(`/api/timeline/${encodeURIComponent(eventId)}`, { method: 'GET' }),
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
  vote(pollId: string, optionId: string): Promise<ApiResponse<{ success: boolean }>>;
  close(pollId: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createPollsResource(t: Transport): PollsResource {
  return {
    list: (eventId) => t.request<Poll[]>('/api/polls', { method: 'GET', query: { eventId } }),
    get: (id) => t.request<Poll>(`/api/polls/${encodeURIComponent(id)}`, { method: 'GET' }),
    create: (input) => t.request<Poll>('/api/polls', { method: 'POST', body: input }),
    vote: (pollId, optionId) =>
      t.request<{ success: boolean }>(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
        method: 'POST', body: { optionId },
      }),
    close: (pollId) =>
      t.request<{ success: boolean }>(`/api/polls/${encodeURIComponent(pollId)}/close`, { method: 'POST' }),
  };
}

export interface PartyCrewResource {
  members(): Promise<ApiResponse<CrewMember[]>>;
  crewingWith(): Promise<ApiResponse<CrewMember[]>>;
  status(userId: string): Promise<ApiResponse<{ is_crewing: boolean }>>;
  toggle(userId: string): Promise<ApiResponse<{ is_crewing: boolean }>>;
  requests(): Promise<ApiResponse<CrewMember[]>>;
  sendRequest(userId: string): Promise<ApiResponse<{ success: boolean }>>;
  cancelRequest(userId: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createPartyCrewResource(t: Transport): PartyCrewResource {
  return {
    members: () => t.request<CrewMember[]>('/api/partycrew/members', { method: 'GET' }),
    crewingWith: () => t.request<CrewMember[]>('/api/partycrew/crewing-with', { method: 'GET' }),
    status: (userId) =>
      t.request<{ is_crewing: boolean }>('/api/partycrew/toggle', { method: 'GET', query: { userId } }),
    toggle: (userId) =>
      t.request<{ is_crewing: boolean }>('/api/partycrew/toggle', { method: 'POST', body: { userId } }),
    requests: () => t.request<CrewMember[]>('/api/partycrew/requests', { method: 'GET' }),
    sendRequest: (userId) =>
      t.request<{ success: boolean }>('/api/partycrew/requests', { method: 'POST', body: { userId } }),
    cancelRequest: (userId) =>
      t.request<{ success: boolean }>('/api/partycrew/requests', { method: 'DELETE', body: { userId } }),
  };
}

export interface UsersResource {
  suggested(): Promise<ApiResponse<CrewMember[]>>;
  get(id: string): Promise<ApiResponse<UserProfile>>;
}

export function createUsersResource(t: Transport): UsersResource {
  return {
    suggested: () => t.request<CrewMember[]>('/api/users/suggested', { method: 'GET' }),
    get: (id) => t.request<UserProfile>(`/api/users/${encodeURIComponent(id)}`, { method: 'GET' }),
  };
}

export interface NotificationsResource {
  list(): Promise<ApiResponse<Notification[]>>;
  markRead(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createNotificationsResource(t: Transport): NotificationsResource {
  return {
    list: () => t.request<Notification[]>('/api/notifications', { method: 'GET' }),
    markRead: (id) =>
      t.request<{ success: boolean }>('/api/notifications', { method: 'POST', body: { id, read: true } }),
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
      t.request<EmailLog[]>('/api/email-logs', { method: 'GET', query: { eventId } }),
    create: (input) => t.request<EmailLog>('/api/email-logs', { method: 'POST', body: input }),
    update: (id, input) =>
      t.request<EmailLog>(`/api/email-logs/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
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
