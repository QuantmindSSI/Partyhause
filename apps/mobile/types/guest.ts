/**
 * Centralized Guest Type Definitions
 * 
 * This file contains all guest-related TypeScript interfaces and types.
 * DO NOT create duplicate Guest interfaces in component files.
 * 
 * Usage:
 *   import { Guest, GuestWithSelection, GuestFormData } from '@/types/guest';
 */

/**
 * Core Guest interface - represents a guest record from the database
 */
export interface Guest {
  // Identification
  id: string;
  event_id: string;
  
  // Personal info
  name: string;
  email: string;
  phone?: string;
  
  // RSVP status
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  rsvp_at?: string;
  
  // Event day
  checked_in?: boolean;
  is_checked_in?: boolean; // Alternative field name
  checked_in_at?: string;
  
  // Additional info
  plus_one?: boolean;
  plus_one_name?: string;
  dietary_restrictions?: string;
  notes?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  invited_at?: string;
  
  // Communication tracking
  email_sent?: boolean;
  email_opened?: boolean;
  email_clicked?: boolean;
}

/**
 * Guest with selection state (for batch operations)
 * Use this in invite sending and bulk actions
 */
export interface GuestWithSelection extends Guest {
  selected: boolean;
}

/**
 * Minimal guest info for lists
 */
export type GuestSummary = Pick<Guest,
  | 'id'
  | 'name'
  | 'email'
  | 'status'
  | 'checked_in'
>;

/**
 * Guest creation/invitation form data
 */
export interface GuestFormData {
  name: string;
  email: string;
  phone?: string;
  plus_one?: boolean;
  plus_one_name?: string;
  dietary_restrictions?: string;
  notes?: string;
  send_invitation?: boolean;
}

/**
 * Guest statistics for event dashboard
 */
export interface GuestStats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  maybe: number;
  checked_in: number;
  plus_ones: number;
}

/**
 * Guest filter/search parameters
 */
export interface GuestFilters {
  status?: Guest['status'][];
  checked_in?: boolean;
  has_plus_one?: boolean;
  search?: string;
}

/**
 * Type guards
 */
export function hasSelection(guest: Guest | GuestWithSelection): guest is GuestWithSelection {
  return (guest as GuestWithSelection).selected !== undefined;
}

export function isConfirmed(guest: Guest): boolean {
  return guest.status === 'accepted';
}

export function isCheckedIn(guest: Guest): boolean {
  return guest.checked_in === true;
}
