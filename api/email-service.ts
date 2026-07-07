import { Resend } from 'resend';

// Resend configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'PartyHause';

// Verify configuration on startup
if (!RESEND_API_KEY) {
  console.warn('⚠️  Resend API key not configured. Email sending will fail.');
  console.warn('   Set the RESEND_API_KEY environment variable.');
}
if (!RESEND_FROM_EMAIL) {
  console.warn('⚠️  Resend from email not configured. Email sending will fail.');
  console.warn('   Set RESEND_FROM_EMAIL to a verified sending address (e.g.PartyHause <noreply@partyhause.com>).');
}

// Reusable Resend client (instantiated lazily so tests/mocks can set env first)
let client: Resend | null = null;

/**
 * Get or create the Resend client
 */
function getClient(): Resend {
  if (!client) {
    client = new Resend(RESEND_API_KEY);
    console.log('✉️  Resend client created');
  }
  return client;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: { email: string; name?: string };
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  error?: string;
  response?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const startTime = Date.now();

  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email address (to) is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.html && !options.text) {
      throw new Error('Email content (html or text) is required');
    }

    // Resolve from header
    const fromEmail = options.from?.email || RESEND_FROM_EMAIL;
    const fromName = options.from?.name || RESEND_FROM_NAME;

    if (!fromEmail) {
      throw new Error('From email address is not configured (RESEND_FROM_EMAIL)');
    }

    if (!RESEND_API_KEY) {
      throw new Error('Resend API key is not configured (RESEND_API_KEY)');
    }

    const resend = getClient();

    // Resend expects `to` as a string array
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    const fromHeader = `${fromName} <${fromEmail}>`;

    // Build the Resend payload
    const payload: Record<string, any> = {
      from: fromHeader,
      to: toList,
      subject: options.subject,
    };
    if (options.html) payload.html = options.html;
    if (options.text) payload.text = options.text;
    if (options.replyTo) payload.reply_to = options.replyTo;
    if (options.cc) payload.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
    if (options.bcc) payload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    if (options.headers) payload.headers = options.headers;
    if (options.tags) payload.tags = options.tags;
    if (options.metadata) {
      // Resend supports arbitrary metadata via the `metadata` field (string-keyed, string-valued)
      payload.metadata = Object.fromEntries(
        Object.entries(options.metadata).map(([k, v]) => [k, v == null ? '' : String(v)])
      );
    }
    if (options.attachments) {
      payload.attachments = options.attachments.map(a => ({
        filename: a.filename,
        content:
          typeof a.content === 'string'
            ? Buffer.from(a.content).toString('base64')
            : a.content instanceof Buffer
              ? a.content.toString('base64')
              : a.content,
        path: a.path,
        content_type: a.contentType,
      }));
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Resend] 📧 SENDING EMAIL');
    console.log('[Resend] To:', toList.join(', '));
    console.log('[Resend] Subject:', options.subject);
    console.log('[Resend] From:', fromHeader);
    if (options.metadata) {
      console.log('[Resend] Metadata:', JSON.stringify(options.metadata, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { data, error } = await resend.emails.send(payload);
    const duration = Date.now() - startTime;

    if (error) {
      throw error;
    }

    const messageId = data?.id || '';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Resend] ✅ EMAIL SENT SUCCESSFULLY in ${duration}ms`);
    console.log('[Resend] Message ID:', messageId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      messageId,
      accepted: toList,
      rejected: [],
      response: 'OK',
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[Resend] ❌ ERROR after ${duration}ms`);
    console.error('[Resend] Error type:', error?.constructor?.name || 'Unknown');
    console.error('[Resend] Error message:', error instanceof Error ? error.message : String(error));
    if (error?.name) {
      console.error('[Resend] Error name:', error.name);
    }
    if (error instanceof Error && error.stack) {
      console.error('[Resend] Stack trace:', error.stack.substring(0, 500));
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send batch emails with rate limiting
 * Sends emails in batches with delays to respect Resend limits
 */
export async function sendBatchEmails(
  emails: EmailOptions[],
  options?: {
    batchSize?: number; // Number of emails per batch (default: 10)
    delayMs?: number; // Delay between batches in milliseconds (default: 1000)
    onProgress?: (sent: number, total: number) => void;
  }
): Promise<{
  success: boolean;
  results: EmailResult[];
  successCount: number;
  failureCount: number;
}> {
  const batchSize = options?.batchSize || 10;
  const delayMs = options?.delayMs || 1000;
  const results: EmailResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`[Resend] 📬 Sending ${emails.length} emails in batches of ${batchSize}`);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, Math.min(i + batchSize, emails.length));
    console.log(`[Resend] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);

    // Send batch in parallel
    const batchResults = await Promise.all(batch.map(email => sendEmail(email)));

    results.push(...batchResults);
    batchResults.forEach(result => {
      if (result.success) successCount++;
      else failureCount++;
    });

    // Report progress
    if (options?.onProgress) {
      options.onProgress(results.length, emails.length);
    }

    // Wait before next batch (except for last batch)
    if (i + batchSize < emails.length) {
      console.log(`[Resend] Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[Resend] ✅ Batch complete: ${successCount} sent, ${failureCount} failed`);

  return {
    success: failureCount === 0,
    results,
    successCount,
    failureCount,
  };
}

/**
 * Build HTML email template
 */
export function buildEmailHtml(content: {
  title: string;
  preheader?: string;
  body: string;
  footer?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${content.preheader ? `<meta name="description" content="${content.preheader}">` : ''}
  <title>${content.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .body {
      padding: 40px 30px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 0;
      }
      .body, .footer {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="body">
      ${content.body}
    </div>
    ${content.footer ? `<div class="footer">${content.footer}</div>` : ''}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{
  success: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Check environment variables
  checks.RESEND_API_KEY = !!process.env.RESEND_API_KEY;
  checks.RESEND_FROM_EMAIL = !!process.env.RESEND_FROM_EMAIL;

  if (!checks.RESEND_API_KEY) errors.push('RESEND_API_KEY not set');
  if (!checks.RESEND_FROM_EMAIL) errors.push('RESEND_FROM_EMAIL not set');

  // Resend does not expose a lightweight verify() endpoint; presence of the key
  // is the best local check. A real connectivity check happens on first send.
  checks.CONFIG_PRESENT = checks.RESEND_API_KEY && checks.RESEND_FROM_EMAIL;

  return {
    success: Object.values(checks).every(v => v),
    checks,
    errors,
  };
}
