export default function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const keyConfigured = !!GEMINI_API_KEY && !GEMINI_API_KEY.includes('YOUR_KEY_HERE');

  res.status(200).json({
    status: 'ok',
    api_key_configured: keyConfigured,
    version: '1.0.0',
    provider: 'gemini',
    environment: 'vercel'
  });
}
