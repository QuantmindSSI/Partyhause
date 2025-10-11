// Simple JS API function for testing
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return success response
  return res.status(200).json({
    success: true,
    message: 'PartyHaus API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV || 'development',
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    nodeVersion: process.version
  });
};