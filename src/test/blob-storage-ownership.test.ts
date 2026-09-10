import { afterEach, describe, expect, it } from 'vitest';

import { deleteOwnedBlobUrls, ownedBlobNameFromUrl } from '../../server/lib/blob-storage';

const originalEndpoint = process.env.AZURE_STORAGE_BLOB_ENDPOINT;
const originalContainer = process.env.AZURE_STORAGE_IMAGE_CONTAINER;
const originalUploadsContainer = process.env.AZURE_STORAGE_UPLOADS_CONTAINER;

afterEach(() => {
  if (originalEndpoint === undefined) delete process.env.AZURE_STORAGE_BLOB_ENDPOINT;
  else process.env.AZURE_STORAGE_BLOB_ENDPOINT = originalEndpoint;
  if (originalContainer === undefined) delete process.env.AZURE_STORAGE_IMAGE_CONTAINER;
  else process.env.AZURE_STORAGE_IMAGE_CONTAINER = originalContainer;
  if (originalUploadsContainer === undefined) delete process.env.AZURE_STORAGE_UPLOADS_CONTAINER;
  else process.env.AZURE_STORAGE_UPLOADS_CONTAINER = originalUploadsContainer;
});

describe('account-owned Azure blob detection', () => {
  it('accepts only configured-container URLs with a user or hosted-event ownership proof', () => {
    process.env.AZURE_STORAGE_BLOB_ENDPOINT = 'https://storage.example.test/';
    process.env.AZURE_STORAGE_IMAGE_CONTAINER = 'event-invites';
    process.env.AZURE_STORAGE_UPLOADS_CONTAINER = 'uploads';
    const ownership = { userId: 'user-1', hostedEventIds: new Set(['event-1']) };

    expect(ownedBlobNameFromUrl(
      'https://storage.example.test/uploads/user-1/avatar.png',
      ownership,
    )).toBe('user-1/avatar.png');
    expect(ownedBlobNameFromUrl(
      'https://storage.example.test/event-invites/user-1/invite.png',
      ownership,
    )).toBe('user-1/invite.png');
    expect(ownedBlobNameFromUrl(
      'https://storage.example.test/event-invites/event-1_invite.jpg',
      ownership,
    )).toBe('event-1_invite.jpg');
    expect(ownedBlobNameFromUrl(
      'https://storage.example.test/event-invites/user-2/invite.png',
      ownership,
    )).toBeNull();
    expect(ownedBlobNameFromUrl(
      'https://attacker.example/event-invites/user-1/invite.png',
      ownership,
    )).toBeNull();
  });

  it('does not require Azure credentials when no URL has proven ownership', async () => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    delete process.env.AZURE_STORAGE_ACCOUNT_KEY;
    await expect(deleteOwnedBlobUrls(
      ['https://other.example/file.png'],
      { userId: 'user-1', hostedEventIds: new Set() },
    )).resolves.toBe(0);
  });
});
