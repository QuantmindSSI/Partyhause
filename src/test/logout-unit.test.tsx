import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

// Mock event service
vi.mock('@/lib/events', () => ({
  eventService: {
    getUserEvents: vi.fn(),
    createEvent: vi.fn()
  }
}));

describe('Logout Functionality Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockEvent = {
    id: 'test-event-id',
    host_id: 'test-user-id',
    name: 'Test Event',
    event_date: '2025-01-01T12:00:00Z',
    location: 'Test Location',
    spotify_playlist_url: 'https://spotify.com/test'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store to initial state
    usePartyStore.setState({
      user: null,
      isAuthenticated: false,
      currentPage: 'auth',
      events: [],
      currentEvent: null,
      guests: [],
      loadedEventIds: new Set<string>(),
      fetchingEventId: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear user state on logout', () => {
    // Setup: User is logged in
    usePartyStore.setState({
      user: mockUser,
      isAuthenticated: true,
      currentPage: 'dashboard',
      events: [mockEvent],
      currentEvent: mockEvent,
      guests: [],
      isLoading: false,
    });

    // Mock signOut to resolve successfully
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Verify store state is cleared
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentPage).toBe('auth');
    expect(state.events).toEqual([]);
    expect(state.currentEvent).toBeNull();
    expect(state.guests).toEqual([]);

    // Verify supabase signOut was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle logout when currentEvent exists but events array is empty', () => {
    // Setup: User logged in but with persisted currentEvent and empty events array
    // This simulates the scenario that caused the blank page
    usePartyStore.setState({
      user: mockUser,
      isAuthenticated: true,
      currentPage: 'dashboard',
      events: [], // Empty events array
      currentEvent: mockEvent, // But currentEvent is persisted
      guests: [],
      isLoading: false,
    });

    // Mock signOut to resolve successfully
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Verify store state is properly cleared
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.currentPage).toBe('auth');
    expect(state.events).toEqual([]);
    expect(state.currentEvent).toBeNull();
    expect(state.guests).toEqual([]);
  });

  it('should handle logout failure gracefully', () => {
    // Setup: User is logged in
    usePartyStore.setState({
      user: mockUser,
      isAuthenticated: true,
      currentPage: 'dashboard',
      events: [mockEvent],
      currentEvent: mockEvent,
      guests: [],
      isLoading: false,
    });

    // Mock signOut to fail
    (supabase.auth.signOut as any).mockResolvedValue({
      error: { message: 'Network error' },
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Verify store state is cleared even with signOut error
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.currentPage).toBe('auth');
    expect(state.events).toEqual([]);
    expect(state.currentEvent).toBeNull();
  });

  it('should reset loadedEventIds on logout', () => {
    // Setup: User is logged in with some loaded events
    usePartyStore.setState({
      user: mockUser,
      isAuthenticated: true,
      currentPage: 'dashboard',
      events: [mockEvent],
      currentEvent: mockEvent,
      guests: [],
      loadedEventIds: new Set(['event-1', 'event-2']),
      isLoading: false,
    });

    // Mock signOut to resolve successfully
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Verify loadedEventIds is reset
    const state = usePartyStore.getState();
    expect(state.loadedEventIds).toEqual(new Set<string>());
  });

  it('should set currentPage to auth on logout', () => {
    // Setup: User is on different pages
    const pages = ['dashboard', 'create-event', 'event-management'];

    pages.forEach(page => {
      usePartyStore.setState({
        user: mockUser,
        isAuthenticated: true,
        currentPage: page,
        events: [mockEvent],
        currentEvent: mockEvent,
        guests: [],
        isLoading: false,
      });

      // Mock signOut
      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      // Trigger logout
      const { logout } = usePartyStore.getState();
      logout();

      // Verify currentPage is set to auth
      const state = usePartyStore.getState();
      expect(state.currentPage).toBe('auth');
    });
  });
});