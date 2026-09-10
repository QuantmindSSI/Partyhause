/**
 * The session is two keys, and every path that creates one must write both.
 *
 * `src/hooks/use-auth.ts` hydrates the store only when `getStoredToken()` AND
 * `getStoredUser()` both return a value. That makes "holding a session" a
 * conjunction, and any code path that writes one key without the other
 * produces a state the app cannot represent: a valid bearer token that renders
 * as signed out, or a cached identity whose requests all 401.
 *
 * That is not hypothetical. `ResetPasswordPage` stored only the token, under a
 * comment reading "sign the user in", so a successful password reset navigated
 * to `/` and showed the login screen. These tests pin the invariant at every
 * site that mints a session.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearAuth,
} from '@/lib/auth-storage';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '@/lib/legal';

const TOKEN_KEY = 'partyhause_auth_token';
const USER_KEY = 'partyhause_auth_user';

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useSearchParams: () => [
      new URLSearchParams({ email: 'reset@partyhause.local', token: 'a'.repeat(64) }),
      vi.fn(),
    ],
  };
});

describe('stored session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('the storage contract itself', () => {
    it('round-trips a token', () => {
      setStoredToken('header.payload.signature');
      expect(getStoredToken()).toBe('header.payload.signature');
    });

    it('round-trips a user', () => {
      setStoredUser({ id: 'u1', email: 'a@b.test', name: 'A B' });
      expect(getStoredUser()).toEqual({ id: 'u1', email: 'a@b.test', name: 'A B' });
    });

    it('removes the key rather than persisting the string "null"', () => {
      // `localStorage.setItem(k, null)` stores the four characters n-u-l-l,
      // which reads back truthy and is then sent as `Authorization: Bearer
      // null`. Removing is the only correct behaviour for a falsy token.
      setStoredToken('something');
      setStoredToken(null);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(getStoredToken()).toBeNull();
    });

    it('degrades to signed out on corrupt JSON instead of throwing', () => {
      localStorage.setItem(USER_KEY, '{not json');
      expect(() => getStoredUser()).not.toThrow();
      expect(getStoredUser()).toBeNull();
    });

    it('rejects a stored object missing the fields the app depends on', () => {
      // A record without an id cannot answer "is this my profile", which is
      // the only question the cached user exists to answer.
      localStorage.setItem(USER_KEY, JSON.stringify({ email: 'a@b.test' }));
      expect(getStoredUser()).toBeNull();

      localStorage.setItem(USER_KEY, JSON.stringify({ id: 'u1' }));
      expect(getStoredUser()).toBeNull();
    });

    it('clears both halves together', () => {
      setStoredToken('t');
      setStoredUser({ id: 'u1', email: 'a@b.test' });

      clearAuth();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('sign in writes a complete session', () => {
    it('persists both halves on success', async () => {
      const { authService } = await import('@/lib/auth');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'a.real.token',
          user: { id: 'u-42', email: 'signed@partyhause.local', name: 'Signed In' },
        }),
      } as Response);

      const result = await authService.signIn('signed@partyhause.local', 'password123');

      expect(result.success).toBe(true);
      expect(getStoredToken()).toBe('a.real.token');
      expect(getStoredUser()).toEqual({
        id: 'u-42',
        email: 'signed@partyhause.local',
        name: 'Signed In',
      });
    });

    it('writes nothing at all when sign in fails', async () => {
      const { authService } = await import('@/lib/auth');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid email or password' }),
      } as Response);

      await authService.signIn('signed@partyhause.local', 'wrong');

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('writes nothing when the account is unconfirmed', async () => {
      const { authService } = await import('@/lib/auth');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Email address not confirmed',
          code: 'EMAIL_NOT_VERIFIED',
        }),
      } as Response);

      const result = await authService.signIn('unconfirmed@partyhause.local', 'password123');

      expect(result.needsEmailVerification).toBe(true);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('sign up does not mint a session', () => {
    it('stores nothing, because the server issues no token until the address is confirmed', async () => {
      const { authService } = await import('@/lib/auth');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: 'u-new', email: 'new@partyhause.local', email_verified: false },
          message: 'Account created. Check your email for a confirmation link before signing in.',
        }),
      } as Response);

      await authService.signUp('new@partyhause.local', 'password123', 'New User', {
        ageEligible: true,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      });

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('password reset mints a complete session', () => {
    it('stores both halves so the reset actually signs the user in', async () => {
      const ResetPasswordPage = (await import('@/pages/ResetPasswordPage')).default;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Password reset successfully',
          token: 'post.reset.token',
          user: {
            id: 'u-reset',
            email: 'reset@partyhause.local',
            name: 'Reset User',
            email_verified: true,
          },
        }),
      } as Response);

      render(
        <MemoryRouter>
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'brand-new-password' },
      });
      fireEvent.change(screen.getByLabelText(/confirm/i), {
        target: { value: 'brand-new-password' },
      });
      fireEvent.click(screen.getByRole('button', { name: /reset password|update password|set password/i }));

      await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));

      // The regression: the token was written and the user was not, so
      // use-auth's `token && storedUser` guard never fired.
      expect(getStoredToken()).toBe('post.reset.token');
      expect(getStoredUser()).toEqual({
        id: 'u-reset',
        email: 'reset@partyhause.local',
        name: 'Reset User',
      });
    });

    it('stores nothing when the reset link is rejected', async () => {
      const ResetPasswordPage = (await import('@/pages/ResetPasswordPage')).default;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid or expired reset link. Request a new one.' }),
      } as Response);

      render(
        <MemoryRouter>
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'brand-new-password' },
      });
      fireEvent.change(screen.getByLabelText(/confirm/i), {
        target: { value: 'brand-new-password' },
      });
      fireEvent.click(screen.getByRole('button', { name: /reset password|update password|set password/i }));

      await waitFor(() =>
        expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument(),
      );

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('the hydration guard that makes both keys necessary', () => {
    it.each([
      ['token only', true, false],
      ['user only', false, true],
      ['neither', false, false],
    ])('does not consider "%s" a session', (_label, hasToken, hasUser) => {
      if (hasToken) setStoredToken('t');
      if (hasUser) setStoredUser({ id: 'u1', email: 'a@b.test' });

      const isSession = getStoredToken() !== null && getStoredUser() !== null;
      expect(isSession).toBe(false);
    });

    it('considers both together a session', () => {
      setStoredToken('t');
      setStoredUser({ id: 'u1', email: 'a@b.test' });

      expect(getStoredToken() !== null && getStoredUser() !== null).toBe(true);
    });
  });
});
