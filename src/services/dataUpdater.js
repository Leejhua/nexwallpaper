/**
 * 数据更新服务
 * 将爬取的新数据合并到现有的gallery数据中
 */

import { crawlerConfig } from '../config/crawlerConfig.js';
import { promises as fs } from 'fs';
import path from 'path';

export class DataUpdater {
  constructor() {
    this.config = crawlerConfig.processing;
    this.galleryDataPath = 'src/data/galleryData.js';
    this.backupDir = 'backups';
  }

  /**
   * 更新gallery数据
   */
  async updateGalleryData(newResources, existingData = null) {
    console.log('📝 开始更新gallery数据...');
    
    try {
      // 如果没有提供现有数据，从文件读取
      let currentData = existingData;
      if (!currentData) {
        currentData = await this.loadCurrentGalleryData();
      }

      // 创建备份
      await this.createBackup(currentData);

      // 数据去重和合并
      const mergedData = await this.mergeData(currentData, newResources);

      // 验证合并后的数据
      const validationResult = this.validateMergedData(mergedData);
      if (!validationResult.isValid) {
        throw new Error(`数据验证失败: ${validationResult.errors.join(', ')}`);
      }

      // 生成新的数据文件
      await this.generateNewDataFile(mergedData);

      console.log('✅ 数据更新完成');
      return {
        success: true,
        stats: this.getMergeStats(currentData, newResources, mergedData),
        validationResult
      };

    } catch (error) {
      console.error('❌ 数据更新失败:', error.message);
      throw error;
    }
  }

  /**
   * 加载当前的gallery数据
   */
  async loadCurrentGalleryData() {
    try {
      // 读取现有数据文件
      const fileContent = await fs.readFile(this.galleryDataPath, 'utf8');
      
      // 提取数据数组（简单的正则方式）
      const dataMatch = fileContent.match(/export const galleryData = (\[[\s\S]*?\]);/);
      if (!dataMatch) {
        throw new Error('无法解析现有的gallery数据');
      }

      const dataString = dataMatch[1];
      const galleryData = JSON.parse(dataString);
      
      console.log(`📊 加载了 ${galleryData.length} 个现有项目`);
      return galleryData;

    } catch (error) {
      console.error('❌ 加载现有数据失败:', error.message);
      // 如果文件不存在或损坏，返回空数组
      return [];
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup(currentData) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `galleryData-backup-${timestamp}.json`);
      
      // 创建备份目录
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // 写入备份文件
      await fs.writeFile(backupPath, JSON.stringify(currentData, null, 2));
      
      console.log(`💾 数据备份已创建: ${backupPath}`);
    } catch (error) {
      console.warn('⚠️ 创建备份失败:', error.message);
    }
  }

  /**
   * 合并新旧数据
   */
  async mergeData(currentData, newResources) {
    console.log(`🔄 开始合并数据: ${currentData.length} 现有 + ${newResources.length} 新增`);
    
    // 创建URL索引以便快速查找重复项
    const existingUrls = new Set();
    const existingTitles = new Set();
    
    currentData.forEach(item => {
      if (item.url) {
        existingUrls.add(this.normalizeUrl(item.url));
      }
      if (item.title) {
        existingTitles.add(this.normalizeTitle(item.title));
      }
    });

    // 过滤和处理新资源
    const filteredNewResources = [];
    let duplicatesSkipped = 0;
    let invalidSkipped = 0;

    for (const resource of newResources) {
      // 跳过无效资源
      if (!this.isValidResource(resource)) {
        invalidSkipped++;
        continue;
      }

      // 检查URL重复
      const normalizedUrl = this.normalizeUrl(resource.url);
      if (existingUrls.has(normalizedUrl)) {
        duplicatesSkipped++;
        continue;
      }

      // 检查标题重复（相似度检查）
      const normalizedTitle = this.normalizeTitle(resource.title);
      if (this.hasSimilarTitle(normalizedTitle, existingTitles)) {
        duplicatesSkipped++;
        continue;
      }

      // 清理和规范化资源数据
      const cleanedResource = this.cleanResourceData(resource);
      
      filteredNewResources.push(cleanedResource);
      existingUrls.add(normalizedUrl);
      existingTitles.add(normalizedTitle);
    }

    // 分配新的ID
    const maxId = currentData.length > 0 ? Math.max(...currentData.map(item => item.id || 0)) : 0;
    filteredNewResources.forEach((resource, index) => {
      resource.id = maxId + index + 1;
    });

    // 合并数据
    const mergedData = [...currentData, ...filteredNewResources];

    console.log(`✅ 合并完成: 新增 ${filteredNewResources.length} 个, 跳过重复 ${duplicatesSkipped} 个, 跳过无效 ${invalidSkipped} 个`);
    
    return mergedData;
  }

  /**
   * 规范化URL用于比较
   */
  normalizeUrl(url) {
    if (!url) return '';
    
    let normalized = url.toLowerCase().trim();
    
    // 移除配置中指定的参数
    if (this.config.urlCleanup.removeParams) {
      const urlObj = new URL(normalized);
      this.config.urlCleanup.removeParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      normalized = urlObj.toString();
    }

    // 标准化编码
    if (this.config.urlCleanup.normalizeEncoding) {
      try {
        normalized = decodeURIComponent(normalized);
      } catch (e) {
        // 如果解码失败，保持原样
      }
    }

    return normalized;
  }

  /**
   * 规范化标题用于比较
   */
  normalizeTitle(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留字母、数字、空格和中文
      .replace(/\s+/g, ' ');
  }

  /**
   * 检查是否有相似标题
   */
  hasSimilarTitle(normalizedTitle, existingTitles) {
    for (const existingTitle of existingTitles) {
      if (this.calculateSimilarity(normalizedTitle, existingTitle) > 0.8) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算字符串相似度
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 验证资源数据有效性
   */
  isValidResource(resource) {
    if (!resource) return false;
    if (!resource.url || typeof resource.url !== 'string') return false;
    if (!resource.title || typeof resource.title !== 'string') return false;
    if (!resource.type || !['image', 'video'].includes(resource.type)) return false;
    
    try {
      new URL(resource.url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理和规范化资源数据
   */
  cleanResourceData(resource) {
    const cleaned = { ...resource };
    
    // 清理URL
    if (cleaned.url) {
      cleaned.url = cleaned.url.trim();
    }

    // 清理标题
    if (cleaned.title) {
      cleaned.title = cleaned.title.trim();
    }

    // 确保必要字段存在
    if (!cleaned.tags || !Array.isArray(cleaned.tags)) {
      cleaned.tags = ['Labubu', '高清壁纸', '精美设计'];
    }

    if (!cleaned.backupUrls || !Array.isArray(cleaned.backupUrls)) {
      cleaned.backupUrls = [];
    }

    // 移除crawlTime字段（这是临时字段）
    delete cleaned.crawlTime;

    return cleaned;
  }

  /**
   * 验证合并后的数据
   */
  validateMergedData(mergedData) {
    const errors = [];
    const warnings = [];

    // 检查基本结构
    if (!Array.isArray(mergedData)) {
      errors.push('合并后的数据不是数组');
      return { isValid: false, errors, warnings };
    }

    // 检查ID唯一性
    const ids = new Set();
    const duplicateIds = [];
    
    mergedData.forEach((item, index) => {
      if (!item.id) {
        errors.push(`项目 ${index} 缺少ID`);
      } else if (ids.has(item.id)) {
        duplicateIds.push(item.id);
      } else {
        ids.add(item.id);
      }
    });

    if (duplicateIds.length > 0) {
      errors.push(`发现重复ID: ${duplicateIds.join(', ')}`);
    }

    // 检查必要字段
    mergedData.forEach((item, index) => {
      if (!item.url) {
        errors.push(`项目 ${index} 缺少URL`);
      }
      if (!item.title) {
        errors.push(`项目 ${index} 缺少标题`);
      }
      if (!item.type || !['image', 'video'].includes(item.type)) {
        errors.push(`项目 ${index} 类型无效`);
      }
    });

    // 检查数据量变化
    if (mergedData.length === 0) {
      warnings.push('合并后数据为空');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalItems: mergedData.length,
      uniqueIds: ids.size
    };
  }

  /**
   * 生成新的数据文件
   */
  async generateNewDataFile(mergedData) {
    console.log('📝 生成新的数据文件...');
    
    // 统计信息
    const imageCount = mergedData.filter(item => item.type === 'image').length;
    const videoCount = mergedData.filter(item => item.type === 'video').length;
    
    const categoryStats = {};
    mergedData.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    // 生成文件内容
    const fileContent = `// 高清Labubu壁纸数据 - React版本 (自动更新)
// 更新时间: ${new Date().toLocaleString('zh-CN')}
// 图片数量: ${imageCount}张
// 视频数量: ${videoCount}个
// 总计: ${mergedData.length}个项目

export const galleryData = ${JSON.stringify(mergedData, null, 2)};

// 分类配置
export const categories = [
  {
    "key": "all",
    "label": "全部作品",
    "icon": "FolderOpen",
    "count": ${mergedData.length}
  },
  {
    "key": "fantasy",
    "label": "奇幻世界",
    "icon": "Sparkles",
    "count": ${categoryStats.fantasy || 0}
  },
  {
    "key": "desktop",
    "label": "桌面壁纸",
    "icon": "Monitor",
    "count": ${categoryStats.desktop || 0}
  },
  {
    "key": "mobile",
    "label": "手机壁纸",
    "icon": "Smartphone",
    "count": ${categoryStats.mobile || 0}
  },
  {
    "key": "seasonal",
    "label": "季节主题",
    "icon": "Flower2",
    "count": ${categoryStats.seasonal || 0}
  },
  {
    "key": "4k",
    "label": "4K超清",
    "icon": "Video",
    "count": ${categoryStats['4k'] || 0}
  },
  {
    "key": "dynamic",
    "label": "动态壁纸",
    "icon": "Play",
    "count": ${categoryStats.dynamic || 0}
  },
  {
    "key": "holiday",
    "label": "节日主题",
    "icon": "Sparkles",
    "count": ${categoryStats.holiday || 0}
  }
];

// 导出统计信息
export const stats = {
  "totalItems": ${mergedData.length},
  "images": ${imageCount},
  "videos": ${videoCount},
  "categories": ${JSON.stringify(categoryStats, null, 2)},
  "sources": {
    "com": ${mergedData.filter(item => item.source === 'com').length}
  },
  "lastUpdate": "${new Date().toLocaleString('zh-CN')}"
};`;

    // 写入文件
    await fs.writeFile(this.galleryDataPath, fileContent, 'utf8');
    
    console.log(`✅ 新数据文件已生成: ${this.galleryDataPath}`);
    console.log(`📊 统计: ${mergedData.length} 个项目 (图片: ${imageCount}, 视频: ${videoCount})`);
  }

  /**
   * 获取合并统计信息
   */
  getMergeStats(currentData, newResources, mergedData) {
    return {
      before: {
        total: currentData.length,
        images: currentData.filter(item => item.type === 'image').length,
        videos: currentData.filter(item => item.type === 'video').length
      },
      added: {
        total: newResources.length,
        images: newResources.filter(item => item.type === 'image').length,
        videos: newResources.filter(item => item.type === 'video').length
      },
      after: {
        total: mergedData.length,
        images: mergedData.filter(item => item.type === 'image').length,
        videos: mergedData.filter(item => item.type === 'video').length
      },
      actuallyAdded: mergedData.length - currentData.length
    };
  }

  /**
   * 清理旧备份文件
   */
  async cleanupOldBackups(maxBackups = 10) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('galleryData-backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.stat(path.join(this.backupDir, file)).then(stats => stats.mtime)
        }));

      if (backupFiles.length > maxBackups) {
        // 按时间排序并删除旧文件
        const sortedFiles = await Promise.all(
          backupFiles.map(async file => ({
            ...file,
            time: await file.time
          }))
        );

        sortedFiles.sort((a, b) => b.time - a.time);
        
        for (let i = maxBackups; i < sortedFiles.length; i++) {
          await fs.unlink(sortedFiles[i].path);
          console.log(`🗑️ 删除旧备份: ${sortedFiles[i].name}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 清理备份文件失败:', error.message);
    }
  }
}

// 导出单例实例
export const dataUpdater = new DataUpdater(); 