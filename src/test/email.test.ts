import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock the centralized API base URL helper so we can control the resolved
// email endpoint without depending on Vite env var stubbing quirks.
vi.mock('@/lib/apiBase', () => ({
  apiUrl: vi.fn((path: string) => {
    // Default: same-origin. Tests override this per-case via the mock below.
    const base = (import.meta.env as any).VITE_API_URL || '';
    return base ? `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}` : path;
  }),
  getApiBaseUrl: vi.fn(() => (import.meta.env as any).VITE_API_URL || ''),
}));

import { sendEmail, emailTemplates } from '@/lib/email';
import { apiUrl } from '@/lib/apiBase';

// Mock fetch globally
global.fetch = vi.fn();

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
    // VITE_API_URL is not a predeclared Vite env var; assign directly.
    (import.meta.env as any).VITE_API_URL = '';
  });

  describe('sendEmail', () => {
    it('should send email successfully (same-origin when VITE_API_URL unset)', async () => {
      (import.meta.env as any).VITE_API_URL = '';
      (apiUrl as Mock).mockImplementation((path: string) => path);

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'email-123' } })
      };
      (fetch as Mock).mockResolvedValueOnce(mockResponse);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>'
      };

      const result = await sendEmail(emailData);

      expect(fetch).toHaveBeenCalledWith('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      expect(result).toEqual({ success: true, data: { id: 'email-123' } });
    });

    it('should use VITE_API_URL when set (e.g. localhost dev server)', async () => {
      (apiUrl as Mock).mockReturnValue('http://localhost:3001/api/send-email');

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true })
      };
      (fetch as Mock).mockResolvedValueOnce(mockResponse);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>'
      };

      await sendEmail(emailData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' })
      };
      (fetch as Mock).mockResolvedValueOnce(mockResponse);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>'
      };

      await expect(sendEmail(emailData)).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>'
      };

      await expect(sendEmail(emailData)).rejects.toThrow('Network error');
    });
  });

  describe('emailTemplates.eventInvitation', () => {
    it('should generate a valid invitation email template', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const invitationUrl = 'https://partyhaus.app/invite/abc123';

      const template = emailTemplates.eventInvitation(
        'guest@example.com',
        eventDetails,
        invitationUrl
      );

      expect(template.to).toBe('guest@example.com');
      expect(template.subject).toContain('Test Party');
      expect(template.html).toContain('Test Party');
      expect(template.html).toContain('December 31, 2024');
      expect(template.html).toContain('123 Party Street, Fun City');
      expect(template.html).toContain(invitationUrl);
      expect(template.html).toContain('PartyHause');
    });

    it('should include RSVP call-to-action in the template', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const invitationUrl = 'https://partyhaus.app/invite/abc123';

      const template = emailTemplates.eventInvitation(
        'guest@example.com',
        eventDetails,
        invitationUrl
      );

      expect(template.html).toContain('RSVP Now');
      expect(template.html).toContain('Ready to join the party');
    });

    it('should include QR code placeholder', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const invitationUrl = 'https://partyhaus.app/invite/abc123';

      const template = emailTemplates.eventInvitation(
        'guest@example.com',
        eventDetails,
        invitationUrl
      );

    expect(template.html).toContain('QR Check-in');
    });

    it('should handle special characters in event details', () => {
      const eventDetails = {
        name: 'John\'s "Amazing" Party & Celebration',
        date: 'December 31, 2024',
        location: '123 Main St. <Apt 4B>, Fun City'
      };

      const invitationUrl = 'https://partyhaus.app/invite/abc123';

      const template = emailTemplates.eventInvitation(
        'guest@example.com',
        eventDetails,
        invitationUrl
      );

      // Should not throw and should contain escaped content
      expect(template.html).toContain('John');
      expect(template.html).toContain('Amazing');
      expect(template.html).toContain('Party');
      expect(template.html).toContain('Celebration');
    });
  });

  describe('emailTemplates.rsvpConfirmation', () => {
    it('should generate RSVP confirmation email for accepted invitation', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const template = emailTemplates.rsvpConfirmation(
        'guest@example.com',
        eventDetails,
        'John Doe'
      );

      expect(template.to).toBe('guest@example.com');
      expect(template.subject).toContain('RSVP Confirmed');
  expect(template.html).toContain('RSVP Confirmed');
      expect(template.html).toContain('Test Party');
      expect(template.html).toContain('John Doe');
    });
  });

  describe('emailTemplates.eventReminder', () => {
    it('should generate event reminder email', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const template = emailTemplates.eventReminder(
        'guest@example.com',
        eventDetails,
        'John Doe'
      );

      expect(template.to).toBe('guest@example.com');
    expect(template.subject).toContain('Test Party');
    expect(template.subject).toContain("Don't forget");
    expect(template.html).toContain("Tomorrow's the day");
      expect(template.html).toContain('Test Party');
      expect(template.html).toContain('John Doe');
    });

    it('should include QR code when provided', () => {
      const eventDetails = {
        name: 'Test Party',
        date: 'December 31, 2024',
        location: '123 Party Street, Fun City'
      };

      const template = emailTemplates.eventReminder(
        'guest@example.com',
        eventDetails,
        'John Doe',
        'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=test'
      );

      expect(template.html).toContain('QR');
      expect(template.html).toContain('https://api.qrserver.com/v1/create-qr-code');
    });
  });
});
