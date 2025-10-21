/**
 * Mobile Email Service
 * Handles sending invitation emails from the mobile app
 */

import { Platform } from 'react-native';

// Email API configuration
// Development: Points to local email server on port 3001
// iOS Simulator: Uses host machine's IP (192.168.56.1)
// Android Emulator: Uses special alias 10.0.2.2 which maps to host's localhost
// Physical Devices: Must use actual IP address of development machine (192.168.56.1)
const EMAIL_API_URL = __DEV__ 
  ? Platform.select({
      ios: 'http://192.168.56.1:3001/api/send-email', // iOS simulator & physical devices
      android: 'http://10.0.2.2:3001/api/send-email', // Android emulator maps to host localhost
      default: 'http://192.168.56.1:3001/api/send-email', // Physical devices - ensure same WiFi network
    })
  : 'https://partyhause.vercel.app/api/send-email'; // Production - update with actual domain

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  metadata?: {
    emailLogId?: string;
    guestId?: string;
    eventId?: string;
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    console.log('[EmailService] Sending email to:', options.to);
    console.log('[EmailService] API URL:', EMAIL_API_URL);

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[EmailService] Failed to parse response:', text);
      throw new Error('Invalid API response');
    }

    if (!response.ok) {
      console.error('[EmailService] API error:', data);
      throw new Error(data.error || 'Email sending failed');
    }

    console.log('[EmailService] Email sent successfully:', data);

    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate invitation URL
 */
export function generateInvitationUrl(eventId: string, guestId: string): string {
  const baseUrl = __DEV__ 
    ? 'http://localhost:5173' 
    : 'https://your-domain.vercel.app';
  
  return `${baseUrl}/event/${eventId}/guest/${guestId}`;
}

/**
 * Build invitation email HTML
 */
export function buildInvitationEmail(
  guestName: string,
  eventDetails: {
    name: string;
    date: string;
    location: string;
    description?: string;
  },
  rsvpUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .party-icon {
      font-size: 60px;
      margin-bottom: 10px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    
    .event-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
      border-left: 5px solid #667eea;
    }
    
    .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      color: #555;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 18px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      
      .container {
        border-radius: 10px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 26px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .event-card {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="party-icon">🎉</div>
      <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hi <strong>${guestName}</strong>,
      </div>
      
      <p>You've been invited to an amazing event! We'd love for you to join us for an unforgettable experience.</p>
      
      <div class="event-card">
        <div class="event-title">${eventDetails.name}</div>
        <div class="event-details">
          <div class="detail-item">
            📅 <strong>${eventDetails.date}</strong>
          </div>
          <div class="detail-item">
            📍 <strong>${eventDetails.location}</strong>
          </div>
          ${eventDetails.description ? `
          <div class="detail-item" style="margin-top: 12px;">
            ${eventDetails.description}
          </div>
          ` : ''}
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${rsvpUrl}" class="cta-button">✨ RSVP Now ✨</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Click the button above to confirm your attendance and get all the event details. 
        We can't wait to see you there!
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-logo">PartyHause 🎊</div>
      <p>Making events memorable, one invitation at a time.</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        Sent from PartyHause Mobile App
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send invitation email to a guest
 */
export async function sendInvitationEmail(
  guest: { name: string; email: string },
  event: { id: string; name: string; date: string; location: string; description?: string },
  options?: {
    emailLogId?: string;
  }
): Promise<SendEmailResult> {
  try {
    const invitationUrl = generateInvitationUrl(event.id, ''); // Guest ID will be added after creation
    const html = buildInvitationEmail(guest.name, event, invitationUrl);

    const result = await sendEmail({
      to: guest.email,
      subject: `🎉 You're Invited to ${event.name}!`,
      html,
      metadata: {
        emailLogId: options?.emailLogId,
        eventId: event.id,
      },
    });

    return result;
  } catch (error) {
    console.error('[EmailService] Error in sendInvitationEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
}
