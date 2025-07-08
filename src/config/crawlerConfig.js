/**
 * 爬虫配置文件
 * 包含反爬虫机制和目标站点配置
 */

export const crawlerConfig = {
  // 目标网站配置
  targets: {
    labubuwallpaper: {
      baseUrl: 'https://labubuwallpaper.com',
      pages: [
        '/zh-CN/labubu-iphone-wallpaper-4k',
        '/zh-CN/labubu-wallpaper-4k', 
        '/zh-CN/labubu-wallpaper-pc',
        '/zh-CN/labubu-computer-wallpaper',
        '/zh-CN/labubu-flashlight-live-wallpaper'
      ],
      selectors: {
        images: 'img[src*="labubuwallpaper.com"]',
        links: 'a[href*="jpg"], a[href*="png"], a[href*="mp4"]',
        containers: '.gallery-item, .wallpaper-item, [class*="image"], [class*="wallpaper"]'
      }
    }
  },

  // 反爬虫绕过策略
  antiBot: {
    // 用户代理轮换
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],

    // 请求间隔配置（毫秒）
    delays: {
      min: 2000,    // 最小延迟
      max: 5000,    // 最大延迟  
      between: 1500 // 页面间延迟
    },

    // 请求头配置
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1'
    },

    // 代理配置（可选）
    proxies: {
      enabled: false,
      list: []
    },

    // 重试策略
    retry: {
      maxAttempts: 3,
      backoffDelay: 2000, // 重试延迟倍数
      timeoutMs: 30000    // 请求超时
    }
  },

  // URL验证配置
  validation: {
    timeout: 10000,
    batchSize: 5,           // 并发验证数量
    validStatusCodes: [200, 206], // 有效状态码
    checkInterval: 24 * 60 * 60 * 1000 // 24小时检查一次
  },

  // 数据处理配置
  processing: {
    // 支持的图片格式
    imageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    // 支持的视频格式  
    videoFormats: ['mp4', 'mov', 'webm'],
    // URL清理规则
    urlCleanup: {
      removeParams: ['utm_source', 'utm_medium', 'utm_campaign'],
      normalizeEncoding: true
    },
    // 重复检测
    deduplication: {
      enabled: true,
      compareFields: ['url', 'title']
    }
  },

  // 调度配置
  scheduling: {
    // 爬取新内容间隔（毫秒）
    crawlInterval: 12 * 60 * 60 * 1000,  // 12小时
    // URL清理间隔（毫秒）
    cleanupInterval: 6 * 60 * 60 * 1000, // 6小时
    // 工作时间限制（避免高峰期）
    workingHours: {
      start: 9,  // 上午9点开始
      end: 22    // 晚上10点结束
    }
  },

  // 日志配置
  logging: {
    level: 'info', // debug, info, warn, error
    maxLogFiles: 7,
    logRotation: true
  }
};

// 获取随机用户代理
export const getRandomUserAgent = () => {
  const agents = crawlerConfig.antiBot.userAgents;
  return agents[Math.floor(Math.random() * agents.length)];
};

// 获取随机延迟
export const getRandomDelay = () => {
  const { min, max } = crawlerConfig.antiBot.delays;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 生成随机请求头
export const generateHeaders = (referer = null) => {
  const headers = {
    ...crawlerConfig.antiBot.headers,
    'User-Agent': getRandomUserAgent()
  };
  
  if (referer) {
    headers['Referer'] = referer;
  }
  
  return headers;
}; 