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
  TimelineBlock, Poll, CrewMember, CrewMemberRow, CrewCreatorRow,
  Notification, UploadedBlob, UserProfileDetail, SuggestedUser,
  FeedContentType, CrewFeedPage,
} from '../types';
import { unwrapList, unwrapOne } from './envelopes';

export { createEventsResource } from './legacy-events';
export type { EventStats, EventWithStats, EventsResource } from './legacy-events';
export { createGuestsResource } from './legacy-guests';
export type {
  GuestCreateInput,
  GuestStats,
  GuestsPage,
  GuestsResource,
  GuestUpdateInput,
} from './legacy-guests';

/**
 * The /api/timeline TABLE endpoints.
 *
 * READ THIS BEFORE USING listForEvent: these operate on the `timeline_blocks`
 * table, which nothing in the app populates. The live schedule lives in the
 * `events.timeline_blocks` JSON column and is returned by
 * `events.get(id).timeline_blocks`.
 *
 * `listForEvent` therefore returns [] for events that visibly have a schedule.
 * Reading from here and writing the result back to the event erases it, which
 * the web app hit and documented in `timelineService`.
 *
 * Use `events.get()` to read a schedule. These endpoints remain for the table,
 * should anything start populating it.
 */
/**
 * A timeline block as callers describe it.
 *
 * Snake_case, matching `TimelineBlock` and every other type in this package.
 * The route reads camelCase from the request body while writing snake_case to
 * the database, so the translation happens in `toTimelineWire` below rather
 * than leaking two naming conventions to call sites.
 */
export interface TimelineBlockInput {
  event_id?: string;
  label?: string;
  /** ISO-8601. The route passes this straight to `new Date()`. */
  start_time?: string;
  /** Minutes. There is no end_time; duration is what is stored. */
  duration?: number;
  type?: TimelineBlock['type'];
  description?: string | null;
  host_notes?: string | null;
  guest_visible?: boolean;
  /** Minutes before start_time to send a reminder. */
  notify_before?: number | null;
  location?: string | null;
  assigned_to?: string[];
  order_index?: number;
}

/**
 * Translate a caller's block into the body `/api/timeline` actually reads.
 *
 * `server/routes/timeline.ts:59-71` destructures `eventId`, `startTime`,
 * `hostNotes`, `guestVisible`, `notifyBefore` and `assignedTo`. Sending the
 * snake_case field names, which is what `Partial<TimelineBlock>` produced,
 * left `eventId` and `startTime` undefined and the route answered
 * 400 "eventId, label, startTime, duration, and type are required" no matter
 * what the caller passed. Nothing had ever called it, so nothing observed it.
 *
 * Keys absent from `input` stay absent, because PUT treats `undefined` as
 * "leave alone" and an explicit null as "clear".
 *
 * @param input Caller-facing block fields.
 * @returns The wire body, with only the supplied keys present.
 */
function toTimelineWire(input: TimelineBlockInput): Record<string, unknown> {
  const pairs: Array<[string, unknown]> = [
    ['eventId', input.event_id],
    ['label', input.label],
    ['startTime', input.start_time],
    ['duration', input.duration],
    ['type', input.type],
    ['description', input.description],
    ['hostNotes', input.host_notes],
    ['guestVisible', input.guest_visible],
    ['notifyBefore', input.notify_before],
    ['location', input.location],
    ['assignedTo', input.assigned_to],
    ['orderIndex', input.order_index],
  ];

  const body: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    if (value !== undefined) body[key] = value;
  }
  return body;
}

export interface TimelineResource {
  listForEvent(eventId: string): Promise<ApiResponse<TimelineBlock[]>>;
  create(input: TimelineBlockInput): Promise<ApiResponse<TimelineBlock>>;
  update(id: string, input: TimelineBlockInput): Promise<ApiResponse<TimelineBlock>>;
  remove(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export function createTimelineResource(t: Transport): TimelineResource {
  return {
    listForEvent: (eventId) =>
      unwrapList<TimelineBlock>(t.request(`/api/timeline/${encodeURIComponent(eventId)}`, { method: 'GET' }), 'blocks'),
    // Both writes answer `{ block, success }`, so both unwrap. They previously
    // typed the envelope as the block itself, which would have handed callers
    // an object with no `id` and no failure to report.
    create: (input) =>
      unwrapOne<TimelineBlock>(
        t.request('/api/timeline', { method: 'POST', body: toTimelineWire(input) }),
        'block',
      ),
    update: (id, input) =>
      unwrapOne<TimelineBlock>(
        t.request(`/api/timeline/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: toTimelineWire(input),
        }),
        'block',
      ),
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

export interface FeedResource {
  /**
   * Cursor-paginated crew feed. Pass `cursor` from the previous page's
   * `next_cursor`; omit it for the first page.
   */
  crew(options?: {
    limit?: number;
    cursor?: string;
    contentType?: FeedContentType;
  }): Promise<ApiResponse<CrewFeedPage>>;
  /**
   * Report real impressions. The route caps this at 100 ids per call and
   * rejects empty or non-string entries with a 400, so callers must chunk.
   */
  markSeen(postIds: string[]): Promise<ApiResponse<number>>;
  /**
   * Like a post. Idempotent: a repeat call, or a retry after a dropped
   * response, returns the current state rather than inflating the counter.
   */
  like(postId: string): Promise<ApiResponse<{ liked: boolean; likes_count: number }>>;
  /** Remove a like. Idempotent in the same way. */
  unlike(postId: string): Promise<ApiResponse<{ liked: boolean; likes_count: number }>>;
  /** Comments oldest-first, cursor paginated. */
  comments(postId: string, options?: { limit?: number; cursor?: string }): Promise<ApiResponse<PostCommentPage>>;
  /** Add a comment, or a reply when `parentCommentId` is supplied. */
  comment(postId: string, body: string, parentCommentId?: string): Promise<ApiResponse<{ comment: PostComment; comments_count: number }>>;
  /** Record a share. Not deduplicated: sharing twice is two real events. */
  share(postId: string, sharedTo?: 'feed' | 'external' | 'message'): Promise<ApiResponse<{ shared: boolean; shares_count: number }>>;
}

export interface PostCommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PostComment {
  id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  user: PostCommentAuthor;
}

export interface PostCommentPage {
  comments: PostComment[];
  next_cursor: string | null;
}

export function createFeedResource(t: Transport): FeedResource {
  return {
    like: (postId) =>
      t.request<{ liked: boolean; likes_count: number }>(`/api/feed/posts/${postId}/like`, { method: 'POST' }),
    unlike: (postId) =>
      t.request<{ liked: boolean; likes_count: number }>(`/api/feed/posts/${postId}/like`, { method: 'DELETE' }),
    comments: (postId, options) =>
      t.request<PostCommentPage>(`/api/feed/posts/${postId}/comments`, {
        method: 'GET',
        query: { limit: options?.limit, cursor: options?.cursor },
      }),
    comment: (postId, body, parentCommentId) =>
      t.request<{ comment: PostComment; comments_count: number }>(`/api/feed/posts/${postId}/comments`, {
        method: 'POST',
        body: { body, parent_comment_id: parentCommentId ?? null },
      }),
    share: (postId, sharedTo) =>
      t.request<{ shared: boolean; shares_count: number }>(`/api/feed/posts/${postId}/share`, {
        method: 'POST',
        body: { shared_to: sharedTo ?? 'external' },
      }),
    crew: (options) =>
      t.request<CrewFeedPage>('/api/feed/crew', {
        method: 'GET',
        query: {
          limit: options?.limit,
          cursor: options?.cursor,
          content_type: options?.contentType,
        },
      }),
    markSeen: (postIds) =>
      unwrapOne<number>(
        t.request('/api/feed/seen', { method: 'POST', body: { post_ids: postIds } }),
        'marked',
      ),
  };
}

/**
 * The fields `PUT /api/users/me/profile` accepts.
 *
 * Limits mirror the server's, which rejects anything longer
 * (`server/routes/users.ts:73-96`). Sending a field with an empty string
 * clears it to null; omitting the field leaves it untouched. `website_url`
 * must carry an http(s) scheme, because the profile screen renders it as a
 * tappable link and `javascript:` there is a stored-XSS payload.
 */
export interface UserProfileUpdate {
  /** Required by the server whenever present. 1-80 characters after trimming. */
  display_name?: string;
  /** Max 500. */
  bio?: string;
  /** Max 120. */
  location?: string;
  /** Max 200. Must begin with http:// or https:// when non-empty. */
  website_url?: string;
}

export interface UsersResource {
  /** Rows arrive under `suggestions`, not as a bare array. */
  suggested(): Promise<ApiResponse<SuggestedUser[]>>;
  /** Returned flat by the route; nothing to unwrap. */
  get(id: string): Promise<ApiResponse<UserProfileDetail>>;
  /**
   * Update the signed-in user's own profile.
   *
   * Unlike `get`, this route wraps its answer in `{ profile }`, so it is
   * unwrapped here. Sending no recognised field is a 400 from the server
   * rather than a silent no-op.
   */
  updateProfile(input: UserProfileUpdate): Promise<ApiResponse<UserProfileDetail>>;
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
    updateProfile: (input) =>
      unwrapOne<UserProfileDetail>(
        t.request('/api/users/me/profile', { method: 'PUT', body: input }),
        'profile',
      ),
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
