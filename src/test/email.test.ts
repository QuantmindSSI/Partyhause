import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { sendEmail, emailTemplates } from '@/lib/email';

// Mock fetch globally
global.fetch = vi.fn();

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable for each test
    vi.stubEnv('NODE_ENV', 'test');
  });

  describe('sendEmail', () => {
    it('should send email successfully in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      
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

    it('should use localhost in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      
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

      await expect(sendEmail(emailData)).rejects.toThrow('Failed to send email');
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
      expect(template.html).toContain('PartyHaus');
    });

    it('should include RSVP buttons in the template', () => {
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

      expect(template.html).toContain('Accept');
      expect(template.html).toContain('Decline');
      expect(template.html).toContain('Maybe');
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

      expect(template.html).toContain('QR');
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
      expect(template.html).toContain('confirmed');
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
      expect(template.subject).toContain('Reminder');
      expect(template.subject).toContain('Test Party');
      expect(template.html).toContain('coming up');
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