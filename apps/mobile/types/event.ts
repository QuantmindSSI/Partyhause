/**
 * Centralized Event Type Definitions
 * 
 * This file contains all event-related TypeScript interfaces and types.
 * DO NOT create duplicate Event interfaces in component files.
 * 
 * Usage:
 *   import { Event, EventSummary, EventDetail } from '@/types/event';
 */

/**
 * Core Event interface - represents a complete event record from the database
 */
export interface Event {
  // Core identification
  id: string;
  /**
   * Optional, because the `title` column is nullable. `name` is the NOT NULL
   * one. Declaring this required made every read look safe while the value
   * could legitimately be null, which rendered a blank heading.
   * Use `getEventTitle` rather than reading either field directly.
   */
  title?: string | null;
  /** Nullable column, so null is a real value here, not just absence. */
  description?: string | null;
  
  // Location details
  location?: string | { name?: string; address?: string; lat?: number; lng?: number };
  venue?: string;
  
  // Timing
  date?: string;
  start_date?: string; // Alternative field name used in some components
  event_date?: string; // Another alternative field name
  end_date?: string;
  
  // Host information
  name?: string; // Event name (alternative to title)
  host_id?: string;
  host?: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  
  // Visual and branding
  image_url?: string;
  /**
   * Nullable column. The "create from scratch" flow legitimately has no
   * template, so this is absent on those events.
   */
  template_type?: string;
  
  // Privacy and settings
  visibility?: 'private' | 'public' | 'network' | 'group';
  privacy?: 'public' | 'private' | 'unlisted'; // Alternative field name
  settings?: Record<string, any>; // JSONB field for template-specific data
  /**
   * Matches the CHECK constraint on events.status.
   *
   * 'cancelled' was removed from this union once, correctly: the constraint
   * did not accept it and a write of it failed. The migration
   * 20260905000200_core_integrity_constraints restores it to the constraint,
   * and POST /api/mvp/events/:id/cancel writes it, so the value can now come
   * back over the wire and this type has to admit it.
   *
   * Reading it is safe on any database. Writing it is not: it only succeeds
   * once that migration has been applied. The cancel control in
   * app/events/[id]/index.tsx therefore still writes 'archived', which is
   * accepted before and after, and must not be switched until the migration
   * is deployed everywhere.
   */
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled' | 'archived';
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  
  // Optional extended fields
  guest_count?: number;
  rsvp_count?: number;
  spotify_playlist_url?: string; // Spotify integration
}

/**
 * Minimal event summary for lists, cards, and carousels
 * Use this for dashboard and browse views
 */
export type EventSummary = Pick<Event, 
  | 'id' 
  | 'title' 
  | 'date' 
  | 'location' 
  | 'image_url' 
  | 'description' 
  | 'template_type'
>;

/**
 * Full event details with required host info
 * Use this for detail screens where host is always present
 */
export interface EventDetail extends Event {
  host: Required<Event>['host'];
  guest_count: number;
  rsvp_count: number;
}

/**
 * Event statistics for analytics and dashboards
 */
export interface EventStats {
  total_guests: number;
  confirmed_guests: number;
  declined_guests: number;
  pending_guests: number;
  checked_in: number;
  views?: number;
  shares?: number;
}

/**
 * Event with computed statistics
 */
export interface EventWithStats extends Event {
  stats: EventStats;
}

/**
 * Event creation/update payload
 */
export interface EventFormData {
  title: string;
  description: string;
  location: string;
  venue?: string;
  date: string;
  end_date?: string;
  image_url?: string;
  template_type: string;
  visibility: 'private' | 'public' | 'network' | 'group';
  settings?: Record<string, any>;
}

/**
 * Event filter/search parameters
 */
export interface EventFilters {
  template_type?: string[];
  visibility?: string[];
  date_from?: string;
  date_to?: string;
  location?: string;
  search?: string;
  host_id?: string;
}

/**
 * Type guards for event types
 */
export function isEventDetail(event: Event | EventDetail): event is EventDetail {
  return (event as EventDetail).guest_count !== undefined;
}

export function isEventWithStats(event: Event | EventWithStats): event is EventWithStats {
  return (event as EventWithStats).stats !== undefined;
}

/**
 * Resolve the display name of an event.
 *
 * There are two name columns. `name` is NOT NULL and written by the classic
 * creation form; `title` is nullable and written by the template flows.
 * POST /api/events accepts either and populates both, but older rows and
 * partial writes mean neither can be assumed present.
 *
 * Four screens each open-coded `event.name || event.title || 'Untitled Event'`
 * and a fifth read `event.title` alone, which rendered an empty heading when
 * the column was null. This is that rule in one place.
 */
export function getEventTitle(event: Pick<Event, 'name' | 'title'>): string {
  return event.name || event.title || 'Untitled Event';
}

/**
 * Utility functions
 */
export function getEventLocation(event: Event): string {
  if (typeof event.location === 'string') {
    return event.location;
  }
  if (event.location?.name) {
    return event.location.name;
  }
  if (event.location?.address) {
    return event.location.address;
  }
  return event.venue || 'Location TBD';
}
