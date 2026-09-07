/**
 * Mobile Email Service
 * Handles sending invitation emails from the mobile app
 */

import { Platform } from 'react-native';
import { apiUrl, invitationUrl, getWebBaseUrl } from './api';
import { getAccessToken } from './client';

// Endpoint resolution lives in lib/api.ts. This file previously hardcoded
// https://partyhause.netlify.app, a deployment target that has been
// discontinued, so every send failed in any production build. It also used
// 192.168.56.1 as the iOS simulator host, which is a VirtualBox NAT address
// rather than the simulator loopback.
const EMAIL_API_URL = apiUrl('/api/send-email');

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /**
   * The event this send belongs to. Required, not optional.
   *
   * /api/send-email now refuses any request without it (server/index.ts). The
   * endpoint used to be an open relay: no auth, arbitrary recipients. It is
   * now a scoped command, and the scope is an event the caller may invite for.
   * Passing it inside `metadata` is not enough; the server reads `event_id`
   * from the top level of the body.
   */
  eventId: string;
  metadata?: {
    emailLogId?: string;
    guestId?: string;
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
  const startTime = Date.now();
  
  try {
      // Recipient addresses and metadata are deliberately not logged: this runs
      // in release builds too, and device logs are readable by other tooling.
      if (__DEV__) {
        console.log('[EmailService] sending via', EMAIL_API_URL, 'platform', Platform.OS);
      }

    // Authorization was absent here for the whole life of this file. It did
    // not matter while /api/send-email was anonymous; it does now, and without
    // it every mobile send is a 401 before a provider is ever contacted.
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'You need to be signed in to send invitations.' };
    }

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        event_id: options.eventId,
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`[EmailService] ⏱️  Response received in ${duration}ms`);
    console.log('[EmailService] Status:', response.status, response.statusText);

    const text = await response.text();
    console.log('[EmailService] Response length:', text.length, 'bytes');
    
    // Log first 200 chars for debugging
    if (text.length > 200) {
      console.log('[EmailService] Response preview:', text.substring(0, 200) + '...');
    } else {
      console.log('[EmailService] Full response:', text);
    }

    let data;
    try {
      data = JSON.parse(text);
      console.log('[EmailService] ✅ Parsed JSON successfully');
    } catch (e) {
      console.error('[EmailService] ❌ JSON PARSE ERROR');
      console.error('[EmailService] Parse error:', e instanceof Error ? e.message : String(e));
      console.error('[EmailService] Response was:', text.substring(0, 500));
      throw new Error('Invalid API response: ' + text.substring(0, 100));
    }

    if (!response.ok) {
      console.error('[EmailService] ❌ API ERROR RESPONSE');
      console.error('[EmailService] Status:', response.status);
      console.error('[EmailService] Error data:', JSON.stringify(data, null, 2));
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[EmailService] ✅ EMAIL SENT SUCCESSFULLY!');
    console.log('[EmailService] Message ID:', data.data?.id || 'N/A');
    console.log('[EmailService] Response:', JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[EmailService] ❌ ERROR after ${duration}ms`);
    console.error('[EmailService] Error type:', error?.constructor?.name || 'Unknown');
    console.error('[EmailService] Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('[EmailService] Stack trace:', error.stack.substring(0, 500));
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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
  return invitationUrl(eventId, guestId);
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
  guest: { name: string; email: string; guest_id?: string },
  event: { id: string; name: string; date: string; location: string; description?: string },
  options?: {
    emailLogId?: string;
  }
): Promise<SendEmailResult> {
  try {
    // The guest id belongs in the RSVP link. It was passed as '' with the
    // comment "Guest ID will be added after creation", which produced a URL
    // ending in a bare slash that the web app cannot resolve to a guest, so
    // every RSVP button in every mobile-sent invitation was dead.
    const rsvpUrl = generateInvitationUrl(event.id, guest.guest_id ?? '');
    const html = buildInvitationEmail(guest.name, event, rsvpUrl);

    const result = await sendEmail({
      to: guest.email,
      subject: `🎉 You're Invited to ${event.name}!`,
      html,
      eventId: event.id,
      metadata: {
        emailLogId: options?.emailLogId,
        guestId: guest.guest_id,
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

/**
 * Send the event's invitation to a set of recipients.
 *
 * @param options.event      the real event, used to render the invitation body
 * @param options.recipients guests who already exist on the event's guest list
 * @returns aggregate success, plus the addresses that failed
 *
 * WHAT THIS USED TO SEND
 *   A fixed three-line body reading "You've been invited to an event. More
 *   details coming soon!" with no event name, no date and no location, above
 *   a link to the web app. `buildInvitationEmail` in this same file renders a
 *   complete invitation with all of those fields, and was never called from
 *   here.
 *
 *   It also passed `eventId` inside `metadata`, where the server never looks,
 *   so every send was a 400 even once authentication was added.
 *
 * WHY RECIPIENTS MUST ALREADY BE GUESTS
 *   /api/send-email restricts recipients to addresses on that event's guest
 *   list. A name typed into the compose screen is not a guest until it has
 *   been POSTed to /api/guests, so the caller creates it first and passes the
 *   resulting row here. Sending to a stranger is refused server-side, and that
 *   is deliberate: the endpoint was an open relay before.
 *
 * Complexity: one request per recipient, issued concurrently.
 */
export async function sendInviteEmails(options: {
  event: { id: string; name: string; date: string; location: string; description?: string };
  recipients: { name: string; email: string; guest_id?: string }[];
}): Promise<SendEmailResult & { failedRecipients: string[] }> {
  if (options.recipients.length === 0) {
    return { success: false, error: 'No recipients selected', failedRecipients: [] };
  }

  try {
    const results = await Promise.all(
      options.recipients.map(async (recipient) => ({
        email: recipient.email,
        result: await sendInvitationEmail(recipient, options.event),
      })),
    );

    const failed = results.filter((r) => !r.result.success);

    // Naming the addresses that failed is the difference between a retry and a
    // guess. The old code answered "Some emails failed to send" and discarded
    // which ones, so a host had no way to tell who had been invited.
    return {
      success: failed.length === 0,
      messageId: failed.length === 0 ? 'batch-send-success' : undefined,
      error:
        failed.length === 0
          ? undefined
          : `${failed.length} of ${results.length} invitations failed: ${failed[0].result.error ?? 'unknown error'}`,
      failedRecipients: failed.map((f) => f.email),
    };
  } catch (error) {
    console.error('[EmailService] Error in sendInviteEmails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invites',
      failedRecipients: options.recipients.map((r) => r.email),
    };
  }
}
