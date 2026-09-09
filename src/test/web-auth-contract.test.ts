import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authService } from '@/lib/auth';
import { getStoredToken, setStoredToken, setStoredUser } from '@/lib/supabase';

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('web auth request contract', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('submits the exact current consent values at signup', async () => {
    fetchMock.mockResolvedValue(response({
      user: { id: 'user-1', email: 'host@example.com', name: 'Host' },
      verificationDelivery: 'accepted',
      message: 'Check your email',
    }));

    await authService.signUp('host@example.com', 'strong-password', 'Host', {
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    });

    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'host@example.com',
      password: 'strong-password',
      name: 'Host',
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    });
  });

  it('sends the bearer token before clearing the local session on logout', async () => {
    setStoredToken('session-token');
    setStoredUser({ id: 'user-1', email: 'host@example.com' });
    fetchMock.mockResolvedValue(response({ success: true }));

    await authService.signOut();

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer session-token');
    expect(getStoredToken()).toBeNull();
  });
});
