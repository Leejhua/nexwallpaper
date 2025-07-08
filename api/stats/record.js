// Vercel Serverless Function - 记录统计数据
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
    const { wallpaperId, action } = req.body;

    if (!wallpaperId || !action) {
      return res.status(400).json({ error: 'Missing wallpaperId or action' });
    }

    // 读取现有统计数据
    const stats = await storage.read();
    
    // 初始化wallpaper统计
    if (!stats[wallpaperId]) {
      stats[wallpaperId] = {
        view_count: 0,
        like_count: 0,
        download_count: 0,
        created: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
    }

    // 更新统计数据
    switch (action) {
      case 'view':
        stats[wallpaperId].view_count += 1;
        break;
      case 'like':
        stats[wallpaperId].like_count += 1;
        break;
      case 'unlike':
        stats[wallpaperId].like_count = Math.max(0, stats[wallpaperId].like_count - 1);
        break;
      case 'download':
        stats[wallpaperId].download_count += 1;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    stats[wallpaperId].last_updated = new Date().toISOString();

    // 保存统计数据
    const saved = await storage.write(stats);
    
    if (!saved) {
      return res.status(500).json({ error: 'Failed to save stats' });
    }

    res.status(200).json({
      success: true,
      data: stats[wallpaperId]
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 