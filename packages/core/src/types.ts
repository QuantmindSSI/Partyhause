/**
 * Domain types shared by web and mobile.
 *
 * These mirror the shapes the Express API actually returns, verified against
 * server/routes/*.ts rather than assumed. Where a route selects a subset of
 * columns, the type reflects that subset instead of the full Prisma model.
 */

export type UserRole = 'user' | 'creator' | 'vendor';

/** Identity as returned by POST /api/auth/login and /signup. */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  /** Present on the signup response only. */
  email_verified?: boolean;
}

/** POST /api/auth/login and POST /api/auth/signup. */
export interface AuthSession {
  user: AuthUser;
  token: string;
}

/** GET /api/auth/me. Selects id, email, name, created_at, email_verified. */
export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  created_at: string;
  email_verified: boolean;
  profile?: UserProfile | null;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role?: UserRole;
}

export type EventType = 'single_day' | 'multi_day';

export interface PartyEvent {
  id: string;
  host_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  event_type: EventType;
  location?: string;
  max_guests?: number;
  is_public: boolean;
  invite_image_url?: string;
  template_type?: string;
  spotify_playlist_url?: string;
  /**
   * JSON column on the event row, defaulting to `[]`.
   *
   * Not to be confused with `stats.timeline_blocks` on the same response,
   * which is a count. This is the schedule itself, and it is what the
   * activities screen renders.
   */
  timeline_blocks?: TimelineBlock[];
  created_at: string;
  updated_at: string;
}

export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe' | 'confirmed';

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  /** NOT NULL in the schema, so always present on a row read from the API. */
  email: string;
  phone?: string;
  /** NOT NULL with a 'pending' default; never absent on a read. */
  rsvp_status: RsvpStatus;
  /** NOT NULL with a false default; never absent on a read. */
  checked_in: boolean;
  /**
   * Legacy column from the initial schema, still present and still written by
   * the default. `checked_in` is the one the API updates; read that.
   */
  is_checked_in?: boolean;
  plus_ones: number;
  /** A Postgres text[], so an array on the wire, not a string. */
  dietary_restrictions?: string[];
  special_requirements?: string;
  checked_in_at?: string;
  custom_fields?: Record<string, unknown>;
  role?: string;
  user_id?: string | null;
  /**
   * When the guest row was created, which is the closest thing the schema has
   * to "invited at". There is no `invited_at` column; UI that displayed one
   * rendered `new Date(undefined)` as "Invalid Date".
   */
  created_at: string;
  updated_at?: string;
}

export type TimelineBlockType =
  | 'activity'
  | 'meal'
  | 'speech'
  | 'performance'
  | 'break'
  | 'custom';

/**
 * A schedule entry.
 *
 * IMPORTANT: there are two stores for these, and they are not interchangeable.
 *
 *   events.timeline_blocks   a JSON column on the event row. This is what every
 *                            write path in the app actually updates, and it is
 *                            where the live data is. `start_time` here is a
 *                            bare "HH:MM" string.
 *
 *   timeline_blocks          a real table, served by /api/timeline. Nothing
 *                            populates it, so it reads empty. Its `start_time`
 *                            is a DateTime and arrives as ISO-8601.
 *
 * Reading the table and then writing the result back to the event is what
 * destroys existing schedules: the read returns [] and the write persists that
 * emptiness. See `timelineService` in the web app, which documents having hit
 * exactly this.
 *
 * The field names below match both stores. Only `start_time`'s format differs,
 * which is why it is documented rather than typed as `Date`.
 */
export interface TimelineBlock {
  id: string;
  event_id?: string;
  /** Not `title`. The column and the JSON payload both call this `label`. */
  label: string;
  description?: string | null;
  /** "HH:MM" in the JSON column; ISO-8601 when read from the table. */
  start_time: string;
  /** Minutes. There is no `end_time`; duration is what is stored. */
  duration: number;
  type: TimelineBlockType;
  host_notes?: string | null;
  guest_visible?: boolean;
  /** Minutes before `start_time` to send a reminder. */
  notify_before?: number | null;
  location?: string | null;
  assigned_to?: string[];
  order_index?: number;
  created_at?: string;
}

export interface Poll {
  id: string;
  event_id: string;
  question: string;
  options: PollOption[];
  is_closed?: boolean;
  created_at?: string;
}

export interface PollOption {
  id: string;
  poll_id?: string;
  label: string;
  vote_count?: number;
}

export interface CrewMember {
  id: string;
  user_id: string;
  name?: string | null;
  email?: string;
  avatar_url?: string | null;
  is_crewing?: boolean;
}

/**
 * Fields common to both partycrew listing endpoints.
 *
 * These rows are NOT `CrewMember`. `CrewMember` describes the crew-membership
 * join row; these describe the profile of a person in a crew list, which the
 * routes assemble from the `profiles` relation plus a computed `is_mutual`.
 *
 * `followed_at` is a `Date` in the route's own type annotation, but it crosses
 * the wire as JSON, so it arrives as an ISO-8601 string. Typing it as `Date`
 * here would be a lie that survives compilation and fails at runtime on the
 * first `.getTime()`.
 */
/**
 * GET /api/users/:id.
 *
 * This route returns the profile FLAT, not wrapped in a `{ profile }`
 * envelope. `/api/users/me/profile` is the one that wraps. The distinction
 * matters: unwrapping a key that is not there yields `null` with no error,
 * which is a silent failure rather than a loud one.
 *
 * The `viewer_*` flags describe the requesting user's relationship to this
 * profile and are absent for anonymous callers, which is why they are
 * optional. `last_active_at` is nulled out when the owner has disabled
 * activity visibility.
 */
export interface UserProfileDetail {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  location: string | null;
  website_url: string | null;

  partycrew_count: number;
  crewing_count: number;
  events_hosted: number;
  haus_score: number;

  is_verified: boolean;
  is_private: boolean;
  account_type: string;

  viewer_is_following?: boolean;
  viewer_is_follower?: boolean;
  viewer_is_mutual?: boolean;
  viewer_has_pending_request?: boolean;
  viewer_is_blocked?: boolean;
  viewer_has_blocked?: boolean;
  mutual_crew_count?: number;

  created_at: string;
  last_active_at: string | null;
}

export type FeedContentType =
  | 'update'
  | 'photo'
  | 'video'
  | 'poll'
  | 'event_announcement'
  | 'tip'
  | 'recap';

/** The creator summary embedded in every feed post. */
export interface FeedPostCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
}

/**
 * A row from GET /api/feed/crew.
 *
 * `feed_score` is computed per request by the ranking pass, not stored, so it
 * is not stable across calls. `poll_options` is a JSON column whose shape
 * depends on `content_type`; it stays `unknown` so callers are forced to
 * narrow it rather than assume.
 */
export interface FeedPost {
  id: string;
  creator: FeedPostCreator;
  content_type: FeedContentType;
  title: string | null;
  body: string | null;
  media_urls: string[];
  event_id: string | null;
  poll_options: unknown;
  poll_ends_at: string | null;

  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;

  viewer_has_liked: boolean;
  viewer_has_commented: boolean;
  viewer_has_shared: boolean;

  published_at: string;
  created_at: string;
  feed_score: number;
}

/**
 * GET /api/feed/crew is cursor-paginated, not offset-paginated.
 * `next_cursor` is null on the final page.
 */
export interface CrewFeedPage {
  posts: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
}

/** Rows from GET /api/users/suggested, which carry a human-readable `reason`. */
export interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  account_type: string;
  events_hosted: number;
  reason: string;
  mutual_crew_count: number;
}

export interface CrewCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_mutual: boolean;
  followed_at: string;
}

/**
 * Rows from GET /api/partycrew/members.
 * `mutual_crew_count` is only populated when the request sets
 * `include_mutual_count=true`; otherwise the key is absent entirely.
 */
export interface CrewMemberRow extends CrewCreator {
  mutual_crew_count?: number;
}

/**
 * Rows from GET /api/partycrew/crewing-with, which selects two profile columns
 * that /members does not.
 */
export interface CrewCreatorRow extends CrewCreator {
  account_type: string;
  events_hosted: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  read_at?: string | null;
  created_at: string;
}

/** POST /api/storage/upload. */
export interface UploadedBlob {
  blobName: string;
  url: string;
}
