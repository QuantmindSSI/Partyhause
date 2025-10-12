import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GuestView } from '@/components/GuestView';
import { supabase } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div data-testid="qr-code">QR Code</div>,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/events', () => ({
  eventService: {
    getEventGuests: vi.fn().mockResolvedValue([]),
  },
}));

const resetStore = () => {
  usePartyStore.setState({
    user: null,
    isAuthenticated: false,
    currentPage: 'auth',
    events: [],
    currentEvent: null,
    guests: [],
    isLoading: false,
    loadedEventIds: new Set<string>(),
    fetchingEventId: null,
  });
};

const createSelectChain = (resolver: () => Promise<any>) => ({
  select: () => ({
    eq: () => ({
      maybeSingle: resolver,
    }),
  }),
});

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('GuestView Component', () => {
  const supabaseFrom = supabase.from as any;

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    (eventService.getEventGuests as any).mockResolvedValue([]);
  });

  afterEach(() => {
    resetStore();
  });

  it('should show loading when fetching guest data', () => {
    supabaseFrom.mockImplementation(() => createSelectChain(() => new Promise(() => {})));

    render(<GuestView guestId="guest-123" />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display event details when guest and event exist in store', () => {
    const mockGuest = {
      id: 'guest-1',
      name: 'John Doe',
      email: 'john@example.com',
      event_id: 'event-1',
    };
    const mockEvent = {
      id: 'event-1',
      name: 'Test Party',
      start_date: '2025-01-01T12:00:00Z',
      end_date: '2025-01-01T15:00:00Z',
      event_type: 'single_day' as const,
      location: 'Test Location',
      host_id: 'host-1',
      description: '',
      date: '2025-01-01',
      max_guests: 50,
      is_public: true,
      invite_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    usePartyStore.setState({
      guests: [mockGuest as any],
      events: [mockEvent as any],
      currentEvent: mockEvent as any,
    });

    render(<GuestView guestId="guest-1" />);

    expect(screen.getByText("You're Invited!")).toBeInTheDocument();
    expect(screen.getByText('Test Party')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should toggle QR code visibility', () => {
    const mockGuest = {
      id: 'guest-qr',
      name: 'Jane Smith',
      email: 'jane@example.com',
      event_id: 'event-qr',
    };
    const mockEvent = {
      id: 'event-qr',
      name: 'QR Party',
      start_date: '2025-05-01T18:00:00Z',
      end_date: '2025-05-01T21:00:00Z',
      event_type: 'single_day' as const,
      location: 'Venue 42',
      host_id: 'host-qr',
      description: '',
      date: '2025-05-01',
      max_guests: 100,
      is_public: true,
      invite_image_url: null,
      created_at: '2024-05-01T00:00:00Z',
      updated_at: '2024-05-01T00:00:00Z',
    };

    usePartyStore.setState({
      guests: [mockGuest as any],
      events: [mockEvent as any],
      currentEvent: mockEvent as any,
    });

    render(<GuestView guestId="guest-qr" />);

    const showButton = screen.getByText('Show My QR Code');
    fireEvent.click(showButton);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide QR Code');
    fireEvent.click(hideButton);
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

});
