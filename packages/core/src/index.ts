/**
 * @partyhause/core
 *
 * The shared API client consumed by both the Vite web app and the Expo mobile
 * app. Replaces the Supabase stub this package previously exported, which was
 * dead on both platforms: it had no `from()` method (13 mobile screens called
 * it) and read `localStorage`, which does not exist in React Native.
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

export {
  createWebStorage,
  createAsyncStorage,
  createSecureStoreStorage,
  SECURE_STORE_MIGRATION_KEY,
} from './http/storage-adapters';
export type {
  AsyncStorageLike,
  SecureStoreLike,
  SecureStoreStorageOptions,
  WebStorageLike,
} from './http/storage-adapters';

export type { AuthResource } from './resources/auth';
export { createAccountResource } from './resources/account';
export type {
  AccountDeletion,
  AccountDeletionStatus,
  AccountLegalSummary,
  AccountResource,
} from './resources/account';
export type {
  EventsResource, GuestsResource, TimelineResource, PollsResource,
  PartyCrewResource, UsersResource, FeedResource, NotificationsResource,
  StorageResource, EmailResource, EmailLogsResource,
  EventStats, EventWithStats,
  GuestCreateInput, GuestUpdateInput, EmailLog, EmailLogInput,
  CrewStatus, CrewConnection, CrewRequest, CrewToggleResult, CrewMembersPage, CrewingWithPage, CrewRequestsPage,
  PostComment,
  PostCommentAuthor,
  PostCommentPage,
} from './resources';

export * from './types';
export * from './store';
export * from './legal';
