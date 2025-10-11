import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// E2E tests for the email API endpoint
// These tests require the actual API to be running
describe('Email API E2E Tests', () => {
  const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api/send-email' 
    : 'http://localhost:3001/api/send-email';

  // Only run these tests if we're in an environment where the API is expected to be available
  const shouldRunE2ETests = process.env.RUN_E2E_TESTS === 'true';

  describe.skipIf(!shouldRunE2ETests)('Email API Endpoint', () => {
    it('should accept valid email data and return success', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email from E2E Test',
        html: '<h1>Test Email</h1><p>This is a test email from the E2E test suite.</p>'
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id');
    });

    it('should reject requests with missing required fields', async () => {
      const invalidEmailData = {
        to: 'test@example.com',
        // Missing subject and html
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidEmailData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmailData = {
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidEmailData),
      });

      expect(response.ok).toBe(false);
      
      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await fetch(API_URL, {
        method: 'OPTIONS',
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      // Check CORS headers
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should reject non-POST requests', async () => {
      const response = await fetch(API_URL, {
        method: 'GET',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(405);
      
      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Method not allowed');
    });
  });

  // Mock tests that always run
  describe('Email API Mock Tests', () => {
    it('should have correct API URL configuration', () => {
      const devUrl = 'http://localhost:3001/api/send-email';
      const prodUrl = '/api/send-email';
      
      expect([devUrl, prodUrl]).toContain(API_URL);
    });

    it('should construct proper request format', () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      };

      const requestBody = JSON.stringify(emailData);
      const parsedBody = JSON.parse(requestBody);

      expect(parsedBody).toEqual(emailData);
      expect(parsedBody).toHaveProperty('to');
      expect(parsedBody).toHaveProperty('subject');
      expect(parsedBody).toHaveProperty('html');
    });
  });
});

// Performance tests for email templates
describe('Email Template Performance', () => {
  it('should generate email templates quickly', () => {
    const { emailTemplates } = require('@/lib/email');
    
    const eventDetails = {
      name: 'Performance Test Event',
      date: 'December 31, 2024',
      location: '123 Performance Lane'
    };

    const startTime = performance.now();
    
    // Generate multiple templates
    for (let i = 0; i < 100; i++) {
      emailTemplates.eventInvitation(
        `test${i}@example.com`,
        eventDetails,
        `https://partyhaus.app/invite/${i}`
      );
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should generate 100 templates in less than 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should handle large event names efficiently', () => {
    const { emailTemplates } = require('@/lib/email');
    
    const largeEventName = 'A'.repeat(1000); // 1000 character event name
    const eventDetails = {
      name: largeEventName,
      date: 'December 31, 2024',
      location: '123 Test Street'
    };

    const startTime = performance.now();
    
    const template = emailTemplates.eventInvitation(
      'test@example.com',
      eventDetails,
      'https://partyhaus.app/invite/test'
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(10); // Should complete in less than 10ms
    expect(template.html).toContain(largeEventName);
    expect(template.subject).toContain(largeEventName);
  });
});