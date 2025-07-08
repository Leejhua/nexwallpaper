// 统计API服务
// 兼容不同的环境变量获取方式
const getApiUrl = () => {
  // 开发环境检测：检查URL是否包含开发服务器端口
  if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.') ||
                         window.location.port === '3000';
    
    if (isDevelopment) {
      // 开发环境使用独立API服务器
      const host = window.location.hostname;
      return `http://${host}:3001/api`;
    } else {
      // 生产环境，使用相对路径
      return `${window.location.origin}/api`;
    }
  }
  
  // Vite环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_STATS_API_URL;
  }
  // Create React App环境变量 (备用)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_STATS_API_URL;
  }
  // 默认值
  return null;
};

const API_BASE_URL = getApiUrl() || '/api';

class StatsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // 健康检查
  async healthCheck() {
    return this.request('/health');
  }

  // 获取单个壁纸统计
  async getStats(wallpaperId) {
    return this.request(`/stats/${wallpaperId}`);
  }

  // 批量获取壁纸统计
  async getBatchStats(wallpaperIds) {
    return this.request('/stats/batch', {
      method: 'POST',
      body: JSON.stringify({ wallpaperIds }),
    });
  }

  // 记录用户操作
  async recordAction(wallpaperId, action) {
    return this.request('/stats/record', {
      method: 'POST',
      body: JSON.stringify({ wallpaperId, action }),
    });
  }

  // 获取热门壁纸
  async getPopular(limit = 10) {
    return this.request(`/popular?limit=${limit}`);
  }

  // 批量记录操作（用于离线同步）
  async batchRecordActions(actions) {
    const promises = actions.map(({ wallpaperId, action }) => 
      this.recordAction(wallpaperId, action).catch(error => ({
        wallpaperId,
        action,
        error: error.message
      }))
    );
    
    return Promise.allSettled(promises);
  }
}

// 创建单例实例
const statsAPI = new StatsAPI();

export default statsAPI;
