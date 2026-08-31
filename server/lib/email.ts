/**
 * Transactional email transport.
 *
 * Azure Communication Services is the primary provider; Resend is kept as an
 * explicit fallback while the ACS custom domain awaits DNS verification.
 *
 * Why this module exists: sending was previously inlined in two places
 * (`server/index.ts` for /api/send-email and `server/routes/auth.ts` for
 * verification and reset mail), each constructing its own client and each
 * swallowing failures. A caller could not distinguish "sent" from "silently
 * dropped", which is how the product reached a state where password reset was
 * unreachable and nothing logged it.
 *
 * Every function here reports its outcome. Callers decide what to do about it.
 */

import { EmailClient, KnownEmailSendStatus } from '@azure/communication-email';
import { Resend } from 'resend';

export type EmailProvider = 'acs' | 'resend' | 'none';

export interface SendEmailInput {
  /** One or more RFC 5322 addresses. */
  to: string | string[];
  subject: string;
  html: string;
  /** Optional reply-to; senders are fixed by the verified domain. */
  replyTo?: string;
}

/**
 * Outcome of a send attempt.
 *
 * Deliberately a flat interface rather than a discriminated union: this project
 * compiles the server with `strict: false`, under which TypeScript will not
 * narrow a `{ok:true}|{ok:false}` union, so every consumer would need a cast.
 * `error` is populated exactly when `ok` is false; `id` and `status` exactly
 * when it is true.
 */
export interface SendEmailResult {
  ok: boolean;
  provider: EmailProvider;
  id?: string;
  status?: 'delivered' | 'accepted';
  error?: string;
}

/**
 * Upper bound on how long a request will wait for ACS to confirm a send.
 * ACS accepts the message immediately and completes asynchronously, so past
 * this point the message is already queued and waiting longer only delays the
 * HTTP response. Bounded so the poll cannot run unbounded (Power of 10 rule 2).
 */
const ACS_POLL_TIMEOUT_MS = 8_000;
const ACS_POLL_INTERVAL_MS = 500;

let acsClient: EmailClient | null = null;
let resendClient: Resend | null = null;

function acsConnectionString(): string | undefined {
  const raw = process.env.ACS_CONNECTION_STRING?.trim();
  return raw ? raw : undefined;
}

function resendApiKey(): string | undefined {
  const raw = (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '').trim();
  if (!raw) return undefined;
  // Historic .env files shipped literal placeholders; treat them as absent.
  if (raw.includes('placeholder') || raw.includes('your_resend')) return undefined;
  return raw;
}

/** Sender address for ACS. Set by Bicep from the linked domain. */
function acsSenderAddress(): string | undefined {
  const raw = process.env.ACS_SENDER_ADDRESS?.trim();
  return raw ? raw : undefined;
}

function resendFrom(): string {
  const addr = process.env.RESEND_FROM_EMAIL?.trim();
  return addr || 'PartyHause <noreply@partyhause.com>';
}

/**
 * Which transport will actually be used, and whether it is usable.
 * Exposed so /api/health reports the truth instead of "configured" whenever an
 * API key string happens to be non-empty.
 */
export function emailTransportStatus(): {
  provider: EmailProvider;
  configured: boolean;
  sender: string | null;
} {
  if (acsConnectionString() && acsSenderAddress()) {
    return { provider: 'acs', configured: true, sender: acsSenderAddress()! };
  }
  if (resendApiKey()) {
    return { provider: 'resend', configured: true, sender: resendFrom() };
  }
  return { provider: 'none', configured: false, sender: null };
}

function toRecipientList(to: string | string[]): { address: string }[] {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .map((address) => ({ address }));
}

async function sendViaAcs(input: SendEmailInput): Promise<SendEmailResult> {
  const conn = acsConnectionString();
  const sender = acsSenderAddress();
  if (!conn || !sender) {
    return { ok: false, provider: 'acs', error: 'ACS connection string or sender address is not configured' };
  }
  const recipients = toRecipientList(input.to);
  if (recipients.length === 0) {
    return { ok: false, provider: 'acs', error: 'No valid recipient address supplied' };
  }
  try {
    if (!acsClient) acsClient = new EmailClient(conn);
    const poller = await acsClient.beginSend({
      senderAddress: sender,
      content: { subject: input.subject, html: input.html },
      recipients: { to: recipients },
      ...(input.replyTo ? { replyTo: [{ address: input.replyTo }] } : {}),
    });

    // Bounded poll. Once the deadline passes the message is already accepted by
    // ACS, so report success rather than failing a request that did work.
    const deadline = Date.now() + ACS_POLL_TIMEOUT_MS;
    while (!poller.isDone() && Date.now() < deadline) {
      await poller.poll();
      if (poller.isDone()) break;
      await new Promise((r) => setTimeout(r, ACS_POLL_INTERVAL_MS));
    }

    if (!poller.isDone()) {
      return { ok: true, provider: 'acs', id: 'pending', status: 'accepted' };
    }

    const result = poller.getResult();
    if (!result) {
      return { ok: false, provider: 'acs', error: 'ACS returned no result for a completed send' };
    }
    if (result.status === KnownEmailSendStatus.Succeeded) {
      return { ok: true, provider: 'acs', id: result.id, status: 'delivered' };
    }
    const detail = result.error?.message || result.status || 'unknown status';
    return { ok: false, provider: 'acs', error: `ACS send finished with status ${result.status}: ${detail}` };
  } catch (err) {
    return { ok: false, provider: 'acs', error: err instanceof Error ? err.message : String(err) };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const key = resendApiKey();
  if (!key) return { ok: false, provider: 'resend', error: 'RESEND_API_KEY is not configured' };
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).map((a) => a.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, provider: 'resend', error: 'No valid recipient address supplied' };
  }
  try {
    if (!resendClient) resendClient = new Resend(key);
    const { data, error } = await resendClient.emails.send({
      from: resendFrom(),
      to: recipients,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) return { ok: false, provider: 'resend', error: error.message || String(error) };
    return { ok: true, provider: 'resend', id: data?.id ?? 'unknown', status: 'accepted' };
  } catch (err) {
    return { ok: false, provider: 'resend', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send one transactional email.
 *
 * Prefers Azure Communication Services. Falls back to Resend only when ACS is
 * not configured, or when an ACS attempt fails and Resend credentials exist,
 * so a provider outage does not take verification and password-reset mail down.
 *
 * @param input Recipient(s), subject and HTML body. Sender is fixed by config.
 * @returns Discriminated result. Never throws; inspect `ok`.
 *
 * Complexity: O(recipients). One network round trip per provider attempted,
 * plus bounded polling of at most ACS_POLL_TIMEOUT_MS. Blocking I/O.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!input.subject?.trim()) return { ok: false, provider: 'none', error: 'Subject is required' };
  if (!input.html?.trim()) return { ok: false, provider: 'none', error: 'HTML body is required' };

  const hasAcs = Boolean(acsConnectionString() && acsSenderAddress());
  const hasResend = Boolean(resendApiKey());

  if (!hasAcs && !hasResend) {
    return { ok: false, provider: 'none', error: 'No email transport is configured (set ACS_CONNECTION_STRING and ACS_SENDER_ADDRESS)' };
  }

  if (hasAcs) {
    const acs = await sendViaAcs(input);
    if (acs.ok) return acs;
    if (!hasResend) return acs;
    console.warn(`[email] ACS send failed, falling back to Resend: ${acs.error}`);
    const fallback = await sendViaResend(input);
    if (fallback.ok) return fallback;
    return { ok: false, provider: 'acs', error: `ACS: ${acs.error}; Resend fallback: ${fallback.error}` };
  }

  return sendViaResend(input);
}
