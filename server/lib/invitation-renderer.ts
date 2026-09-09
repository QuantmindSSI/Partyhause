const RSVP_ORIGIN = 'https://partyhause.com';

export interface FixedInvitationDetails {
  eventName: string;
  hostName: string;
  start: Date;
  end: Date;
  timezone: string;
  location: string;
}

export interface FixedInvitationPreview {
  kind: 'fixed';
  subject: string;
  heading: string;
  eventName: string;
  hostName: string;
  start: string;
  end: string;
  timezone: string;
  location: string;
  message: string;
  actionLabel: string;
}

export interface FixedInvitationEmail {
  subject: string;
  html: string;
  plainText: string;
  rsvpUrl: string;
}

function safeLine(value: string, fallback: string): string {
  const normalized = [...value]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

/** Build the immutable, structured invitation preview shown to a host. */
export function fixedInvitationPreview(details: FixedInvitationDetails): FixedInvitationPreview {
  const eventName = safeLine(details.eventName, 'Private event');
  const hostName = safeLine(details.hostName, 'Your host');
  const timezone = safeLine(details.timezone, 'UTC');
  return {
    kind: 'fixed',
    subject: `Invitation to ${eventName}`,
    heading: 'You are invited',
    eventName,
    hostName,
    start: formatDateTime(details.start, timezone),
    end: formatDateTime(details.end, timezone),
    timezone,
    location: safeLine(details.location, 'Location shared by the host'),
    message: 'Please use your private link to respond to this invitation.',
    actionLabel: 'View invitation and RSVP',
  };
}

/** Render the fixed HTML and plain-text invitation. Dynamic values are escaped. */
export function renderFixedInvitation(
  details: FixedInvitationDetails,
  guestName: string,
  token: string,
): FixedInvitationEmail {
  const preview = fixedInvitationPreview(details);
  const recipient = safeLine(guestName, 'Guest');
  const rsvpUrl = `${RSVP_ORIGIN}/join/${encodeURIComponent(token)}`;
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fbfaf9;color:#26201d;font-family:Arial,sans-serif">
    <main style="max-width:600px;margin:0 auto;padding:32px 24px">
      <p style="margin:0 0 16px">Hello ${escapeHtml(recipient)},</p>
      <h1 style="margin:0 0 20px;font-size:28px">${escapeHtml(preview.heading)}</h1>
      <p style="margin:0 0 20px">${escapeHtml(preview.hostName)} invited you to <strong>${escapeHtml(preview.eventName)}</strong>.</p>
      <dl>
        <dt><strong>Starts</strong></dt><dd>${escapeHtml(preview.start)}</dd>
        <dt><strong>Ends</strong></dt><dd>${escapeHtml(preview.end)}</dd>
        <dt><strong>Timezone</strong></dt><dd>${escapeHtml(preview.timezone)}</dd>
        <dt><strong>Location</strong></dt><dd>${escapeHtml(preview.location)}</dd>
      </dl>
      <p style="margin:28px 0"><a href="${escapeHtml(rsvpUrl)}" rel="noreferrer" style="background:#c02a16;color:#fff;padding:14px 20px;text-decoration:none;border-radius:8px">${escapeHtml(preview.actionLabel)}</a></p>
      <p style="font-size:13px;color:#6a5e58">This link is private and is only for your RSVP.</p>
      <p style="font-size:13px"><a href="${RSVP_ORIGIN}/privacy.html" rel="noreferrer">Privacy</a> | <a href="${RSVP_ORIGIN}/support.html" rel="noreferrer">Support</a></p>
    </main>
  </body>
</html>`;
  const plainText = [
    `Hello ${recipient},`,
    '',
    `${preview.hostName} invited you to ${preview.eventName}.`,
    `Starts: ${preview.start}`,
    `Ends: ${preview.end}`,
    `Timezone: ${preview.timezone}`,
    `Location: ${preview.location}`,
    '',
    `${preview.actionLabel}: ${rsvpUrl}`,
    '',
    `Privacy: ${RSVP_ORIGIN}/privacy.html`,
    `Support: ${RSVP_ORIGIN}/support.html`,
  ].join('\n');
  return { subject: preview.subject, html, plainText, rsvpUrl };
}
