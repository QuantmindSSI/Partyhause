import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3001;

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors({
  origin: 'http://localhost:5173' // Your Vite app's URL
}));
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📨 [server] /api/send-email called from', req.headers.origin || req.ip);
    console.log('📨 [server] request body:', JSON.stringify(req.body));
    console.log('📨 [server] env RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
    console.log('📨 [server] env RESEND_FROM_EMAIL present:', !!process.env.RESEND_FROM_EMAIL);
    const { to, subject, html } = req.body;
    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL must be set to a verified sending address');
      return res.status(500).json({ success: false, error: 'Server configuration error: RESEND_FROM_EMAIL not set' });
    }

    // Determine 'from' header. Allow override from request only when explicitly enabled via env.
    let fromHeader;
    if (req.body && req.body.from && process.env.ALLOW_FROM_OVERRIDE === 'true') {
      fromHeader = req.body.from;
      console.log('📨 [server] Using overridden from header from request:', fromHeader);
      } else {
        fromHeader = `PartyHause <${process.env.RESEND_FROM_EMAIL}>`;
        console.log('📨 [server] Using configured from header: PartyHause <' + String(process.env.RESEND_FROM_EMAIL) + '>');
      }

    const data = await resend.emails.send({
      from: fromHeader,
      to,
      subject,
      html,
    });
    console.log('📨 [server] Resend response:', JSON.stringify(data));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Email sending failed:', error && error.stack ? error.stack : error);
    // Return error info safely
    res.status(500).json({ success: false, error: (error && error.message) || String(error) });
  }
});

app.listen(port, () => {
  console.log(`Email server running at http://localhost:${port}`);
});
