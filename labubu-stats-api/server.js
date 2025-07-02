const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

// 初始化数据库
const db = new Database();

// 中间件
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: 'Too many requests from this IP'
});
app.use(limiter);

// 操作限流（防刷）
const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 每分钟最多60次操作
  message: 'Too many actions, please slow down'
});

// 获取客户端IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 获取单个壁纸统计
app.get('/api/stats/:wallpaperId', async (req, res) => {
  try {
    const { wallpaperId } = req.params;
    const stats = await db.getStats(wallpaperId);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// 批量获取壁纸统计
app.post('/api/stats/batch', async (req, res) => {
  try {
    const { wallpaperIds } = req.body;
    
    if (!Array.isArray(wallpaperIds)) {
      return res.status(400).json({
        success: false,
        error: 'wallpaperIds must be an array'
      });
    }

    if (wallpaperIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Too many IDs, maximum 100 allowed'
      });
    }

    const stats = await db.getBatchStats(wallpaperIds);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting batch stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch statistics'
    });
  }
});

// 记录用户操作
app.post('/api/stats/:wallpaperId/action', actionLimiter, async (req, res) => {
  try {
    const { wallpaperId } = req.params;
    const { action } = req.body;
    
    if (!action || !['view', 'like', 'unlike', 'download'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type'
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];
    
    const result = await db.recordAction(wallpaperId, action, ipAddress, userAgent);
    
    // 返回更新后的统计数据
    const updatedStats = await db.getStats(wallpaperId);
    
    res.json({
      success: true,
      data: updatedStats,
      actionId: result.actionId
    });
  } catch (error) {
    console.error('Error recording action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record action'
    });
  }
});

// 获取热门壁纸
app.get('/api/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const popular = await db.getPopularWallpapers(Math.min(limit, 50));
    res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    console.error('Error getting popular wallpapers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular wallpapers'
    });
  }
});

// 获取统计概览
app.get('/api/overview', async (req, res) => {
  try {
    // 这里可以添加总体统计逻辑
    res.json({
      success: true,
      data: {
        message: 'Statistics overview endpoint - to be implemented'
      }
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get overview'
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Labubu Stats API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});
