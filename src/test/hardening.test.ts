import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppError, ValidationError, NetworkError, ErrorHandler } from '../lib/error-handling';
import { validateEvent, validateGuest, eventSchema, guestSchema } from '../lib/validation';
import { sanitizeText, sanitizeEmail, sanitizeUrl, rateLimiter } from '../lib/sanitization';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test message', 'TEST_CODE', 400);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field errors', () => {
      const fieldErrors = { name: ['Required'], email: ['Invalid format'] };
      const error = new ValidationError('Validation failed', fieldErrors);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.fieldErrors).toEqual(fieldErrors);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with original error', () => {
      const originalError = new Error('Connection failed');
      const error = new NetworkError('Network issue', originalError);

      expect(error.message).toBe('Network issue');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ErrorHandler', () => {
    it('should handle Zod validation errors', () => {
      const zodError = {
        name: 'ZodError',
        errors: [
          { path: ['name'], message: 'Required' },
          { path: ['email'], message: 'Invalid email' },
        ],
      };

      const result = ErrorHandler.handle(zodError);

      expect(result).toBeInstanceOf(ValidationError);
      expect((result as ValidationError).fieldErrors).toEqual({
        name: ['Required'],
        email: ['Invalid email'],
      });
    });

    it('should handle Supabase errors', () => {
      const supabaseError = {
        code: 'PGRST116',
        message: 'Not found',
      };

      const result = ErrorHandler.handle(supabaseError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle network errors', () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const result = ErrorHandler.handle(new Error('Network error'));

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should identify operational errors', () => {
      const operationalError = new AppError('Test', 'TEST');
      const genericError = new Error('Generic');

      expect(ErrorHandler.isOperationalError(operationalError)).toBe(true);
      expect(ErrorHandler.isOperationalError(genericError)).toBe(false);
    });
  });
});

describe('Validation', () => {
  describe('Event Validation', () => {
    it('should validate valid event data', () => {
      const validEvent = {
        host_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Event',
        event_date: '2025-12-25T10:00:00Z',
        location: 'Test Location',
        spotify_playlist_url: 'https://open.spotify.com/playlist/test',
      };

      const result = validateEvent(validEvent);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validEvent);
    });

    it('should reject invalid event data', () => {
      const invalidEvent = {
        name: '', // Required field empty
        event_date: 'invalid-date',
        location: 'Test Location',
      };

      const result = validateEvent(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate event name length', () => {
      const longName = 'a'.repeat(101); // Too long
      const event = {
        host_id: '123e4567-e89b-12d3-a456-426614174000',
        name: longName,
        event_date: '2025-12-25T10:00:00Z',
        location: 'Test Location',
      };

      expect(() => eventSchema.parse(event)).toThrow();
    });
  });

  describe('Guest Validation', () => {
    it('should validate valid guest data', () => {
      const validGuest = {
        event_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = validateGuest(validGuest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ ...validGuest, is_checked_in: false });
    });

    it('should reject invalid guest name', () => {
      const invalidGuest = {
        event_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John123', // Invalid characters
        email: 'john@example.com',
      };

      const result = validateGuest(invalidGuest);

      expect(result.success).toBe(false);
    });
  });
});

describe('Sanitization', () => {
  describe('Text Sanitization', () => {
    it('should sanitize basic text', () => {
      expect(sanitizeText('Hello World')).toBe('Hello World');
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
    });

    it('should limit text length', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizeText(longText, 100);

      expect(result.length).toBe(100);
    });

    it('should remove control characters', () => {
      const textWithControlChars = 'Hello\x00World\x01Test';
      const result = sanitizeText(textWithControlChars);

      expect(result).toBe('HelloWorldTest');
    });
  });

  describe('Email Sanitization', () => {
    it('should sanitize valid emails', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
      expect(sanitizeEmail('Test@Example.Com')).toBe('test@example.com');
    });

    it('should remove dangerous characters', () => {
      const dangerousEmail = 'test<script>alert("xss")</script>@example.com';
      const result = sanitizeEmail(dangerousEmail);
      
      // The sanitization should remove the dangerous HTML/script tags and make email lowercase
      expect(result).toBe('test@example.com');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
    });
  });

  describe('URL Sanitization', () => {
    it('should validate HTTP/HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should reject invalid protocols', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
      expect(sanitizeUrl('ftp://example.com')).toBe('');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Reset rate limiter for each test
      rateLimiter.reset('test-key');
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed('test-key', 5)).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('test-key', 5);
      }

      expect(rateLimiter.isAllowed('test-key', 5)).toBe(false);
    });

    it('should reset rate limiter', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('test-key', 5);
      }

      rateLimiter.reset('test-key');
      expect(rateLimiter.isAllowed('test-key', 5)).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  describe('Error Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Mock a network failure
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      global.fetch = mockFetch;

      try {
        await fetch('/api/test');
      } catch (error) {
        const handledError = ErrorHandler.handle(error);
        expect(handledError).toBeInstanceOf(NetworkError);
      }
    });
  });
});
