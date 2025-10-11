// Input sanitization utilities for security hardening

// HTML sanitization - remove potentially dangerous HTML
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  // Remove script tags and their contents
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:[^"']*/gi, '');

  // Remove data: URLs that might contain scripts
  sanitized = sanitized.replace(/data:text\/html[^"']*/gi, '');

  return sanitized.trim();
};

// SQL injection prevention - basic sanitization
export const sanitizeSqlInput = (input: string): string => {
  if (!input) return '';

  // Remove potentially dangerous SQL keywords
  const dangerousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/gi,
    /(-{2}|\/\*|\*\/)/g, // Comments
    /('|(\\x27)|(\\x2D))/g, // Quotes and hyphens
  ];

  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
};

// XSS prevention - escape HTML entities
export const escapeHtml = (text: string): string => {
  if (!text) return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
};

// Email sanitization
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';

  // Remove dangerous HTML/script content first
  let sanitized = email.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove all HTML tags

  // Remove other potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"&\\]/g, '');

  return sanitized.trim().toLowerCase();
};

// URL sanitization
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Remove potentially dangerous characters from pathname
    parsedUrl.pathname = parsedUrl.pathname.replace(/[<>'"&\\]/g, '');

    return parsedUrl.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
};

// General text sanitization
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
  if (!text) return '';

  return text
    .slice(0, maxLength) // Limit length
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
};

// File name sanitization
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';

  return fileName
    .replace(/[<>'"&\\|?*]/g, '') // Remove dangerous characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\.\./g, '.') // Prevent directory traversal
    .slice(0, 255) // Limit length
    .trim();
};

// JSON sanitization - ensure valid JSON
export const sanitizeJson = (jsonString: string): string => {
  if (!jsonString) return '{}';

  try {
    // Parse and stringify to ensure valid JSON
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch {
    return '{}';
  }
};

// Number sanitization
export const sanitizeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Boolean sanitization
export const sanitizeBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
};

// Array sanitization
export const sanitizeArray = <T>(
  arr: any,
  itemSanitizer: (item: any) => T,
  maxLength: number = 100
): T[] => {
  if (!Array.isArray(arr)) return [];

  return arr
    .slice(0, maxLength)
    .map(itemSanitizer)
    .filter(item => item !== null && item !== undefined);
};

// Object sanitization
export const sanitizeObject = <T extends Record<string, any>>(
  obj: any,
  schema: Record<keyof T, (value: any) => any>
): Partial<T> => {
  if (!obj || typeof obj !== 'object') return {};

  const sanitized: Partial<T> = {};

  Object.keys(schema).forEach(key => {
    if (key in obj) {
      sanitized[key as keyof T] = schema[key as keyof T](obj[key]);
    }
  });

  return sanitized;
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Export singleton rate limiter
export const rateLimiter = new RateLimiter();
