import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

const DEFAULT_BLOB_ENDPOINT = 'https://stphgipkzrenusqpy.blob.core.windows.net/';
const DELETE_CONCURRENCY = 8;

export class BlobDeletionError extends Error {
  constructor(public readonly code: 'BLOB_DELETE_FAILED') {
    super(code);
    this.name = 'BlobDeletionError';
  }
}

export function storageContainerName(): string {
  return process.env.AZURE_STORAGE_IMAGE_CONTAINER?.trim() || 'event-invites';
}

export function storageUploadsContainerName(): string {
  return process.env.AZURE_STORAGE_UPLOADS_CONTAINER?.trim() || 'uploads';
}

export function storageBlobEndpoint(): string {
  const configured = process.env.AZURE_STORAGE_BLOB_ENDPOINT?.trim();
  if (configured) return configured.endsWith('/') ? configured : `${configured}/`;
  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  return account ? `https://${account}.blob.core.windows.net/` : DEFAULT_BLOB_ENDPOINT;
}

export function sanitizeBlobSegment(segment: string): string | null {
  const cleaned = segment.trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') return null;
  return /^[A-Za-z0-9._-]+$/.test(cleaned) ? cleaned : null;
}

export function sanitizeBlobPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const cleaned: string[] = [];
  for (const segment of segments) {
    const safe = sanitizeBlobSegment(segment);
    if (!safe) return null;
    cleaned.push(safe);
  }
  return cleaned.join('/');
}

export function publicBlobUrl(blobName: string): string {
  return `${storageBlobEndpoint()}${storageContainerName()}/${blobName}`;
}

let cachedClient: { key: string; value: BlobServiceClient } | null = null;

export function blobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim() || '';
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY?.trim();
  const cacheKey = connectionString || `${account}:${accountKey || ''}:${storageBlobEndpoint()}`;
  if (cachedClient?.key === cacheKey) return cachedClient.value;

  let value: BlobServiceClient;
  if (connectionString) {
    value = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    if (!account || !accountKey) {
      throw new Error(
        'Azure Storage not configured: set AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCOUNT_KEY',
      );
    }
    value = new BlobServiceClient(
      storageBlobEndpoint(),
      new StorageSharedKeyCredential(account, accountKey),
    );
  }
  cachedClient = { key: cacheKey, value };
  return value;
}

export interface BlobOwnership {
  userId: string;
  hostedEventIds: ReadonlySet<string>;
}

interface OwnedBlobReference {
  containerName: string;
  blobName: string;
}

function blobNameInContainer(candidate: URL, endpoint: URL, containerName: string): string | null {
  const basePath = endpoint.pathname.replace(/\/+$/, '');
  const prefix = `${basePath}/${containerName}/`.replace(/\/{2,}/g, '/');
  if (!candidate.pathname.startsWith(prefix)) return null;
  try {
    return sanitizeBlobPath(decodeURIComponent(candidate.pathname.slice(prefix.length)));
  } catch {
    return null;
  }
}

function ownedBlobReferenceFromUrl(rawUrl: string, ownership: BlobOwnership): OwnedBlobReference | null {
  let candidate: URL;
  let endpoint: URL;
  try {
    candidate = new URL(rawUrl);
    endpoint = new URL(storageBlobEndpoint());
  } catch {
    return null;
  }
  if (candidate.protocol !== 'https:' || candidate.origin !== endpoint.origin) return null;

  const containers = [...new Set([storageContainerName(), storageUploadsContainerName()])];
  for (const containerName of containers) {
    const blobName = blobNameInContainer(candidate, endpoint, containerName);
    if (!blobName) continue;
    if (blobName.split('/')[0] === ownership.userId) return { containerName, blobName };
    const legacy = /^([^/]+)_invite\.[A-Za-z0-9]+$/.exec(blobName);
    if (containerName === storageContainerName() && legacy && ownership.hostedEventIds.has(legacy[1])) {
      return { containerName, blobName };
    }
  }
  return null;
}

/** Return a blob name only when the configured Azure URL and ownership are provable. */
export function ownedBlobNameFromUrl(rawUrl: string, ownership: BlobOwnership): string | null {
  return ownedBlobReferenceFromUrl(rawUrl, ownership)?.blobName ?? null;
}

/**
 * Delete every proven account-owned Azure blob with bounded concurrency.
 * Missing blobs count as deleted, which makes retries idempotent.
 */
export async function deleteOwnedBlobUrls(
  urls: readonly string[],
  ownership: BlobOwnership,
): Promise<number> {
  const references = [...new Map(urls.map((url) => ownedBlobReferenceFromUrl(url, ownership))
    .filter((reference): reference is OwnedBlobReference => reference !== null)
    .map((reference) => [`${reference.containerName}\0${reference.blobName}`, reference])).values()];
  if (references.length === 0) return 0;

  const service = blobServiceClient();
  for (let offset = 0; offset < references.length; offset += DELETE_CONCURRENCY) {
    const batch = references.slice(offset, offset + DELETE_CONCURRENCY);
    const outcomes = await Promise.allSettled(
      batch.map((reference) => service
        .getContainerClient(reference.containerName)
        .getBlockBlobClient(reference.blobName)
        .deleteIfExists({ deleteSnapshots: 'include' })),
    );
    if (outcomes.some((outcome) => outcome.status === 'rejected')) {
      throw new BlobDeletionError('BLOB_DELETE_FAILED');
    }
  }
  return references.length;
}
