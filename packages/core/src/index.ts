/**
 * @partyhause/core
 *
 * The shared API client. It is written against a storage adapter rather than
 * against `localStorage` directly, because React Native has no `localStorage`
 * and any client that assumes one is web-only by construction.
 *
 * Note that the web app does not consume this package today; it runs a second
 * client at src/lib/api-client.ts. Treat any API contract change as a
 * two-site change until they are unified.
 */

export { createApiClient } from './client';
export type { ApiClient } from './client';

export { createTransport } from './http/transport';
export type {
  Transport, ApiResponse, ApiError, HttpMethod, RequestOptions,
} from './http/transport';

export { STORAGE_KEYS, createMemoryStorage } from './http/adapters';
export type {
  TokenStorage, Telemetry, ApiCallRecord, UnauthorizedHandler, ApiClientConfig,
} from './http/adapters';

export { createWebStorage, createAsyncStorage } from './http/storage-adapters';
export type { AsyncStorageLike, WebStorageLike } from './http/storage-adapters';

export type { AuthResource } from './resources/auth';
export type {
  EventsResource, GuestsResource, TimelineResource, PollsResource,
  PartyCrewResource, UsersResource, FeedResource, NotificationsResource,
  StorageResource, EmailResource, EmailLogsResource,
  GuestCreateInput, GuestUpdateInput, EmailLog, EmailLogInput,
  CrewStatus, CrewConnection, CrewRequest, CrewToggleResult, CrewMembersPage, CrewingWithPage, CrewRequestsPage,
  PostComment,
  PostCommentAuthor,
  PostCommentPage,
} from './resources';

export * from './types';
export * from './store';
