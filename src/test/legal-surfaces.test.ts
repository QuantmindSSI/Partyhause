import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CURRENT_PRIVACY_VERSION as CORE_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION as CORE_TERMS_VERSION,
} from '../../packages/core/src/legal';
import {
  CURRENT_PRIVACY_VERSION as SERVER_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION as SERVER_TERMS_VERSION,
} from '../../server/lib/legal';
import {
  CURRENT_PRIVACY_VERSION as WEB_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION as WEB_TERMS_VERSION,
} from '../lib/legal';

const root = process.cwd();
const privacy = readFileSync(resolve(root, 'public/privacy.html'), 'utf8');
const terms = readFileSync(resolve(root, 'public/terms.html'), 'utf8');
const support = readFileSync(resolve(root, 'public/support.html'), 'utf8');

describe('final legal and support surfaces', () => {
  it('keeps server, client, and published document versions identical', () => {
    expect(SERVER_TERMS_VERSION).toBe(CORE_TERMS_VERSION);
    expect(SERVER_PRIVACY_VERSION).toBe(CORE_PRIVACY_VERSION);
    expect(WEB_TERMS_VERSION).toBe(CORE_TERMS_VERSION);
    expect(WEB_PRIVACY_VERSION).toBe(CORE_PRIVACY_VERSION);
    expect(terms).toContain(`Version ${CORE_TERMS_VERSION}`);
    expect(privacy).toContain(`Version ${CORE_PRIVACY_VERSION}`);
  });

  it('names current processors and the implemented retention periods', () => {
    expect(privacy).toMatch(/Microsoft Azure[\s\S]*PostgreSQL[\s\S]*Azure Communication Services/);
    expect(privacy).toMatch(/Resend[\s\S]*fallback/);
    expect(privacy).toMatch(/Expo[\s\S]*Apple/);
    for (const retention of ['24 hours', '1 hour', '30 days', '90 days', '365 days', '7-day backup']) {
      expect(privacy).toContain(retention);
    }
    expect(privacy).toContain('does not sell personal information');
    expect(privacy).toContain('does not use advertising identifiers or cross-company tracking');
    expect(terms).toContain('does not sell tickets');
  });

  it('removes stale providers and excluded-product claims', () => {
    const all = `${privacy}\n${terms}\n${support}`;
    expect(all).not.toMatch(/Supabase|MailerSend|Vercel|social login|event template|Android|works offline/i);
    expect(all).not.toContain('30 days.\n+                To delete your account');
  });

  it('documents deletion limits and only the established support mailbox', () => {
    expect(privacy).toContain("delivered email is a copy in the recipient's mailbox and cannot be recalled");
    expect(privacy).toContain('another host independently entered you as a guest');
    expect(support).toContain('mailto:support@partyhause.com');
    expect(support).not.toMatch(/24-48|same business day|privacy@|legal@/i);
  });

  it('keeps legal files out of precache and applies hardened no-store responses', () => {
    const vite = readFileSync(resolve(root, 'vite.config.ts'), 'utf8');
    const nginx = readFileSync(resolve(root, 'nginx.conf'), 'utf8');
    expect(vite).toContain("globIgnores: ['privacy.html', 'terms.html', 'support.html']");
    expect(vite).toContain('navigateFallbackDenylist');
    expect(nginx).toMatch(/location ~ \^\/\(privacy\|terms\|support\)[\s\S]*no-cache, no-store[\s\S]*Content-Security-Policy/);
    expect(nginx).toMatch(/location \^~ \/join\/ \{[\s\S]*access_log off[\s\S]*X-Robots-Tag/);
  });
});
