import { EmailClient } from '@azure/communication-email';

export interface InvitationProviderMessage {
  recipient: string;
  subject: string;
  html: string;
  plainText: string;
  operationId: string;
}

export interface InvitationProviderResult {
  outcome: 'accepted' | 'failed' | 'unknown';
  provider: 'acs';
  messageId?: string;
  errorCode?: string;
}

export interface InvitationProvider {
  readonly name: 'acs';
  send(message: InvitationProviderMessage): Promise<InvitationProviderResult>;
}

type AcsClient = Pick<EmailClient, 'beginSend'>;
const ACS_ACCEPT_TIMEOUT_MS = 10_000;

interface AcsConfiguration {
  connectionString: string;
  senderAddress: string;
}

function providerErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { name?: unknown; statusCode?: unknown };
    if (candidate.name === 'AbortError') return 'provider_timeout';
    if (candidate.statusCode === 429) return 'provider_rate_limited';
    if (typeof candidate.statusCode === 'number' && candidate.statusCode >= 400 && candidate.statusCode < 500) {
      return 'provider_rejected';
    }
  }
  return 'provider_unavailable';
}

function failedProviderResult(error: unknown, operationId: string): InvitationProviderResult {
  const errorCode = providerErrorCode(error);
  const unknown = errorCode === 'provider_timeout' || errorCode === 'provider_unavailable';
  return {
    outcome: unknown ? 'unknown' : 'failed',
    provider: 'acs',
    errorCode,
    ...(unknown ? { messageId: operationId } : {}),
  };
}

/** Dedicated ACS path for fixed invitations. It never falls back to another provider. */
export class AcsInvitationProvider implements InvitationProvider {
  readonly name = 'acs' as const;
  private client: AcsClient | null;

  constructor(
    client: AcsClient | null = null,
    private readonly configuredConnectionString?: string,
    private readonly configuredSenderAddress?: string,
  ) {
    this.client = client;
  }

  async send(message: InvitationProviderMessage): Promise<InvitationProviderResult> {
    const configuration = this.configuration();
    if (!configuration) {
      return { outcome: 'failed', provider: 'acs', errorCode: 'provider_not_configured' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ACS_ACCEPT_TIMEOUT_MS);
    try {
      return await this.sendConfigured(configuration, message, controller.signal);
    } catch (error) {
      return failedProviderResult(error, message.operationId);
    } finally {
      clearTimeout(timeout);
    }
  }

  private configuration(): AcsConfiguration | null {
    const connectionString = this.configuredConnectionString ?? process.env.ACS_CONNECTION_STRING?.trim() ?? '';
    const senderAddress = this.configuredSenderAddress ?? process.env.ACS_SENDER_ADDRESS?.trim() ?? '';
    return connectionString && senderAddress ? { connectionString, senderAddress } : null;
  }

  private async sendConfigured(
    configuration: AcsConfiguration,
    message: InvitationProviderMessage,
    abortSignal: AbortSignal,
  ): Promise<InvitationProviderResult> {
    if (!this.client) this.client = new EmailClient(configuration.connectionString);
    const poller = await this.client.beginSend({
      senderAddress: configuration.senderAddress,
      content: {
        subject: message.subject,
        html: message.html,
        plainText: message.plainText,
      },
      recipients: { to: [{ address: message.recipient }] },
      disableUserEngagementTracking: true,
    }, { operationId: message.operationId, abortSignal });
    const state = poller.getOperationState();
    if (state.status === 'failed' || state.status === 'canceled') {
      return { outcome: 'failed', provider: 'acs', errorCode: 'provider_rejected' };
    }
    return {
      outcome: 'accepted',
      provider: 'acs',
      messageId: poller.getResult()?.id ?? message.operationId,
    };
  }
}
