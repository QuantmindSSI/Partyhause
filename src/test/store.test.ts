import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePartyStore, type Event as PartyEvent, type Guest as PartyGuest } from '../store/usePartyStore';

// Helper builders for strongly-typed test data
const buildEvent = (overrides: Partial<PartyEvent> = {}): PartyEvent => {
  const timestamp = new Date().toISOString();
  return {
    id: 'event-1',
    host_id: 'host-1',
    name: 'Test Event',
    description: 'Description',
    start_date: timestamp,
    end_date: timestamp,
    event_type: 'single_day',
    location: 'Test Location',
    max_guests: 100,
    is_public: false,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
};

const buildGuest = (overrides: Partial<PartyGuest> = {}): PartyGuest => {
  const timestamp = new Date().toISOString();
  return {
    id: 'guest-1',
    event_id: 'event-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: undefined,
    status: 'pending',
    plus_ones: 0,
    special_requirements: undefined,
    checked_in_at: undefined,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
};

// Mock eventService
vi.mock('@/lib/events', () => ({
  eventService: {
    getUserEvents: vi.fn().mockResolvedValue([]),
    getEventGuests: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(),
      })),
    })),
  },
  isSupabaseConfigured: false,
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
  getStoredUser: vi.fn(),
  setStoredUser: vi.fn(),
  clearAuth: vi.fn(),
}));

describe('Party Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => usePartyStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('Authentication State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePartyStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentPage).toBe('auth');
      expect(result.current.events).toEqual([]);
      expect(result.current.currentEvent).toBeNull();
      expect(result.current.guests).toEqual([]);
    });

    it('should update user state correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      const testUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      act(() => {
        result.current.setUser(testUser);
      });

      // Check that user was set (allowing for store to add user_metadata)
      expect(result.current.user?.id).toBe(testUser.id);
      expect(result.current.user?.email).toBe(testUser.email);
      expect(result.current.user?.name).toBe(testUser.name);
      expect(result.current.isAuthenticated).toBe(true);
      // Note: currentPage is no longer automatically set by setUser
      // The routing logic is handled by App.tsx useEffect
      expect(result.current.currentPage).toBe('auth'); // Default value
    });

    it('should handle logout correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      // First set a user
      act(() => {
        result.current.setUser({
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        });
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentPage).toBe('auth');
      expect(result.current.events).toEqual([]);
      expect(result.current.currentEvent).toBeNull();
      expect(result.current.guests).toEqual([]);
    });
  });

  describe('Event Management', () => {
    it('should set events correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      const testEvents: PartyEvent[] = [
        buildEvent({ id: 'event-1', name: 'Test Event 1' }),
        buildEvent({ id: 'event-2', name: 'Test Event 2' }),
      ];

      act(() => {
        result.current.setEvents(testEvents);
      });

      expect(result.current.events).toEqual(testEvents);
    });

    it('should set current event correctly', async () => {
      const { result } = renderHook(() => usePartyStore());

      const testEvent = buildEvent({ id: 'event-3', name: 'Current Event' });

      await act(async () => {
        await result.current.setCurrentEvent(testEvent);
      });

      expect(result.current.currentEvent).toEqual(testEvent);
    });

    it('should prevent duplicate user setting', () => {
      const { result } = renderHook(() => usePartyStore());

      const testUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Set user first time
      act(() => {
        result.current.setUser(testUser);
      });

      const firstCallUser = result.current.user;

      // Try to set the same user again
      act(() => {
        result.current.setUser(testUser);
      });

      // Should be the same user data (store prevents unnecessary updates)
      expect(result.current.user?.id).toBe(firstCallUser?.id);
      expect(result.current.user?.email).toBe(firstCallUser?.email);
      expect(result.current.user?.name).toBe(firstCallUser?.name);
    });
  });

  describe('Guest Management', () => {
    it('should add guest correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      const testGuest = buildGuest();

      act(() => {
        result.current.addGuest(testGuest);
      });

      expect(result.current.guests).toContain(testGuest);
      expect(result.current.guests).toHaveLength(1);
    });

    it('should update guest correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      const testGuest = buildGuest();

      // Add guest first
      act(() => {
        result.current.addGuest(testGuest);
      });

      // Update guest
      act(() => {
        result.current.updateGuest(testGuest.id, { status: 'checked_in' });
      });

      expect(result.current.guests[0].status).toBe('checked_in');
      expect(result.current.guests[0].name).toBe('John Doe'); // Other fields unchanged
    });
  });

  describe('Navigation', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => usePartyStore());

      act(() => {
        result.current.setCurrentPage('dashboard');
      });

      expect(result.current.currentPage).toBe('dashboard');
    });

    it('should not update page if same value', () => {
      const { result } = renderHook(() => usePartyStore());

      act(() => {
        result.current.setCurrentPage('auth');
      });

      const firstCallPage = result.current.currentPage;

      act(() => {
        result.current.setCurrentPage('auth');
      });

      // Should be the same value (no unnecessary updates)
      expect(result.current.currentPage).toBe(firstCallPage);
    });
  });

  describe('Loading States', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => usePartyStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
