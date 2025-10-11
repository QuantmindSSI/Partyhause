export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: SendEmailPayload) => {
  try {
    const res = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
  // ...removed bloatware error log...
    return { success: false, error };
  }
};

export default sendEmail;
