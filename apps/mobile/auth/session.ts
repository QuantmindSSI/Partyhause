import type { ApiResponse, CurrentUser } from '@partyhause/core';

export type AuthSessionState =
  | { status: 'checking'; user: null; message: null }
  | { status: 'authenticated'; user: CurrentUser; message: null }
  | { status: 'anonymous'; user: null; message: null }
  | { status: 'unavailable'; user: null; message: string };

export type AuthSessionEvent =
  | { type: 'CHECK_STARTED' }
  | { type: 'NO_TOKEN' }
  | { type: 'VALIDATED'; user: CurrentUser }
  | { type: 'REJECTED' }
  | { type: 'UNAVAILABLE'; message: string };

export const INITIAL_AUTH_SESSION: AuthSessionState = {
  status: 'checking',
  user: null,
  message: null,
};

/** Pure state transition used by the provider and exercised independently. */
export function authSessionReducer(
  _state: AuthSessionState,
  event: AuthSessionEvent,
): AuthSessionState {
  switch (event.type) {
    case 'CHECK_STARTED':
      return INITIAL_AUTH_SESSION;
    case 'NO_TOKEN':
    case 'REJECTED':
      return { status: 'anonymous', user: null, message: null };
    case 'VALIDATED':
      return { status: 'authenticated', user: event.user, message: null };
    case 'UNAVAILABLE':
      return { status: 'unavailable', user: null, message: event.message };
  }
}

/** Convert token and `/auth/me` results into one explicit session event. */
export function resolveSessionValidation(
  token: string | null,
  result?: ApiResponse<CurrentUser>,
): AuthSessionEvent {
  if (!token) return { type: 'NO_TOKEN' };
  if (!result) {
    return { type: 'UNAVAILABLE', message: 'Unable to validate this session.' };
  }
  if (!result.error && result.data) {
    return { type: 'VALIDATED', user: result.data };
  }
  if (result.error && [401, 403, 404].includes(result.error.status ?? 0)) {
    return { type: 'REJECTED' };
  }
  return {
    type: 'UNAVAILABLE',
    message: result.error?.message || 'Unable to validate this session.',
  };
}
