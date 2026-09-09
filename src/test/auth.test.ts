import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-auth')>('@/hooks/use-auth');
  return actual;
});

import { useAuth } from '@/hooks/use-auth';
import { setStoredToken, setStoredUser } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';

vi.mock('@/lib/auth', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authService } from '@/lib/auth';

const resetStore = () => {
  usePartyStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    currentPage: 'auth',
    events: [],
    currentEvent: null,
    guests: [],
    loadedEventIds: new Set<string>(),
    fetchingEventId: null,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
  localStorage.clear();
});

describe('useAuth hook', () => {
  it('hydrates the store from an existing stored session', async () => {
    setStoredToken('test-token');
    setStoredUser({ id: 'user-1', email: 'init@example.com', name: 'Init User' });

    renderHook(() => useAuth());
    await waitFor(() => {
      const state = usePartyStore.getState();
      expect(state.isLoading).toBe(false);
    });
    const state = usePartyStore.getState();
    expect(state.user).toMatchObject({
      id: 'user-1',
      email: 'init@example.com',
      name: 'Init User',
    });
  });

  it('stays unauthenticated when no stored session exists', async () => {
    renderHook(() => useAuth());
    await waitFor(() => {
      const state = usePartyStore.getState();
      expect(state.isLoading).toBe(false);
    });
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
  });

  it('signs in a user via auth service', async () => {
    const mockUser = { id: 'user-2', email: 'signin@example.com' };
    vi.mocked(authService.signIn).mockResolvedValue({
      success: true,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.signIn('signin@example.com', 'secret');
    });

    expect(authService.signIn).toHaveBeenCalledWith('signin@example.com', 'secret');
    expect(response).toEqual({ user: mockUser, error: null });
  });

  it('keeps the web store anonymous after tokenless signup', async () => {
    const signupUser = { id: 'user-3', email: 'signup@example.com', name: 'Signup User' };
    vi.mocked(authService.signUp).mockResolvedValue({
      success: true,
      user: signupUser,
      awaitingVerification: true,
    });
    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.signUp('signup@example.com', 'password', 'Signup User', {
        ageEligible: true,
        termsVersion: '2026-09-06',
        privacyVersion: '2026-09-06',
      });
    });

    expect(response).toEqual({ user: signupUser, error: null });
    expect(authService.signUp).toHaveBeenCalledWith('signup@example.com', 'password', 'Signup User', {
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    });
    expect(usePartyStore.getState().user).toBeNull();
    expect(usePartyStore.getState().isAuthenticated).toBe(false);
    expect(usePartyStore.getState().isLoading).toBe(false);
  });

  it('resets the store on sign out', async () => {
    usePartyStore.setState({
      user: { id: 'user-4', email: 'active@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(authService.signOut).toHaveBeenCalledTimes(1);
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
