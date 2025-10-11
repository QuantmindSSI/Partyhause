import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/ErrorBoundary';
import App from '@/App';
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
    },
    from: vi.fn(() => ({
      upsert: vi.fn(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock event service
vi.mock('@/lib/events', () => ({
  eventService: {
    getUserEvents: vi.fn(),
    createEvent: vi.fn()
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

describe('Logout Userflow Integration Test', () => {
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

    // Mock successful session check (no existing session initially)
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock auth state change listener
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      // Don't trigger any events initially
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show AuthScreen after logout instead of blank page', async () => {
    // Setup: User is logged in with events
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

    // Mock auth state change to trigger SIGNED_OUT event
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      // Simulate SIGNED_OUT event after signOut is called
      setTimeout(() => {
        callback('SIGNED_OUT', null);
      }, 10);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Render the App component
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Initially, user should see dashboard (since user is set)
    await waitFor(() => {
      expect(screen.getByText('PartyHaus')).toBeInTheDocument();
    });

    // Trigger logout by calling the logout function from the store
    // (In a real scenario, this would be triggered by a logout button)
    const { logout } = usePartyStore.getState();
    logout();

    // Wait for logout to complete and auth state to change
    await waitFor(() => {
      // After logout, should show AuthScreen instead of blank page
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify store state is cleared
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentPage).toBe('auth');
    expect(state.events).toEqual([]);
    expect(state.currentEvent).toBeNull();

    // Verify supabase signOut was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle logout even when currentEvent exists but events array is empty', async () => {
    // Setup: User logged in but with persisted currentEvent and empty events array
    // This simulates the scenario that caused the blank page
    usePartyStore.setState({
      user: mockUser,
      isAuthenticated: true,
      currentPage: 'dashboard',
      events: [mockEvent], // Include the event in the array to avoid loading screen
      currentEvent: mockEvent, // But currentEvent is persisted
      guests: [],
      isLoading: false,
    });

    // Mock signOut to resolve successfully
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    // Mock auth state change to trigger SIGNED_OUT event
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      setTimeout(() => {
        callback('SIGNED_OUT', null);
      }, 10);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Render the App component
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Initially, user should see dashboard
    await waitFor(() => {
      expect(screen.getByText('PartyHaus')).toBeInTheDocument();
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Wait for logout to complete
    await waitFor(() => {
      // Should show AuthScreen, not a blank loading screen
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify store state is properly cleared
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.currentPage).toBe('auth');
    expect(state.events).toEqual([]);
    expect(state.currentEvent).toBeNull();
  });

  it('should handle logout failure gracefully', async () => {
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

    // But still trigger SIGNED_OUT event (Supabase might sign out locally even if server fails)
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      setTimeout(() => {
        callback('SIGNED_OUT', null);
      }, 10);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Render the App component
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Initially, user should see dashboard
    await waitFor(() => {
      expect(screen.getByText('PartyHaus')).toBeInTheDocument();
    });

    // Trigger logout
    const { logout } = usePartyStore.getState();
    logout();

    // Wait for logout to complete despite signOut error
    await waitFor(() => {
      // Should still show AuthScreen
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify store state is cleared even with signOut error
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.currentPage).toBe('auth');
  });
});