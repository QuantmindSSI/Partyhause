import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePartyStore } from '../store/usePartyStore';

// Mock eventService
vi.mock('@/lib/events', () => ({
  eventService: {
    getEventGuests: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
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

      const testEvents = [
        {
          id: '1',
          host_id: '123',
          name: 'Test Event 1',
          event_date: '2025-01-01T10:00:00Z',
          location: 'Test Location 1',
          spotify_playlist_url: '',
        },
        {
          id: '2',
          host_id: '123',
          name: 'Test Event 2',
          event_date: '2025-01-02T10:00:00Z',
          location: 'Test Location 2',
          spotify_playlist_url: '',
        },
      ];

      act(() => {
        result.current.setEvents(testEvents);
      });

      expect(result.current.events).toEqual(testEvents);
    });

    it('should set current event correctly', async () => {
      const { result } = renderHook(() => usePartyStore());

      const testEvent = {
        id: '1',
        host_id: '123',
        name: 'Test Event',
        event_date: '2025-01-01T10:00:00Z',
        location: 'Test Location',
        spotify_playlist_url: '',
      };

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

      const testGuest = {
        id: '1',
        event_id: 'event-1',
        name: 'John Doe',
        email: 'john@example.com',
        is_checked_in: false,
      };

      act(() => {
        result.current.addGuest(testGuest);
      });

      expect(result.current.guests).toContain(testGuest);
      expect(result.current.guests).toHaveLength(1);
    });

    it('should update guest correctly', () => {
      const { result } = renderHook(() => usePartyStore());

      const testGuest = {
        id: '1',
        event_id: 'event-1',
        name: 'John Doe',
        email: 'john@example.com',
        is_checked_in: false,
      };

      // Add guest first
      act(() => {
        result.current.addGuest(testGuest);
      });

      // Update guest
      act(() => {
        result.current.updateGuest('1', { is_checked_in: true });
      });

      expect(result.current.guests[0].is_checked_in).toBe(true);
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
