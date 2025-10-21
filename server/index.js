import express from 'express';
import cors from 'cors';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3001;

// Get MailerSend credentials from environment
const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN;
const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL;

// Initialize MailerSend with your API key
const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_TOKEN,
});

app.use(cors({
  origin: 'http://localhost:5173' // Your Vite app's URL
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email server is running' });
});

app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📨 [server] /api/send-email called from', req.headers.origin || req.ip);
    console.log('📨 [server] request body:', JSON.stringify(req.body));
    console.log('📨 [server] env MAILERSEND_API_TOKEN present:', !!MAILERSEND_API_TOKEN);
    console.log('📨 [server] env MAILERSEND_FROM_EMAIL present:', !!MAILERSEND_FROM_EMAIL);
    
    const { to, subject, html, metadata } = req.body;
    
    if (!MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN must be set');
      return res.status(500).json({ success: false, error: 'Server configuration error: MAILERSEND_API_TOKEN not set' });
    }
    
    if (!MAILERSEND_FROM_EMAIL) {
      console.error('MAILERSEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: MAILERSEND_FROM_EMAIL not set' });
    }

    // Determine 'from' header. Allow override from request only when explicitly enabled via env.
    let fromEmail = MAILERSEND_FROM_EMAIL;
    let fromName = 'PartyHause';
    
    if (req.body && req.body.from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      fromEmail = req.body.from;
      console.log('📨 [server] Using overridden from header from request:', fromEmail);
    } else {
      console.log('📨 [server] Using configured from header: PartyHause <' + String(MAILERSEND_FROM_EMAIL) + '>');
    }

    const sentFrom = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(to, to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    const data = await mailerSend.email.send(emailParams);
    
    console.log('📨 [server] MailerSend response:', typeof data === 'string' ? data : JSON.stringify(data));
    
    // Extract message ID from response
    const messageId = data?.body?.message_id || null;
    
    res.json({ success: true, data: { id: messageId } });
  } catch (error) {
    console.error('Email sending failed:', error && error.stack ? error.stack : error);
    // Return error info safely
    res.status(500).json({ success: false, error: (error && error.message) || String(error) });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Email server running at http://localhost:${port}`);
  console.log(`Server is listening on all network interfaces`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
  process.exit(1);
});
