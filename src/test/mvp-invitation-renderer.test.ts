import { describe, expect, it, vi } from 'vitest';

import { AcsInvitationProvider } from '../../server/lib/invitation-provider';
import { fixedInvitationPreview, renderFixedInvitation } from '../../server/lib/invitation-renderer';

const details = {
  eventName: 'Dinner & <Dancing>',
  hostName: 'Ada <Host>',
  start: new Date('2030-02-01T18:00:00.000Z'),
  end: new Date('2030-02-01T20:00:00.000Z'),
  timezone: 'UTC',
  location: 'Hall <script>alert(1)</script>',
};

describe('fixed invitation renderer', () => {
  it('escapes every dynamic HTML value and emits the canonical token link', () => {
    const rendered = renderFixedInvitation(details, 'Grace & <Guest>', 'A'.repeat(43));

    expect(rendered.rsvpUrl).toBe(`https://partyhause.com/join/${'A'.repeat(43)}`);
    expect(rendered.html).toContain('Dinner &amp; &lt;Dancing&gt;');
    expect(rendered.html).toContain('Ada &lt;Host&gt;');
    expect(rendered.html).toContain('Grace &amp; &lt;Guest&gt;');
    expect(rendered.html).not.toContain('<script>');
    expect(rendered.plainText).toContain(rendered.rsvpUrl);
    expect(rendered.html).toContain('https://partyhause.com/privacy.html');
    expect(rendered.html).toContain('https://partyhause.com/support.html');
  });

  it('removes control characters from the fixed subject and preview fields', () => {
    const unsafe = { ...details, eventName: 'Dinner\r\nBcc: attacker@example.com' };
    const preview = fixedInvitationPreview(unsafe);
    const rendered = renderFixedInvitation(unsafe, 'Guest', 'B'.repeat(43));

    expect(preview.subject).toBe('Invitation to Dinner Bcc: attacker@example.com');
    expect(rendered.subject).not.toMatch(/[\r\n]/);
    expect(rendered.subject).not.toContain('\r\nBcc:');
  });
});

describe('ACS invitation provider', () => {
  it('uses one recipient, disables tracking, and maps provider success to accepted', async () => {
    const beginSend = vi.fn().mockResolvedValue({
      getOperationState: () => ({ status: 'succeeded' }),
      getResult: () => ({ id: 'acs-message-1', status: 'Succeeded' }),
    });
    const provider = new AcsInvitationProvider(
      { beginSend } as never,
      'endpoint=https://example.communication.azure.com/;accesskey=secret',
      'noreply@partyhause.com',
    );

    const result = await provider.send({
      recipient: 'guest@example.com',
      subject: 'Invitation',
      html: '<p>Invitation</p>',
      plainText: 'Invitation',
      operationId: 'operation-1',
    });

    expect(result).toEqual({ outcome: 'accepted', provider: 'acs', messageId: 'acs-message-1' });
    expect(beginSend).toHaveBeenCalledTimes(1);
    expect(beginSend).toHaveBeenCalledWith(expect.objectContaining({
      recipients: { to: [{ address: 'guest@example.com' }] },
      disableUserEngagementTracking: true,
      content: expect.objectContaining({ plainText: 'Invitation' }),
    }), expect.objectContaining({ operationId: 'operation-1', abortSignal: expect.any(Object) }));
    expect(result).not.toHaveProperty('status', 'delivered');
  });

  it('reports an unknown outcome with the stable operation id when acceptance times out', async () => {
    const beginSend = vi.fn().mockRejectedValue({ name: 'AbortError' });
    const provider = new AcsInvitationProvider(
      { beginSend } as never,
      'endpoint=https://example.communication.azure.com/;accesskey=secret',
      'noreply@partyhause.com',
    );

    const result = await provider.send({
      recipient: 'guest@example.com',
      subject: 'Invitation',
      html: '<p>Invitation</p>',
      plainText: 'Invitation',
      operationId: 'operation-timeout',
    });

    expect(result).toEqual({
      outcome: 'unknown',
      provider: 'acs',
      errorCode: 'provider_timeout',
      messageId: 'operation-timeout',
    });
  });
});
