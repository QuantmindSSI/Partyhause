import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-auth')>('@/hooks/use-auth');
  return actual;
});

import { useAuth } from '@/hooks/use-auth';
import { getStoredToken, setStoredToken, setStoredUser, clearAuth } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';

type AuthServiceMock = {
  signIn: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
};

vi.mock('@/lib/auth', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    resendVerification: vi.fn(),
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
    (authService.signIn as any).mockResolvedValue({
      success: true,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.signIn('signin@example.com', 'secret');
    });

    expect(authService.signIn).toHaveBeenCalledWith('signin@example.com', 'secret');
    // `needsEmailVerification` is part of the contract now. The hook used to
    // return only `{ user, error }`, which discarded the one thing that tells
    // the UI whether to offer a resend or a reset.
    expect(response).toEqual({ user: mockUser, error: null, needsEmailVerification: false });
  });

  it('forwards needsEmailVerification so the UI can offer a resend', async () => {
    // A correct password on an unconfirmed address. authService separates this
    // from a 401 on purpose; the hook dropped the distinction, so AuthScreen
    // showed the same alert for both and the user had no way forward.
    (authService.signIn as any).mockResolvedValue({
      success: false,
      needsEmailVerification: true,
      error: 'Please confirm your email address before signing in.',
    });

    const { result } = renderHook(() => useAuth());

    let response: any;
    await act(async () => {
      response = await result.current.signIn('unconfirmed@example.com', 'correct-password');
    });

    expect(response.needsEmailVerification).toBe(true);
    expect(response.user).toBeFalsy();
    expect(response.error).toBeInstanceOf(Error);
  });

  it('exposes the two recovery actions the login screen needs', async () => {
    // Both endpoints were live and neither had a caller, which is why an
    // unconfirmed account had no route back in.
    (authService.resetPassword as any).mockResolvedValue({ success: true });
    (authService.resendVerification as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());

    let reset: any;
    let resend: any;
    await act(async () => {
      reset = await result.current.requestPasswordReset('locked-out@example.com');
      resend = await result.current.resendVerification('locked-out@example.com');
    });

    expect(authService.resetPassword).toHaveBeenCalledWith('locked-out@example.com');
    expect(authService.resendVerification).toHaveBeenCalledWith('locked-out@example.com');
    expect(reset).toEqual({ success: true, error: null });
    expect(resend).toEqual({ success: true, error: null });
  });

  it('resets the store on sign out', async () => {
    usePartyStore.setState({
      user: { id: 'user-4', email: 'active@example.com' } as any,
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
