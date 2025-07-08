// 开发环境API服务器 - 模拟Vercel函数
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;

// 数据存储
const DATA_FILE = './dev-stats.json';

// 中间件
app.use(cors());
app.use(express.json());

// 确保数据文件存在
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0'
      },
      stats: {}
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// 读取数据
async function readData() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.stats || {};
  } catch (error) {
    console.error('Read data error:', error);
    return {};
  }
}

// 写入数据
async function writeData(stats) {
  try {
    const data = {
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        totalRecords: Object.keys(stats).length
      },
      stats
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Write data error:', error);
    return false;
  }
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Labubu Gallery API is healthy (DEV)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 记录统计
app.post('/api/stats/record', async (req, res) => {
  try {
    const { wallpaperId, action } = req.body;

    if (!wallpaperId || !action) {
      return res.status(400).json({ error: 'Missing wallpaperId or action' });
    }

    const stats = await readData();
    
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

    const saved = await writeData(stats);
    
    if (!saved) {
      return res.status(500).json({ error: 'Failed to save stats' });
    }

    res.json({
      success: true,
      data: stats[wallpaperId]
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 批量获取统计
app.post('/api/stats/batch', async (req, res) => {
  try {
    const { wallpaperIds } = req.body;

    if (!wallpaperIds || !Array.isArray(wallpaperIds)) {
      return res.status(400).json({ error: 'Invalid wallpaperIds array' });
    }

    const allStats = await readData();
    const requestedStats = {};
    
    wallpaperIds.forEach(id => {
      if (allStats[id]) {
        requestedStats[id] = allStats[id];
      } else {
        requestedStats[id] = {
          view_count: 0,
          like_count: 0,
          download_count: 0,
          last_updated: new Date().toISOString()
        };
      }
    });

    res.json({
      success: true,
      data: requestedStats
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 开发API服务器运行在: http://localhost:${PORT}`);
  console.log(`📊 数据文件: ${path.resolve(DATA_FILE)}`);
}); 