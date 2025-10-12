import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-auth')>('@/hooks/use-auth');
  return actual;
});

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';

declare global {
  interface Window {
    requestIdleCallback?: (callback: (...args: any[]) => void) => number;
  }
}

type AuthStateHandler = (event: string, session: unknown) => void | Promise<void>;

type SupabaseAuthMock = {
  getSession: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
};

const supabaseAuth = supabase.auth as unknown as SupabaseAuthMock;

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

const waitForAsyncQueue = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useAuth hook', () => {
  let originalRequestIdleCallback: typeof window.requestIdleCallback;
  let authStateHandler: AuthStateHandler | undefined;

  beforeAll(() => {
    originalRequestIdleCallback = window.requestIdleCallback;
    const immediate = (callback: (...args: any[]) => void) => {
      callback({});
      return 1;
    };
    window.requestIdleCallback = immediate;
  });

  afterAll(() => {
    if (originalRequestIdleCallback) {
      window.requestIdleCallback = originalRequestIdleCallback;
    } else {
      delete window.requestIdleCallback;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    authStateHandler = undefined;

    (eventService.getUserEvents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    supabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    supabaseAuth.signOut.mockResolvedValue({ error: null });
    supabaseAuth.onAuthStateChange.mockImplementation((callback: AuthStateHandler) => {
      authStateHandler = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    authStateHandler = undefined;
  });

  const triggerAuthEvent = async (event: string, session: unknown) => {
    if (!authStateHandler) throw new Error('Auth state handler not registered');
    await act(async () => {
      await authStateHandler?.(event, session);
    });
    await waitForAsyncQueue();
  };

  it('hydrates the store from an existing session', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'init@example.com',
        user_metadata: { name: 'Init User' },
      },
    };

    supabaseAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    renderHook(() => useAuth());
    await waitFor(() => {
      expect(supabaseAuth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(supabaseAuth.getSession).toHaveBeenCalledTimes(1);
    });
    await waitForAsyncQueue();

    const state = usePartyStore.getState();
    expect(state.user).toMatchObject({
      id: 'user-1',
      email: 'init@example.com',
      name: 'Init User',
    });
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(eventService.getUserEvents).toHaveBeenCalledWith('user-1');
  });

  it('signs in a user via Supabase', async () => {
    const mockUser = { id: 'user-2', email: 'signin@example.com' };

    supabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());
    expect((supabase.auth.signInWithPassword as any).mock).toBeDefined();

    let response: unknown;
    await act(async () => {
      response = await result.current.signIn('signin@example.com', 'secret');
    });

    await waitFor(() => {
      expect(supabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'signin@example.com',
        password: 'secret',
      });
    });
    expect(response).toEqual({ user: mockUser, error: null });
  });

  it('propagates sign in errors and resets loading state', async () => {
    const signInError = new Error('Invalid credentials');

    supabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: signInError,
    });

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.signIn('signin@example.com', 'wrong');
    });

    await waitFor(() => {
      expect(supabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'signin@example.com',
        password: 'wrong',
      });
    });
    expect(response).toEqual({ user: null, error: signInError });
    expect(usePartyStore.getState().isLoading).toBe(false);
  });

  it('registers new users with additional metadata', async () => {
    const mockUser = { id: 'user-3', email: 'signup@example.com' };

    supabaseAuth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.signUp('signup@example.com', 'password123', 'Signup User');
    });

    await waitFor(() => {
      expect(supabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'signup@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Signup User',
            full_name: 'Signup User',
          },
        },
      });
    });
    expect(response).toEqual({ user: mockUser, error: null });
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

    await waitFor(() => {
      expect(supabaseAuth.signOut).toHaveBeenCalled();
    });
    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('updates the store after SIGNED_IN events', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(supabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });
    expect(result.current).toBeDefined();

    await triggerAuthEvent('SIGNED_IN', {
      user: {
        id: 'user-5',
        email: 'event@example.com',
        user_metadata: { name: 'Event User' },
      },
    });

    const state = usePartyStore.getState();
    expect(state.user).toMatchObject({
      id: 'user-5',
      email: 'event@example.com',
      name: 'Event User',
    });
    expect(eventService.getUserEvents).toHaveBeenCalledWith('user-5');
  });

  it('clears the store after SIGNED_OUT events', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(supabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });
    expect(result.current).toBeDefined();

    usePartyStore.setState({
      user: { id: 'user-6', email: 'existing@example.com' } as any,
      isAuthenticated: true,
    });

    await triggerAuthEvent('SIGNED_OUT', null);

    const state = usePartyStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
