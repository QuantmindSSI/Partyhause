import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthScreen } from '@/components/AuthScreen';
import { EventCreation } from '@/components/EventCreation';
import { GuestView } from '@/components/GuestView';
import { usePartyStore } from '@/store/usePartyStore';

// Mock QRCodeCanvas
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div data-testid="qr-code">QR Code</div>,
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  },
  isSupabaseConfigured: false,
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
  getStoredUser: vi.fn(),
  setStoredUser: vi.fn(),
  clearAuth: vi.fn(),
}));

// Mock event service
vi.mock('@/lib/events', () => ({
  eventService: {
    getUserEvents: vi.fn(),
    createEvent: vi.fn()
  }
}));

describe('User Creation + Event Creation Integration Tests', () => {
  const mockStore = {
    user: null,
    currentPage: 'auth',
    events: [],
    setUser: vi.fn(),
    setCurrentPage: vi.fn(),
    setEvents: vi.fn(),
    logout: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    usePartyStore.setState(mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Integration Flow', () => {
    it('should render AuthScreen without crashing', () => {
      render(<AuthScreen />);
  expect(screen.getByRole('heading', { name: /partyhause/i })).toBeInTheDocument();
    });

    it('should render EventCreation component when user is authenticated', () => {
      // Setup authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      };

      usePartyStore.setState({
        ...mockStore,
        user: mockUser,
        currentPage: 'create-event'
      });

      render(<EventCreation />);

      // Step 1 of the creation flow is the AI planner.
      expect(screen.getByRole('heading', { name: /ai event planner/i })).toBeInTheDocument();

      // Backing out of the AI step lands on manual template selection.
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText(/choose your event template/i)).toBeInTheDocument();

      // Skipping templates lands on the classic creation form.
      fireEvent.click(screen.getByText(/skip templates and create from scratch/i));
      expect(screen.getByText(/create new event/i)).toBeInTheDocument();
    });

    it('should handle form input changes', () => {
      // Setup authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      };

      usePartyStore.setState({
        ...mockStore,
        user: mockUser,
        currentPage: 'create-event'
      });

      render(<EventCreation />);

      // Navigate past the AI planner and template-selection steps to reach the form.
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      fireEvent.click(screen.getByText(/skip templates and create from scratch/i));

      // Find form inputs
      const eventNameInput = screen.getByLabelText(/event name/i) as HTMLInputElement;
      const locationInput = screen.getByLabelText(/^location/i) as HTMLInputElement;

      // Test input changes propagate to controlled inputs
      fireEvent.change(eventNameInput, { target: { value: 'Test Party' } });
      fireEvent.change(locationInput, { target: { value: 'Test Venue' } });

      expect(eventNameInput.value).toBe('Test Party');
      expect(locationInput.value).toBe('Test Venue');
    });
  });

  describe('Guest View Integration Flow', () => {
    const mockStore = {
      events: [],
      guests: [],
      currentEvent: null,
      setGuests: vi.fn(),
      setEvents: vi.fn(),
      setCurrentEvent: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      usePartyStore.setState(mockStore);
    });

    it('should complete guest invitation to QR display flow', async () => {
      const mockGuest = {
        id: 'guest-123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        event_id: 'event-123',
        is_checked_in: false,
        status: 'pending' as const,
        plus_ones: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };
      const mockEvent = {
        id: 'event-123',
        name: 'Birthday Party',
        event_date: '2025-01-01T12:00:00Z',
        location: 'Home',
        spotify_playlist_url: 'https://open.spotify.com/playlist/test',
        host_id: 'host-123',
        start_date: '2025-01-01T12:00:00Z',
        end_date: '2025-01-01T18:00:00Z',
        event_type: 'single_day' as const,
        is_public: false,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      };

      // Mock store with data
      usePartyStore.setState({
        ...mockStore,
        guests: [mockGuest],
        events: [mockEvent],
      });

      render(<GuestView guestId="guest-123" />);

      // Check initial display
      expect(screen.getByText("You're Invited!")).toBeInTheDocument();
      expect(screen.getByText('Birthday Party')).toBeInTheDocument();

      // Click show QR
      const qrButton = screen.getByText('Show My QR Code');
      fireEvent.click(qrButton);

      // Check QR displayed
      expect(screen.getByText('Your Entry QR Code')).toBeInTheDocument();

      // Check for Spotify playlist presence by src
      const iframe = document.querySelector('iframe[src*="spotify"]');
      expect(iframe).toBeInTheDocument();
    });
  });
});
