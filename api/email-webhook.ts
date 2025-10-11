import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client for webhook handler
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Resend webhook handler for email delivery status updates
export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Resend-Webhook-Secret');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const body = req.body as { type?: string; data?: unknown };
    const type = body.type;
    const data = body.data as ResendWebhookData | undefined;

    if (!type || !data) {
      console.error('❌ Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const { email_id, created_at } = data as ResendWebhookData;

    if (!email_id) {
      console.error('❌ Missing email_id in webhook data');
      return res.status(400).json({ error: 'Missing email_id' });
    }

    // Map webhook event types to our status values
    const statusMap: { [key: string]: string } = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'pending',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'opened',
      'email.clicked': 'clicked'
    };

    const newStatus = statusMap[type];
    if (!newStatus) {
      console.log(`ℹ️ Unhandled webhook type: ${type}`);
      return res.status(200).json({ message: 'Webhook received but not processed' });
    }

    console.log(`📧 Processing ${type} for email ${email_id} -> status: ${newStatus}`);

    // Preference: use metadata.emailLogId if present in the webhook payload to find the email log.
    // Fallback to searching by resend_email_id for compatibility.
    const metadataEmailLogId = data?.metadata?.emailLogId;
    let emailLog = null;
    let findError = null;

    if (metadataEmailLogId) {
      const r = await supabase
        .from('email_logs')
        .select('id, status, guest_id')
        .eq('id', metadataEmailLogId)
        .single();
      emailLog = r.data;
      findError = r.error;
    }

    if (!emailLog) {
      const r2 = await supabase
        .from('email_logs')
        .select('id, status, guest_id')
        .eq('resend_email_id', email_id)
        .single();
      emailLog = r2.data;
      findError = r2.error;
    }

    if (findError) {
      console.error('❌ Email log not found:', email_id, findError);
      return res.status(404).json({ error: 'Email log not found' });
    }

    if (!emailLog) {
      console.error('❌ Email log not found after metadata/resend id lookup:', { metadataEmailLogId, email_id });
      return res.status(404).json({ error: 'Email log not found' });
    }

    console.log(`📝 Found email log: ${emailLog.id}`);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      webhook_data: data as ResendWebhookData
    };

    // Set specific timestamp fields
    const timestamp = created_at || new Date().toISOString();
    switch (newStatus) {
      case 'sent':
        updateData.sent_at = timestamp;
        break;
      case 'delivered':
        updateData.delivered_at = timestamp;
        break;
      case 'opened':
        updateData.opened_at = timestamp;
        break;
      case 'clicked':
        updateData.clicked_at = timestamp;
        break;
      case 'bounced':
        updateData.bounced_at = timestamp;
  updateData.error_message = (data && (data as ResendWebhookData).error?.message) || 'Email bounced';
        break;
      case 'complained':
        updateData.error_message = 'Spam complaint received';
        break;
    }

    // Update email log
    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', emailLog.id);

    if (updateError) {
      console.error('❌ Failed to update email log:', updateError);
      return res.status(500).json({ error: 'Failed to update email log' });
    }

    // Update guest email status if this is the latest email for this guest
    if (emailLog.guest_id && ['delivered', 'opened', 'clicked', 'bounced'].includes(newStatus)) {
      const { error: guestUpdateError } = await supabase
        .from('guests')
        .update({ email_status: newStatus })
        .eq('id', emailLog.guest_id)
        .eq('email_log_id', emailLog.id); // Only update if this is their current email

      if (guestUpdateError) {
        console.error('❌ Failed to update guest email status:', guestUpdateError);
        // Don't fail the webhook for this, just log it
      } else {
    console.log(`✅ Updated guest ${emailLog.guest_id} email status to ${newStatus}`);
      }
    }

    // Create email event record
    const { error: eventError } = await supabase
      .from('email_events')
      .insert({
        email_log_id: emailLog.id,
        resend_email_id: email_id,
        event_type: type,
        timestamp,
        webhook_data: data
      });

    if (eventError) {
      console.error('❌ Failed to create email event:', eventError);
      // Don't fail the webhook for this, just log it
    }

    console.log(`✅ Successfully processed ${type} webhook for email ${email_id}`);

    return res.status(200).json({ 
      message: 'Webhook processed successfully',
      email_id,
      status: newStatus,
      email_log_id: emailLog.id
    });

    } catch (error: unknown) {
    console.error('❌ Webhook processing error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}