import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Zoho Mail SMTP Configuration
const ZOHO_CONFIG = {
  host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.ZOHO_SMTP_PORT || '465'),
  secure: process.env.ZOHO_SMTP_SECURE === 'true' || true, // true for port 465, false for 587
  auth: {
    user: process.env.ZOHO_SMTP_USER || process.env.ZOHO_FROM_EMAIL || '',
    pass: process.env.ZOHO_SMTP_PASS || '',
  },
  // Connection timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,
  socketTimeout: 10000,
  // Debug logging in development
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
};

// Verify configuration on startup
if (!ZOHO_CONFIG.auth.user || !ZOHO_CONFIG.auth.pass) {
  console.warn('⚠️  Zoho Mail credentials not configured. Email sending will fail.');
  console.warn('   Set ZOHO_SMTP_USER and ZOHO_SMTP_PASS environment variables.');
}

// Create reusable transporter
let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

/**
 * Get or create Zoho Mail transporter
 */
function getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
  if (!transporter) {
    transporter = nodemailer.createTransport(ZOHO_CONFIG);
    console.log('✉️  Zoho Mail transporter created');
  }
  return transporter;
}

/**
 * Verify Zoho Mail connection
 */
export async function verifyZohoConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Zoho Mail connection verified');
    return { success: true };
  } catch (error) {
    console.error('❌ Zoho Mail connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection verification failed',
    };
  }
}

export interface ZohoEmailOptions {
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
}

export interface ZohoEmailResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  error?: string;
  response?: string;
}

/**
 * Send email via Zoho Mail SMTP
 */
export async function sendZohoEmail(options: ZohoEmailOptions): Promise<ZohoEmailResult> {
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

    // Get default from email
    const fromEmail = options.from?.email || process.env.ZOHO_FROM_EMAIL || '';
    const fromName = options.from?.name || process.env.ZOHO_FROM_NAME || 'PartyHause';

    if (!fromEmail) {
      throw new Error('From email address is not configured (ZOHO_FROM_EMAIL)');
    }

    const transport = getTransporter();

    // Build mail options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      headers: options.headers,
    };

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ZohoMail] 📧 SENDING EMAIL');
    console.log('[ZohoMail] To:', mailOptions.to);
    console.log('[ZohoMail] Subject:', options.subject);
    console.log('[ZohoMail] From:', mailOptions.from);
    if (options.metadata) {
      console.log('[ZohoMail] Metadata:', JSON.stringify(options.metadata, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Send email
    const info = await transport.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[ZohoMail] ✅ EMAIL SENT SUCCESSFULLY in ${duration}ms`);
    console.log('[ZohoMail] Message ID:', info.messageId);
    console.log('[ZohoMail] Accepted:', info.accepted?.length || 0);
    console.log('[ZohoMail] Rejected:', info.rejected?.length || 0);
    console.log('[ZohoMail] Response:', info.response);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted as string[],
      rejected: info.rejected as string[],
      response: info.response,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[ZohoMail] ❌ ERROR after ${duration}ms`);
    console.error('[ZohoMail] Error type:', error?.constructor?.name || 'Unknown');
    console.error('[ZohoMail] Error message:', error instanceof Error ? error.message : String(error));
    
    // Check for specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      console.error('[ZohoMail] Error code:', errorCode);
      
      if (errorCode === 'EAUTH') {
        console.error('[ZohoMail] Authentication failed - check ZOHO_SMTP_USER and ZOHO_SMTP_PASS');
      } else if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNECTION') {
        console.error('[ZohoMail] Connection timeout - check network and firewall settings');
      } else if (errorCode === 'EENVELOPE') {
        console.error('[ZohoMail] Invalid recipient email address');
      }
    }
    
    if (error instanceof Error && error.stack) {
      console.error('[ZohoMail] Stack trace:', error.stack.substring(0, 500));
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
 * Sends emails in batches with delays to respect Zoho limits
 */
export async function sendBatchZohoEmails(
  emails: ZohoEmailOptions[],
  options?: {
    batchSize?: number; // Number of emails per batch (default: 10)
    delayMs?: number; // Delay between batches in milliseconds (default: 1000)
    onProgress?: (sent: number, total: number) => void;
  }
): Promise<{
  success: boolean;
  results: ZohoEmailResult[];
  successCount: number;
  failureCount: number;
}> {
  const batchSize = options?.batchSize || 10;
  const delayMs = options?.delayMs || 1000;
  const results: ZohoEmailResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`[ZohoMail] 📬 Sending ${emails.length} emails in batches of ${batchSize}`);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, Math.min(i + batchSize, emails.length));
    console.log(`[ZohoMail] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);

    // Send batch in parallel
    const batchResults = await Promise.all(
      batch.map(email => sendZohoEmail(email))
    );

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
      console.log(`[ZohoMail] Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[ZohoMail] ✅ Batch complete: ${successCount} sent, ${failureCount} failed`);

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
export async function testZohoConfig(): Promise<{
  success: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Check environment variables
  checks.ZOHO_SMTP_USER = !!process.env.ZOHO_SMTP_USER;
  checks.ZOHO_SMTP_PASS = !!process.env.ZOHO_SMTP_PASS;
  checks.ZOHO_FROM_EMAIL = !!process.env.ZOHO_FROM_EMAIL;

  if (!checks.ZOHO_SMTP_USER) errors.push('ZOHO_SMTP_USER not set');
  if (!checks.ZOHO_SMTP_PASS) errors.push('ZOHO_SMTP_PASS not set');
  if (!checks.ZOHO_FROM_EMAIL) errors.push('ZOHO_FROM_EMAIL not set');

  // Test connection
  const connectionTest = await verifyZohoConnection();
  checks.CONNECTION = connectionTest.success;
  if (!connectionTest.success) {
    errors.push(`Connection failed: ${connectionTest.error}`);
  }

  return {
    success: Object.values(checks).every(v => v),
    checks,
    errors,
  };
}
