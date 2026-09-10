import type { ApiResponse, Transport } from '../http/transport';

/**
 * Anonymous, token-scoped RSVP.
 *
 * Every call here is deliberately unauthenticated. A guest replying to an
 * invitation has no account and no session: the token in the invitation URL is
 * the credential, which is why `/api/rsvp` sits outside `requireAuth` and why
 * every request below passes `anonymous: true`. Attaching a bearer token would
 * not make it more secure; it would make the endpoint unusable by the only
 * people it exists for.
 *
 * The web app reaches these same two endpoints through `src/lib/rsvp-client.ts`,
 * a standalone fetch wrapper written before this resource existed. That is the
 * repository's long-standing two-client problem, and this module is the shared
 * half. Mobile uses this; the web client should be retired onto it rather than a
 * third one being written.
 */

/** The three responses a guest may give. `pending` is a server state, not a choice. */
export type RsvpChoice = 'accepted' | 'maybe' | 'declined';

/** What the guest record currently says, including the un-answered state. */
export type RsvpStatus = 'pending' | RsvpChoice;

export interface RsvpInvitation {
  event: {
    name: string;
    hostName: string;
    /** ISO-8601. */
    start: string;
    /** ISO-8601. */
    end: string;
    timezone: string;
    location: string;
  };
  rsvp: {
    status: RsvpStatus;
    /**
     * Compare-and-swap counter. `respond` must echo the value that `resolve`
     * returned; the server answers 409 REVISION_CONFLICT if the record moved
     * in between, which is how two devices answering at once cannot silently
     * overwrite each other.
     */
    revision: number;
    respondedAt: string | null;
  };
}

export interface RsvpResource {
  /** Read an invitation without changing it. */
  resolve(token: string): Promise<ApiResponse<RsvpInvitation>>;
  /**
   * Record one explicit response.
   *
   * @param token The invitation token from the link.
   * @param status The guest's choice.
   * @param expectedRevision The revision `resolve` last returned.
   */
  respond(
    token: string,
    status: RsvpChoice,
    expectedRevision: number,
  ): Promise<ApiResponse<RsvpInvitation>>;
}

/** Build the anonymous RSVP surface. */
export function createRsvpResource(transport: Transport): RsvpResource {
  return {
    resolve: (token) =>
      transport.request<RsvpInvitation>('/api/rsvp/resolve', {
        method: 'POST',
        body: { token },
        anonymous: true,
      }),
    respond: (token, status, expectedRevision) =>
      transport.request<RsvpInvitation>('/api/rsvp', {
        method: 'PUT',
        // The service rejects unknown keys outright (`exactKeys`), so this
        // body carries exactly these three and nothing else.
        body: { token, status, expectedRevision },
        anonymous: true,
      }),
  };
}
