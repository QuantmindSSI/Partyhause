import { describe, expect, it } from 'vitest';
import type { ApiResponse, CurrentUser } from '../../packages/core/src';

import {
  authSessionReducer,
  INITIAL_AUTH_SESSION,
  resolveSessionValidation,
} from '../../apps/mobile/auth/session';

const user: CurrentUser = {
  id: 'user-1',
  email: 'person@example.com',
  name: 'Person',
  created_at: '2026-09-05T12:00:00.000Z',
  email_verified: true,
};

describe('mobile auth session state', () => {
  it('starts in checking and becomes anonymous without a token', () => {
    const event = resolveSessionValidation(null);
    expect(authSessionReducer(INITIAL_AUTH_SESSION, event)).toEqual({
      status: 'anonymous',
      user: null,
      message: null,
    });
  });

  it('authenticates only with a user returned by /auth/me', () => {
    const event = resolveSessionValidation('token', { data: user, error: null });
    expect(authSessionReducer(INITIAL_AUTH_SESSION, event)).toEqual({
      status: 'authenticated',
      user,
      message: null,
    });
  });

  it.each([401, 403, 404])('treats HTTP %s as an auth rejection', (status) => {
    const result: ApiResponse<CurrentUser> = {
      data: null,
      error: { message: 'Rejected', status },
    };
    const event = resolveSessionValidation('token', result);
    expect(event).toEqual({ type: 'REJECTED' });
    expect(authSessionReducer(INITIAL_AUTH_SESSION, event).status).toBe('anonymous');
  });

  it('uses unavailable for transport failures instead of trusting cached identity', () => {
    const event = resolveSessionValidation('token', {
      data: null,
      error: { message: 'Network request failed' },
    });
    expect(authSessionReducer(INITIAL_AUTH_SESSION, event)).toEqual({
      status: 'unavailable',
      user: null,
      message: 'Network request failed',
    });
  });

  it('returns to checking without retaining a previously validated user', () => {
    const authenticated = authSessionReducer(INITIAL_AUTH_SESSION, {
      type: 'VALIDATED',
      user,
    });
    expect(authSessionReducer(authenticated, { type: 'CHECK_STARTED' })).toBe(INITIAL_AUTH_SESSION);
  });
});
