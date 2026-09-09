import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';
import { JoinEventPage } from '@/components/JoinEventPage';
import { useAuth } from '@/hooks/use-auth';
import { resolveRsvp, submitRsvp, type BrowserRsvpInvitation } from '@/lib/rsvp-client';

vi.mock('@/lib/rsvp-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rsvp-client')>();
  return { ...actual, resolveRsvp: vi.fn(), submitRsvp: vi.fn() };
});

const invitation: BrowserRsvpInvitation = {
  event: {
    name: 'Dinner',
    hostName: 'Ada Host',
    start: '2030-02-01T18:00:00.000Z',
    end: '2030-02-01T20:00:00.000Z',
    timezone: 'UTC',
    location: 'Main Hall',
  },
  rsvp: { status: 'pending', revision: 3, respondedAt: null },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/join/token-value']}>
      <Routes><Route path="/join/:token" element={<JoinEventPage />} /></Routes>
    </MemoryRouter>,
  );
}

describe('browser RSVP page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('shows a read-only loading state before resolve completes', () => {
    vi.mocked(resolveRsvp).mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading your invitation');
    expect(submitRsvp).not.toHaveBeenCalled();
  });

  it('shows one privacy-safe unavailable state', async () => {
    vi.mocked(resolveRsvp).mockResolvedValue({
      data: null,
      error: { status: 404, code: 'RSVP_UNAVAILABLE', message: 'This invitation is unavailable' },
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Invitation unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy.html');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support.html');
    expect(submitRsvp).not.toHaveBeenCalled();
  });

  it('resolves without mutation and submits one explicit revision-bound response', async () => {
    vi.mocked(resolveRsvp).mockResolvedValue({ data: invitation, error: null });
    vi.mocked(submitRsvp).mockResolvedValue({
      data: {
        ...invitation,
        rsvp: { status: 'maybe', revision: 4, respondedAt: '2030-01-01T00:00:00.000Z' },
      },
      error: null,
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Dinner' })).toBeInTheDocument();
    expect(screen.getByText('Hosted by Ada Host')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('Awaiting your response')).toBeInTheDocument();
    expect(submitRsvp).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: /Maybe/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));

    await waitFor(() => expect(submitRsvp).toHaveBeenCalledWith('token-value', 'maybe', 3));
    expect(await screen.findByText('Your response is now maybe.')).toBeInTheDocument();
    expect(screen.getByText('Maybe', { selector: 'p' })).toBeInTheDocument();
  });

  it('mounts the public route without initializing the authenticated application', async () => {
    window.history.replaceState({}, '', '/join/token-value');
    vi.mocked(resolveRsvp).mockResolvedValue({ data: invitation, error: null });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Dinner' })).toBeInTheDocument();
    expect(useAuth).not.toHaveBeenCalled();
  });
});
