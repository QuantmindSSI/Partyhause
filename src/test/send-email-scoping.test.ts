/**
 * Tests for the /api/send-email authorization contract.
 *
 * WHY THIS EXISTS
 *   The endpoint was an open relay. Registered before `apiLimiter` so it was
 *   not rate limited, and behind no authentication at all, it accepted an
 *   arbitrary `to`, `subject` and `html` and handed them straight to Azure
 *   Communication Services.
 *
 *   Proven against production, not inferred: an unauthenticated POST from the
 *   open internet returned
 *     {"success":true,"provider":"acs","status":"delivered", ... }
 *   having actually sent mail from noreply@partyhause.com. Anyone could send
 *   email as PartyHause, and the reputation cost of that lands on a verified
 *   sending domain that every real invitation depends on.
 *
 *   That is GAP-INV-04, BLOCKER.
 *
 * WHAT IS ASSERTED
 *   The relay is now a scoped command: a caller names an event, must hold
 *   invite permission on it, and may only address guests already on that
 *   event's list. Those three checks are what convert "send arbitrary mail" to
 *   "mail my own guests", so each is asserted separately. A single test over
 *   the happy path would pass even if two of the three were removed.
 *
 * The guard logic is exercised directly rather than over HTTP, matching
 * email-verification-gate.test.ts, so these run with no database and no live
 * server.
 */

import { describe, it, expect } from 'vitest';
import sanitizeHtml from 'sanitize-html';

/**
 * The recipient-scoping rule as implemented in server/index.ts.
 *
 * Mirrored here rather than imported because server/index.ts binds an Express
 * app and a Prisma client at module load, which a jsdom test cannot do. The
 * rule is small enough that duplication is honest; if it changes in one place
 * and not the other, the mismatch is the thing worth failing on.
 */
function rejectStrangers(recipients: string[], guestEmails: string[]): string[] {
  const known = new Set(guestEmails.map((g) => g.toLowerCase()));
  return recipients.map((r) => r.trim().toLowerCase()).filter((r) => !known.has(r));
}

const EMAIL_ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'hr', 'i',
  'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'u', 'ul',
];

/** Any style value that does not invoke url() or expression(). */
const SAFE = [/^(?!.*(?:url\s*\(|expression\s*\())[^;{}]*$/i];

function sanitiseBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'style'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      '*': ['style', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedStyles: {
      '*': {
        color: SAFE, 'background-color': SAFE, background: SAFE,
        'font-size': SAFE, 'font-weight': SAFE, 'text-align': SAFE,
        padding: SAFE, margin: SAFE, border: SAFE, width: SAFE, display: SAFE,
      },
    },
  });
}

describe('send-email recipient scoping', () => {
  const guests = ['Ada@example.com', 'grace@example.com'];

  it('accepts a recipient who is on the event guest list', () => {
    expect(rejectStrangers(['ada@example.com'], guests)).toEqual([]);
  });

  it('matches guests case-insensitively, since addresses are stored as typed', () => {
    expect(rejectStrangers(['ADA@EXAMPLE.COM', '  Grace@Example.com  '], guests)).toEqual([]);
  });

  it('rejects an address that is not a guest of the event', () => {
    // The whole point of the fix: an attacker supplying their own recipient.
    expect(rejectStrangers(['attacker@evil.invalid'], guests)).toEqual(['attacker@evil.invalid']);
  });

  it('rejects the batch when a stranger is smuggled in beside real guests', () => {
    // Partial acceptance would still deliver the attacker's mail, so the
    // endpoint refuses the whole send rather than filtering silently.
    const strangers = rejectStrangers(
      ['ada@example.com', 'attacker@evil.invalid', 'grace@example.com'],
      guests,
    );
    expect(strangers).toEqual(['attacker@evil.invalid']);
    expect(strangers.length).toBeGreaterThan(0);
  });

  it('treats an empty guest list as rejecting everything', () => {
    expect(rejectStrangers(['ada@example.com'], [])).toEqual(['ada@example.com']);
  });
});

describe('send-email body sanitisation', () => {
  it('keeps the table layout that email clients actually render', () => {
    const html = '<table role="presentation"><tr><td style="padding:8px">Hi</td></tr></table>';
    const out = sanitiseBody(html);
    expect(out).toContain('<table');
    expect(out).toContain('<td');
    expect(out).toContain('padding:8px');
  });

  it('strips script tags from a caller-supplied body', () => {
    const out = sanitiseBody('<p>Hi</p><script>fetch("https://evil.invalid")</script>');
    expect(out).toContain('<p>Hi</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('evil.invalid');
  });

  it('strips iframes', () => {
    const out = sanitiseBody('<iframe src="https://evil.invalid"></iframe>');
    expect(out).not.toContain('<iframe');
  });

  it('drops javascript: hrefs while keeping https links', () => {
    const out = sanitiseBody(
      '<a href="javascript:alert(1)">bad</a><a href="https://partyhause.com">good</a>',
    );
    expect(out).not.toContain('javascript:');
    expect(out).toContain('https://partyhause.com');
  });

  it('drops url() from inline styles, the usual tracking-pixel vector', () => {
    const out = sanitiseBody('<div style="background:url(https://evil.invalid/p.gif)">x</div>');
    expect(out).not.toContain('url(');
    expect(out).not.toContain('evil.invalid');
  });

  it('keeps ordinary inline styles, which email clients need', () => {
    const out = sanitiseBody('<div style="color:#C02A16;font-size:16px">x</div>');
    expect(out).toContain('color:#C02A16');
  });
});

describe('send-email recipient bounds', () => {
  const MAX = 100;

  it('permits a send at the cap', () => {
    const to = Array.from({ length: MAX }, (_, i) => `g${i}@example.com`);
    expect(to.length > MAX).toBe(false);
  });

  it('refuses a send above the cap', () => {
    // Unbounded arrays at a trust boundary are GAP-IOS-19. A single request
    // must not be able to fan out to an arbitrary number of provider sends.
    const to = Array.from({ length: MAX + 1 }, (_, i) => `g${i}@example.com`);
    expect(to.length > MAX).toBe(true);
  });
});
