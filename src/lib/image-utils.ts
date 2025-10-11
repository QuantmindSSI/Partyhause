// Image upload and optimization utilities for PartyHaus
import { supabase } from './supabase';

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
  quality: 0.9
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
 * Uploads an image to Supabase storage with optimization
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
    
    // Build file path
    const filePath = opts.folder ? `${opts.folder}/${fileName}` : fileName;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(opts.bucket)
      .upload(filePath, processedFile, {
        upsert: true,
        contentType: processedFile.type
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return { 
        success: false, 
        error: 'Failed to upload image. Please try again.' 
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(opts.bucket)
      .getPublicUrl(filePath);
    
    return { success: true, url: publicUrl };
    
  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during upload.' 
    };
  }
};

/**
 * Deletes an image from Supabase storage
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'event-invites'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract file path from URL
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid image URL' };
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: 'Failed to delete image' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Image delete error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Gets optimized image URL with transformations (if supported by storage provider)
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string => {
  // For now, return original URL
  // Can be enhanced with Supabase image transformations when available
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