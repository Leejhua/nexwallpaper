// Vercel Serverless Function - 健康检查
export default async function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.status(200).json({
      success: true,
      message: 'Labubu Gallery API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 