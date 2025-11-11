import { InviteTemplate } from '../types/invites';

export interface InviteEmailData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  hostName: string;
  message?: string;
  rsvpLink: string;
  template: InviteTemplate;
}

export function buildInvitationEmail(data: InviteEmailData): string {
  const { template, eventName, eventDate, eventTime, location, hostName, message, rsvpLink } = data;
  const { colors, fonts, emoji, layout } = template;

  // Format date for better readability
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Choose layout-specific structure
  const layoutClass = layout || 'classic';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${fonts?.body || 'system-ui, -apple-system, sans-serif'};
      line-height: 1.6;
      color: ${colors.text};
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.background};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: ${colors.primary};
      color: ${colors.textOnPrimary};
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-family: ${fonts?.heading || 'Georgia, serif'};
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 15px;
      display: block;
    }
    .content {
      padding: 40px 30px;
    }
    .event-details {
      background-color: ${colors.accent};
      border-left: 4px solid ${colors.secondary};
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .event-details h2 {
      font-family: ${fonts?.heading || 'Georgia, serif'};
      color: ${colors.primary};
      font-size: 24px;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .detail-row {
      margin: 15px 0;
      font-size: 16px;
    }
    .detail-label {
      font-weight: 700;
      color: ${colors.text};
      display: inline-block;
      width: 100px;
    }
    .detail-value {
      color: ${colors.text};
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      margin: 25px 0;
      color: ${colors.text};
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background-color: ${colors.primary};
      color: ${colors.textOnPrimary};
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 18px;
      margin: 30px auto;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .cta-button:hover {
      background-color: ${colors.secondary};
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      background-color: ${colors.accent};
      padding: 30px;
      text-align: center;
      color: ${colors.text};
      font-size: 14px;
      border-top: 1px solid ${colors.secondary};
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.8;
    }
    .divider {
      height: 2px;
      background-color: ${colors.secondary};
      margin: 30px 0;
      border-radius: 1px;
    }
    
    /* Layout-specific styles */
    .layout-banner .header {
      padding: 60px 30px;
    }
    .layout-card .event-details {
      border: 2px solid ${colors.primary};
      border-left: 4px solid ${colors.primary};
    }
    .layout-split .content {
      display: block;
    }
    .layout-centered {
      text-align: center;
    }
    .layout-centered .event-details {
      border-left: none;
      border-top: 4px solid ${colors.secondary};
    }

    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .header .emoji {
        font-size: 36px;
      }
      .content {
        padding: 30px 20px;
      }
      .event-details {
        padding: 20px;
      }
      .event-details h2 {
        font-size: 20px;
      }
      .detail-label {
        width: 80px;
        font-size: 14px;
      }
      .detail-value {
        font-size: 14px;
      }
      .cta-button {
        padding: 14px 30px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container layout-${layoutClass}">
    <!-- Header -->
    <div class="header">
      ${emoji ? `<span class="emoji">${emoji}</span>` : ''}
      <h1>${eventName}</h1>
      <p>You're Invited!</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 20px;">
        Hi there! 👋
      </p>
      
      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        <strong>${hostName}</strong> is excited to invite you to <strong>${eventName}</strong>. 
        We hope you can join us for this special occasion!
      </p>

      ${message ? `<div class="message">"${message}"</div>` : ''}

      <div class="divider"></div>

      <!-- Event Details Card -->
      <div class="event-details">
        <h2>Event Details</h2>
        
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">🕐 Time:</span>
          <span class="detail-value">${eventTime}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">📍 Location:</span>
          <span class="detail-value">${location}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- CTA -->
      <div class="cta-container">
        <a href="${rsvpLink}" class="cta-button">
          RSVP Now
        </a>
        <p style="margin-top: 15px; font-size: 14px; color: ${colors.text};">
          Click the button above to confirm your attendance
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>PartyHause</strong></p>
      <p>Making every celebration memorable</p>
      <p style="font-size: 12px; margin-top: 15px;">
        This invitation was sent via PartyHause. 
        If you have any questions, please contact ${hostName}.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Plain text version for email clients that don't support HTML
export function buildPlainTextInvitation(data: InviteEmailData): string {
  const { eventName, eventDate, eventTime, location, hostName, message, rsvpLink } = data;
  
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
You're Invited to ${eventName}!

${hostName} is excited to invite you to ${eventName}.

${message ? `"${message}"\n` : ''}

EVENT DETAILS:
--------------
Date: ${formattedDate}
Time: ${eventTime}
Location: ${location}

RSVP: ${rsvpLink}

Please click the link above to confirm your attendance.

---
This invitation was sent via PartyHause
Making every celebration memorable
  `.trim();
}
