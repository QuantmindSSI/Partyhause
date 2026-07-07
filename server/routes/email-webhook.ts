// Express route: /api/email-webhook
// Resend webhook receiver for email delivery status updates (Prisma-based
// replacement for api/email-webhook.ts). No auth — verified by webhook secret.

import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Types for Resend webhook payload (partial, only fields we consume)
interface ResendWebhookData {
  id?: string;
  email_id?: string;
  created_at?: string;
  metadata?: {
    emailLogId?: string;
    [key: string]: unknown;
  };
  error?: { message?: string } | null;
  [key: string]: unknown;
}

// Map webhook event types to our status values
const statusMap: { [key: string]: string } = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'pending',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
};

// POST /api/email-webhook - Resend webhook receiver (no auth)
router.post('/', async (req, res) => {
  try {
    console.log('📨 Received webhook:', JSON.stringify(req.body, null, 2));

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['resend-webhook-secret'];
      if (signature !== webhookSecret) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const rawBody = (req.body ?? {}) as { type?: string; data?: unknown };
    const type = rawBody.type;
    const data = (rawBody.data ?? undefined) as ResendWebhookData | undefined;

    if (!type || !data) {
      console.error('❌ Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const { email_id, created_at } = data;

    if (!email_id) {
      console.error('❌ Missing email_id in webhook data');
      return res.status(400).json({ error: 'Missing email_id' });
    }

    const newStatus = statusMap[type];
    if (!newStatus) {
      console.log(`ℹ️ Unhandled webhook type: ${type}`);
      return res.status(200).json({ message: 'Webhook received but not processed' });
    }

    console.log(`📧 Processing ${type} for email ${email_id} -> status: ${newStatus}`);

    // Preference: use metadata.emailLogId if present in the webhook payload to
    // find the email log. Fallback to searching by resend_email_id.
    const metadataEmailLogId = data?.metadata?.emailLogId;
    let emailLog: { id: string; status: string | null; guest_id: string | null } | null = null;

    if (metadataEmailLogId) {
      emailLog = await prisma.emailLog.findUnique({
        where: { id: metadataEmailLogId },
        select: { id: true, status: true, guest_id: true },
      });
    }

    if (!emailLog) {
      emailLog = await prisma.emailLog.findFirst({
        where: { resend_email_id: email_id },
        select: { id: true, status: true, guest_id: true },
      });
    }

    if (!emailLog) {
      console.error('❌ Email log not found after metadata/resend id lookup:', {
        metadataEmailLogId,
        email_id,
      });
      return res.status(404).json({ error: 'Email log not found' });
    }

    console.log(`📝 Found email log: ${emailLog.id}`);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      webhook_data: data as any,
    };

    // Set specific timestamp fields
    const timestamp = created_at || new Date().toISOString();
    switch (newStatus) {
      case 'sent':
        updateData.sent_at = new Date(timestamp);
        break;
      case 'delivered':
        updateData.delivered_at = new Date(timestamp);
        break;
      case 'opened':
        updateData.opened_at = new Date(timestamp);
        break;
      case 'clicked':
        updateData.clicked_at = new Date(timestamp);
        break;
      case 'bounced':
        updateData.bounced_at = new Date(timestamp);
        updateData.error_message = data.error?.message || 'Email bounced';
        break;
      case 'complained':
        updateData.error_message = 'Spam complaint received';
        break;
    }

    // Update email log
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: updateData as any,
    });

    // Update guest email status if this is the latest email for this guest
    if (emailLog.guest_id && ['delivered', 'opened', 'clicked', 'bounced'].includes(newStatus)) {
      try {
        await prisma.guest.updateMany({
          where: {
            id: emailLog.guest_id,
            email_log_id: emailLog.id, // Only update if this is their current email
          },
          data: { email_status: newStatus },
        });
        console.log(`✅ Updated guest ${emailLog.guest_id} email status to ${newStatus}`);
      } catch (guestUpdateError) {
        console.error('❌ Failed to update guest email status:', guestUpdateError);
        // Don't fail the webhook for this, just log it
      }
    }

    // Create email event record
    try {
      await prisma.emailEvent.create({
        data: {
          email_log_id: emailLog.id,
          resend_email_id: email_id,
          event_type: type,
          timestamp: new Date(timestamp),
          webhook_data: data as any,
        },
      });
    } catch (eventError) {
      console.error('❌ Failed to create email event:', eventError);
      // Don't fail the webhook for this, just log it
    }

    console.log(`✅ Successfully processed ${type} webhook for email ${email_id}`);

    return res.status(200).json({
      message: 'Webhook processed successfully',
      email_id,
      status: newStatus,
      email_log_id: emailLog.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Webhook processing error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
