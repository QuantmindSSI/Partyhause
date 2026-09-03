/**
 * The shared API client factory.
 *
 * One instance per app. Web and mobile differ only in the adapters they pass:
 *
 *   web    createApiClient({ baseUrl, storage: createWebStorage(),
 *                            telemetry: recordApiCall,
 *                            onUnauthorized: redirectToLogin })
 *   mobile createApiClient({ baseUrl, storage: createAsyncStorage(AsyncStorage),
 *                            onUnauthorized: () => router.replace('/') })
 */

import type { ApiClientConfig } from './http/adapters';
import { createTransport } from './http/transport';
import type { Transport, ApiResponse, RequestOptions } from './http/transport';
import { createAuthResource } from './resources/auth';
import type { AuthResource } from './resources/auth';
import {
  createEventsResource, createGuestsResource, createTimelineResource,
  createPollsResource, createPartyCrewResource, createUsersResource, createFeedResource,
  createNotificationsResource, createStorageResource, createEmailResource,
  createEmailLogsResource,
} from './resources';
import type {
  EventsResource, GuestsResource, TimelineResource, PollsResource,
  PartyCrewResource, UsersResource, FeedResource, NotificationsResource, StorageResource, EmailResource,
  EmailLogsResource,
} from './resources';

export interface ApiClient {
  auth: AuthResource;
  events: EventsResource;
  guests: GuestsResource;
  timeline: TimelineResource;
  polls: PollsResource;
  partycrew: PartyCrewResource;
    users: UsersResource;
    feed: FeedResource;
  notifications: NotificationsResource;
  storage: StorageResource;
  email: EmailResource;
  emailLogs: EmailLogsResource;
  /**
   * Escape hatch for endpoints with no typed resource yet.
   * Prefer adding a resource module over reaching for this.
   */
  request<T = unknown>(path: string, options: RequestOptions): Promise<ApiResponse<T>>;
  baseUrl: string;
}

/**
 * Construct a client bound to one platform.
 *
 * @param config Base URL plus platform adapters.
 * @returns Typed namespaces over the shared transport.
 * @throws Error if `baseUrl` is empty or `timeoutMs` is not positive.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const transport: Transport = createTransport(config);
  return {
    auth: createAuthResource(transport),
    events: createEventsResource(transport),
    guests: createGuestsResource(transport),
    timeline: createTimelineResource(transport),
    polls: createPollsResource(transport),
    partycrew: createPartyCrewResource(transport),
      users: createUsersResource(transport),
      feed: createFeedResource(transport),
    notifications: createNotificationsResource(transport),
    storage: createStorageResource(transport),
    email: createEmailResource(transport),
    emailLogs: createEmailLogsResource(transport),
    request: transport.request,
    baseUrl: transport.baseUrl,
  };
}
