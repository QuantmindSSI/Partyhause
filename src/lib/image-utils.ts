// Image upload and optimization utilities for PartyHaus.
//
// Previously these uploaded directly to Supabase Storage from the browser.
// They now POST to the Express API (`/api/storage/*`) which uploads to Azure
// Blob Storage server-side. The client-side compression/resize logic is kept
// unchanged — it runs before the upload so we send a reasonably-sized file.
//
// The auth token (Supabase access token, transitionally) is attached via the
// shared `getAuthToken` helper so the API's `requireAuth` middleware accepts
// the request.

import { getAuthToken } from './api-client';
import { apiUrl } from './apiBase';

export interface ImageUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  quality?: number;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  bucket: 'event-invites',
  folder: '',
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  quality: 0.9,
};

/**
 * Validates an image file before upload
 */
export const validateImageFile = (
  file: File,
  options: Partial<ImageUploadOptions> = {}
): { valid: boolean; error?: string } => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${opts.allowedTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > opts.maxSizeBytes) {
    const maxSizeMB = opts.maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

/**
 * Compresses an image file if needed
 */
export const compressImage = async (
  file: File,
  quality: number = 0.9
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1920x1080 for email compatibility)
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Return original if compression fails
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file); // Return original if processing fails
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Uploads an image to Azure Blob Storage (via the API) with optimization.
 *
 * The `bucket` option is kept for backwards-compatibility but is ignored —
 * the API always uploads to the `event-invites` container. `folder` and
 * `fileName` are forwarded to the API to namespace the blob.
 */
export const uploadImage = async (
  file: File,
  fileName: string,
  options: Partial<ImageUploadOptions> = {}
): Promise<ImageUploadResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate file
    const validation = validateImageFile(file, opts);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Compress image if it's large
    let processedFile = file;
    if (file.size > 1024 * 1024) { // 1MB threshold
      processedFile = await compressImage(file, opts.quality);
    }

    // Build multipart form data for the API
    const formData = new FormData();
    formData.append('file', processedFile, fileName);
    if (opts.folder) {
      formData.append('folder', opts.folder);
    }
    formData.append('fileName', fileName);

    // Attach the auth token (transitional: Supabase access token).
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // NOTE: do not set Content-Type manually — the browser sets the correct
    // multipart boundary when we pass a FormData body.

    const response = await fetch(apiUrl('/api/storage/upload'), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      return { success: false, error: 'Unauthorized. Please sign in again.' };
    }

    let parsed: any = null;
    const text = await response.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      const message =
        (parsed && typeof parsed === 'object' && (parsed.error || parsed.message)) ||
        (typeof parsed === 'string' && parsed) ||
        `Upload failed (HTTP ${response.status})`;
      return { success: false, error: message };
    }

    const url: string | undefined = parsed?.url;
    if (!url) {
      return { success: false, error: 'Upload succeeded but no URL was returned' };
    }

    return { success: true, url };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during upload.'
    };
  }
};

/**
 * Extracts the blob name (path within the container) from an Azure Blob
 * public URL. Returns null if the URL doesn't look like an event-invites URL.
 */
function extractBlobNameFromUrl(url: string, container: string): string | null {
  try {
    const parsed = new URL(url);
    // Expected path: /<container>/<blobName>
    const prefix = `/${container}/`;
    const idx = parsed.pathname.indexOf(prefix);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + prefix.length));
  } catch {
    return null;
  }
}

/**
 * Deletes an image from Azure Blob Storage (via the API).
 *
 * Accepts either a full public URL (the container path is parsed out) or a
 * bare blob name. The `bucket` option is kept for backwards-compatibility and
 * used as the container name when parsing a URL.
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'event-invites'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Determine the blob name: either parse it from a URL or use the input
    // directly if it's already a bare path.
    let blobName = extractBlobNameFromUrl(url, bucket);
    if (!blobName) {
      // Fall back to treating the input as a blob name (it may already be one).
      blobName = url;
    }

    const token = await getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      apiUrl(`/api/storage/${encodeURIComponent(blobName)}`),
      {
        method: 'DELETE',
        headers,
      }
    );

    if (response.status === 401) {
      return { success: false, error: 'Unauthorized. Please sign in again.' };
    }

    if (!response.ok) {
      let message = `Delete failed (HTTP ${response.status})`;
      try {
        const parsed = await response.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        // ignore parse errors
      }
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Gets a temporary SAS URL for a private blob (via the API). For the public
 * `event-invites` container the public URL is sufficient, but this is provided
 * for future private containers.
 */
export const getBlobSasUrl = async (
  blobNameOrUrl: string,
  bucket: string = 'event-invites'
): Promise<ImageUploadResult> => {
  try {
    let blobName = extractBlobNameFromUrl(blobNameOrUrl, bucket);
    if (!blobName) {
      blobName = blobNameOrUrl;
    }

    const token = await getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      apiUrl(`/api/storage/url/${encodeURIComponent(blobName)}`),
      { method: 'GET', headers }
    );

    let parsed: any = null;
    const text = await response.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      const message =
        (parsed && typeof parsed === 'object' && (parsed.error || parsed.message)) ||
        `Failed to get SAS URL (HTTP ${response.status})`;
      return { success: false, error: message };
    }

    return { success: true, url: parsed?.url };
  } catch (error) {
    console.error('Image SAS URL error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Gets optimized image URL with transformations (if supported by storage provider)
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  _options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string => {
  // Azure Blob Storage does not provide built-in image transformations like
  // Supabase did. Return the original URL; transformations can be added later
  // via Azure CDN / Image Transformation or a resize API.
  return originalUrl;
};

/**
 * Email-optimized image URL for maximum compatibility
 */
export const getEmailOptimizedImageUrl = (originalUrl: string): string => {
  return getOptimizedImageUrl(originalUrl, {
    width: 600, // Email-safe width
    quality: 80, // Good balance of quality/size for email
    format: 'jpg' // Best email client compatibility
  });
};
