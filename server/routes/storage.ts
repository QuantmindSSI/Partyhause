// Express route: /api/storage
// Image upload/delete/SAS endpoints backed by Azure Blob Storage.
//
// Replaces the old Supabase Storage (`supabase.storage.from('event-invites')`)
// flow. The frontend now POSTs multipart/form-data to /api/storage/upload and
// the API uploads the file server-side to the `event-invites` container, which
// has anonymous (public) read access so invite images can be embedded in
// emails and rendered in the browser without a SAS token.

import { Router } from 'express';
import multer from 'multer';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// All storage routes require authentication.
router.use(requireAuth);

// ----- Blob-name safety ------------------------------------------------------

/**
 * Sanitize a client-supplied blob path segment: only word chars, dot, dash.
 * Rejects traversal-ish ('..') and empty segments by returning null.
 */
function sanitizeSegment(segment: string): string | null {
  const cleaned = segment.trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') return null;
  if (!/^[A-Za-z0-9._-]+$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Sanitize a client-supplied blob path (may contain '/' separators).
 * Returns null when any segment is invalid.
 */
function sanitizeBlobPath(path: string): string | null {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) return null;
  const cleaned: string[] = [];
  for (const seg of segments) {
    const ok = sanitizeSegment(seg);
    if (!ok) return null;
    cleaned.push(ok);
  }
  return cleaned.join('/');
}

/**
 * Ownership check for delete/SAS: a caller may operate on a blob when
 *   (a) the blob lives under their own user-id prefix (`<userId>/...`), or
 *   (b) the blob follows the legacy root convention `<eventId>_invite.<ext>`
 *       and the caller hosts that event.
 */
async function callerOwnsBlob(blobName: string, userId: string): Promise<boolean> {
  const firstSegment = blobName.split('/')[0];
  if (firstSegment === userId) return true;

  // Legacy root-level names: <eventId>_invite.<ext>
  const legacyMatch = /^([^/]+)_invite\.[A-Za-z0-9]+$/.exec(blobName);
  if (legacyMatch) {
    const event = await prisma.event.findUnique({
      where: { id: legacyMatch[1] },
      select: { host_id: true },
    });
    return event?.host_id === userId;
  }

  return false;
}

// ----- Configuration -------------------------------------------------------

const CONTAINER_NAME =
  process.env.AZURE_STORAGE_IMAGE_CONTAINER || 'event-invites';

const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT || '';
const BLOB_ENDPOINT =
  process.env.AZURE_STORAGE_BLOB_ENDPOINT ||
  (ACCOUNT_NAME
    ? `https://${ACCOUNT_NAME}.blob.core.windows.net/`
    : 'https://stphgipkzrenusqpy.blob.core.windows.net/');

/**
 * Resolve a BlobServiceClient. Prefer an explicit connection string
 * (AZURE_STORAGE_CONNECTION_STRING); otherwise build one from the account name
 * + key (AZURE_STORAGE_ACCOUNT_KEY).
 */
function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!ACCOUNT_NAME || !accountKey) {
    throw new Error(
      'Azure Storage not configured: set AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCOUNT_KEY',
    );
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    ACCOUNT_NAME,
    accountKey,
  );
  return new BlobServiceClient(BLOB_ENDPOINT, sharedKeyCredential);
}

/**
 * Lazily-initialized singleton client so we don't re-parse the connection
 * string on every request.
 */
let _client: BlobServiceClient | null = null;
function blobServiceClient(): BlobServiceClient {
  if (!_client) {
    _client = getBlobServiceClient();
  }
  return _client;
}

/**
 * Build the public URL for a blob in the event-invites container.
 */
function publicBlobUrl(blobName: string): string {
  const base = BLOB_ENDPOINT.endsWith('/')
    ? BLOB_ENDPOINT
    : `${BLOB_ENDPOINT}/`;
  return `${base}${CONTAINER_NAME}/${blobName}`;
}

// ----- Multer (in-memory file upload) --------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max, matches client-side validation
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

// ----- Routes --------------------------------------------------------------

/**
 * POST /api/storage/upload
 * multipart/form-data:
 *   - file:    the image file (required)
 *   - eventId: optional event id, used to namespace the blob
 *   - folder:  optional folder prefix (e.g. user id) for organization
 *
 * Returns { success: true, url: "<public blob url>", blobName: "<name>" }
 */
router.post(
  '/upload',
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
      }

      const eventId = (req.body.eventId as string | undefined)?.trim();
      const folderRaw = (req.body.folder as string | undefined)?.trim();
      const userId = req.user!.id;

      // Build a unique blob name. Prefer the caller-supplied name, otherwise
      // derive one from the original filename + timestamp.
      const requestedNameRaw = (req.body.fileName as string | undefined)?.trim();

      const requestedName = requestedNameRaw ? sanitizeBlobPath(requestedNameRaw) : null;
      if (requestedNameRaw && !requestedName) {
        return res.status(400).json({ success: false, error: 'Invalid fileName' });
      }
      const folder = folderRaw ? sanitizeBlobPath(folderRaw) : null;
      if (folderRaw && !folder) {
        return res.status(400).json({ success: false, error: 'Invalid folder' });
      }

      const ext =
        sanitizeSegment(file.originalname.split('.').pop()?.toLowerCase() || '') ||
        file.mimetype.split('/')[1] ||
        'jpg';

      let blobName: string;
      if (requestedName) {
        blobName = requestedName;
      } else {
        const stamp = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        const base = eventId && sanitizeSegment(eventId)
          ? `${sanitizeSegment(eventId)}_invite`
          : `invite_${stamp}_${rand}`;
        blobName = `${base}.${ext}`;
      }

      // Namespace every upload under the CALLER's user id so one user cannot
      // overwrite another user's blobs by guessing their fileName. A folder
      // equal to the caller's id is collapsed (the standard client sends
      // folder=<own user id>); any other folder nests INSIDE the caller's
      // namespace.
      if (folder && folder !== userId) {
        blobName = `${userId}/${folder}/${blobName}`;
      } else {
        blobName = `${userId}/${blobName}`;
      }

      const containerClient = blobServiceClient().getContainerClient(
        CONTAINER_NAME,
      );

      // Ensure the container exists (idempotent). Public access is set at the
      // container level via `az storage container create --public-access blob`
      // (run during provisioning). We create it here as a safety net for
      // local/dev environments; the access policy is left at its default.
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const url = publicBlobUrl(blobName);
      return res.json({ success: true, url, blobName });
    } catch (error: any) {
      console.error('Storage upload error:', error?.stack || error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to upload image',
      });
    }
  },
);

/**
 * DELETE /api/storage/:blobName — deletes a blob.
 * The blobName may contain slashes (folder prefixes). It is URL-decoded by
 * Express automatically.
 */
router.delete('/:blobName', async (req: AuthenticatedRequest, res) => {
  try {
    // Express has already URL-decoded the param once — decoding again would
    // corrupt names containing literal % sequences.
    const blobName = req.params.blobName;
    if (!blobName) {
      return res.status(400).json({ success: false, error: 'Missing blob name' });
    }

    // Only the owner (user-namespace or legacy event-host convention) may
    // delete a blob — previously ANY authenticated user could delete ANY
    // blob in the container.
    if (!(await callerOwnsBlob(blobName, req.user!.id))) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this blob' });
    }

    const containerClient = blobServiceClient().getContainerClient(
      CONTAINER_NAME,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const exists = await blockBlobClient.exists();
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, error: 'Blob not found' });
    }

    await blockBlobClient.delete();
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Storage delete error:', error?.stack || error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to delete image',
    });
  }
});

/**
 * GET /api/storage/url/:blobName — returns a temporary (1 hour) SAS URL for a
 * blob. Useful for private containers; for the public `event-invites`
 * container the public URL is sufficient, but this endpoint is provided for
 * future private containers.
 */
router.get('/url/:blobName', async (req: AuthenticatedRequest, res) => {
  try {
    // Express has already URL-decoded the param once.
    const blobName = req.params.blobName;
    if (!blobName) {
      return res.status(400).json({ success: false, error: 'Missing blob name' });
    }

    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    // For a public container we can just return the public URL.
    if (!accountKey && !connectionString) {
      return res.json({ success: true, url: publicBlobUrl(blobName) });
    }

    const sharedKeyCredential = accountKey
      ? new StorageSharedKeyCredential(ACCOUNT_NAME, accountKey)
      : undefined;

    if (!sharedKeyCredential) {
      return res.json({ success: true, url: publicBlobUrl(blobName) });
    }

    const containerClient = blobServiceClient().getContainerClient(
      CONTAINER_NAME,
    );
    const blobClient = containerClient.getBlobClient(blobName);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + 60 * 60 * 1000); // 1 hour

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential,
    ).toString();

    const sasUrl = `${blobClient.url}?${sasToken}`;
    return res.json({ success: true, url: sasUrl, expiresOn: expiresOn.toISOString() });
  } catch (error: any) {
    console.error('Storage SAS URL error:', error?.stack || error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate SAS URL',
    });
  }
});

export default router;
