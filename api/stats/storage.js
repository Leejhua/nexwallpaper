// 统一数据存储模块
import { promises as fs } from 'fs';
import path from 'path';

// 存储配置
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'file';
const DATA_DIR = process.env.DATA_DIR || '/tmp';
const STATS_FILE = path.join(DATA_DIR, 'labubu-stats.json');

// 文件存储实现
class FileStorage {
  async ensureFile() {
    try {
      await fs.access(STATS_FILE);
    } catch {
      await fs.writeFile(STATS_FILE, JSON.stringify({
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        },
        stats: {}
      }, null, 2));
    }
  }

  async read() {
    try {
      await this.ensureFile();
      const data = await fs.readFile(STATS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.stats || {};
    } catch (error) {
      console.error('File storage read error:', error);
      return {};
    }
  }

  async write(stats) {
    try {
      const data = {
        metadata: {
          created: await this.getCreationTime(),
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
          totalRecords: Object.keys(stats).length
        },
        stats
      };
      await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('File storage write error:', error);
      return false;
    }
  }

  async getCreationTime() {
    try {
      const data = await fs.readFile(STATS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.metadata?.created || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}

// 内存存储实现（用于开发测试）
class MemoryStorage {
  constructor() {
    this.data = {};
  }

  async read() {
    return { ...this.data };
  }

  async write(stats) {
    this.data = { ...stats };
    return true;
  }
}

// 存储工厂
function createStorage() {
  switch (STORAGE_TYPE) {
    case 'memory':
      return new MemoryStorage();
    case 'file':
    default:
      return new FileStorage();
  }
}

// 单例存储实例
const storage = createStorage();

export { storage };
export default storage; 