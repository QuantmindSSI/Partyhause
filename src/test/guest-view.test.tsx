import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuestView } from '@/components/GuestView';
import { supabase } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';

// Mock QRCodeCanvas
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div data-testid="qr-code">QR Code</div>,
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock Zustand store
vi.mock('@/store/usePartyStore', () => ({
  usePartyStore: vi.fn(),
}));

describe('GuestView Component', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      events: [],
      guests: [],
      currentEvent: null,
      setGuests: vi.fn(),
      setEvents: vi.fn(),
      setCurrentEvent: vi.fn(),
    };
    (usePartyStore as any).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading when fetching guest data', () => {
    mockStore.guests = [];
    mockStore.events = [];

    // Mock fetch to be pending
    const mockMaybeSingle = vi.fn(() => new Promise(() => {}));
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    render(<GuestView guestId="test-guest-id" />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show not found when guest does not exist', async () => {
    mockStore.guests = [];
    mockStore.events = [];

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null });
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    render(<GuestView guestId="invalid-guest-id" />);

    await waitFor(() => {
      expect(screen.getByText('Invitation Not Found')).toBeInTheDocument();
    });
  });

  it('should display event details when guest and event exist', () => {
    const mockGuest = {
      id: 'test-guest-id',
      name: 'John Doe',
      email: 'john@example.com',
      event_id: 'test-event-id',
    };
    const mockEvent = {
      id: 'test-event-id',
      name: 'Test Party',
      event_date: '2025-01-01T12:00:00Z',
      location: 'Test Location',
      spotify_playlist_url: 'https://open.spotify.com/playlist/test',
    };

    mockStore.guests = [mockGuest];
    mockStore.events = [mockEvent];

    render(<GuestView guestId="test-guest-id" />);

    expect(screen.getByText("You're Invited!")).toBeInTheDocument();
    expect(screen.getByText('Test Party')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('should show QR code when button is clicked', () => {
    const mockGuest = {
      id: 'test-guest-id',
      name: 'John Doe',
      email: 'john@example.com',
      event_id: 'test-event-id',
      is_checked_in: false,
    };
    const mockEvent = {
      id: 'test-event-id',
      name: 'Test Party',
      event_date: '2025-01-01T12:00:00Z',
      location: 'Test Location',
    };

    mockStore.guests = [mockGuest];
    mockStore.events = [mockEvent];

    render(<GuestView guestId="test-guest-id" />);

    const qrButton = screen.getByText('Show My QR Code');
    fireEvent.click(qrButton);

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('should hide QR code when hide button is clicked', () => {
    const mockGuest = {
      id: 'test-guest-id',
      name: 'John Doe',
      email: 'john@example.com',
      event_id: 'test-event-id',
      is_checked_in: false,
    };
    const mockEvent = {
      id: 'test-event-id',
      name: 'Test Party',
      event_date: '2025-01-01T12:00:00Z',
      location: 'Test Location',
    };

    mockStore.guests = [mockGuest];
    mockStore.events = [mockEvent];

    render(<GuestView guestId="test-guest-id" />);

    const qrButton = screen.getByText('Show My QR Code');
    fireEvent.click(qrButton);

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide QR Code');
    fireEvent.click(hideButton);

    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('should fetch guest and event if not in store', async () => {
    mockStore.guests = [];
    mockStore.events = [];

    const mockGuest = {
      id: 'test-guest-id',
      name: 'John Doe',
      email: 'john@example.com',
      event_id: 'test-event-id',
      is_checked_in: false,
    };
    const mockEvent = {
      id: 'test-event-id',
      name: 'Test Party',
      event_date: '2025-01-01T12:00:00Z',
      location: 'Test Location',
      host_id: 'host-123',
    };

    const mockGuestMaybeSingle = vi.fn().mockResolvedValue({ data: mockGuest });
    const mockEventMaybeSingle = vi.fn().mockResolvedValue({ data: mockEvent });

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockGuestMaybeSingle,
          })),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockEventMaybeSingle,
          })),
        })),
      });

    (supabase.from as any).mockImplementation(mockFrom);

    render(<GuestView guestId="test-guest-id" />);

    await waitFor(() => {
      expect(mockStore.setGuests).toHaveBeenCalledWith([mockGuest]);
      expect(mockStore.setEvents).toHaveBeenCalledWith([mockEvent]);
      expect(mockStore.setCurrentEvent).toHaveBeenCalledWith(mockEvent);
    });
  });
});
