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
  created_at: string;
  updated_at: string;
}

export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe' | 'confirmed';

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvp_status?: RsvpStatus;
  checked_in?: boolean;
  plus_ones: number;
  special_requirements?: string;
  checked_in_at?: string;
  created_at: string;
}

export interface TimelineBlock {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
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
