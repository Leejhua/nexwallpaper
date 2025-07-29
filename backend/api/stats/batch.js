// Vercel Serverless Function - 批量获取统计数据
import storage from './storage.js';

export default async function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallpaperIds } = req.body;

    if (!wallpaperIds || !Array.isArray(wallpaperIds)) {
      return res.status(400).json({ error: 'Invalid wallpaperIds array' });
    }

    // 读取所有统计数据
    const allStats = await storage.read();
    
    // 筛选请求的wallpaper数据
    const requestedStats = {};
    wallpaperIds.forEach(id => {
      if (allStats[id]) {
        requestedStats[id] = allStats[id];
      } else {
        // 如果没有数据，返回默认值
        requestedStats[id] = {
          view_count: 0,
          like_count: 0,
          download_count: 0,
          last_updated: new Date().toISOString()
        };
      }
    });

    res.status(200).json({
      success: true,
      data: requestedStats
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 