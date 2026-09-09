import { apiUrl } from './apiBase';

export type BrowserRsvpStatus = 'pending' | 'accepted' | 'maybe' | 'declined';
export type BrowserRsvpChoice = Exclude<BrowserRsvpStatus, 'pending'>;

export interface BrowserRsvpInvitation {
  event: {
    name: string;
    hostName: string;
    start: string;
    end: string;
    timezone: string;
    location: string;
  };
  rsvp: {
    status: BrowserRsvpStatus;
    revision: number;
    respondedAt: string | null;
  };
}

export interface BrowserRsvpError {
  status?: number;
  code?: string;
  message: string;
}

export interface BrowserRsvpResult {
  data: BrowserRsvpInvitation | null;
  error: BrowserRsvpError | null;
}

async function request(method: 'POST' | 'PUT', body: Record<string, unknown>): Promise<BrowserRsvpResult> {
  try {
    const response = await fetch(apiUrl(method === 'POST' ? '/api/rsvp/resolve' : '/api/rsvp'), {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    const parsed = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      return {
        data: null,
        error: {
          status: response.status,
          code: typeof parsed?.code === 'string' ? parsed.code : undefined,
          message: typeof parsed?.error === 'string' ? parsed.error : 'The invitation request failed',
        },
      };
    }
    return { data: parsed as unknown as BrowserRsvpInvitation, error: null };
  } catch {
    return { data: null, error: { message: 'The invitation service could not be reached' } };
  }
}

/** Resolve an RSVP token without changing its guest record. */
export function resolveRsvp(token: string): Promise<BrowserRsvpResult> {
  return request('POST', { token });
}

/** Submit one explicit response against the revision returned by resolve. */
export function submitRsvp(
  token: string,
  status: BrowserRsvpChoice,
  expectedRevision: number,
): Promise<BrowserRsvpResult> {
  return request('PUT', { token, status, expectedRevision });
}
