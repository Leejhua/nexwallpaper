/**
 * 简化版首页卡片图片工具 - 统一快速策略
 */
import { getImageUrlTemplate } from './loadingConfig';

/**
 * 清理和标准化URL路径 - 简化版
 */
const cleanAndExtractPath = (url) => {
  if (!url) return '';
  
  try {
    let imagePath = '';
    
    if (url.includes('cdn-cgi/image/')) {
      // 从CDN URL提取路径
      const match = url.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (match) {
        imagePath = match[1];
      }
    } else {
      // 直接URL
      imagePath = url.replace('https://labubuwallpaper.com/', '').replace(/^\/+/, '');
    }
    
    return imagePath;
    
  } catch (error) {
    console.warn('URL路径提取失败:', error);
    return '';
  }
};

/**
 * 🚀 快速生成缩略图URL - 统一策略
 */
export const getOptimizedThumbnailUrl = (originalUrl, quality = 'thumbnail') => {
  if (!originalUrl || !originalUrl.includes('labubuwallpaper.com')) {
    return originalUrl;
  }
  
  try {
    const imagePath = cleanAndExtractPath(originalUrl);
    
    if (!imagePath) {
      return originalUrl;
    }
    
    // 🎯 使用统一的URL模板
    const template = getImageUrlTemplate(quality);
    return `https://labubuwallpaper.com/cdn-cgi/image/${template}/${imagePath}`;
    
  } catch (error) {
    console.warn('生成缩略图URL失败:', error);
    return originalUrl;
  }
};

/**
 * 📸 获取预览URL - 简化版
 */
export const getOptimizedPreviewUrl = (item) => {
  if (!item?.url) return '';
  
  // 优先使用标准质量
  const previewUrl = getOptimizedThumbnailUrl(item.url, 'standard');
  
  // 如果生成失败，尝试第一个备用URL
  if (previewUrl === item.url && item.backupUrls?.length > 0) {
    return getOptimizedThumbnailUrl(item.backupUrls[0], 'standard');
  }
  
  return previewUrl;
};

/**
 * 🔄 生成简化的备用URL列表 - 3级降级策略
 */
export const getOptimizedBackupUrls = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('labubuwallpaper.com')) {
    return [];
  }
  
  try {
    const imagePath = cleanAndExtractPath(originalUrl);
    
    if (!imagePath) return [];
    
    // 🎯 简化的3级降级策略
    const backupUrls = [
      // 1. 缩略图质量（最保守，最可能成功）
      `https://labubuwallpaper.com/cdn-cgi/image/${getImageUrlTemplate('thumbnail')}/${imagePath}`,
      
      // 2. 标准质量
      `https://labubuwallpaper.com/cdn-cgi/image/${getImageUrlTemplate('standard')}/${imagePath}`,
      
      // 3. 原始URL（最后降级选项）
      `https://labubuwallpaper.com/${imagePath}`
    ];
    
    // 移除重复的URL
    return [...new Set(backupUrls)];
    
  } catch (error) {
    console.warn('生成备用URL失败:', error);
    return [];
  }
};

/**
 * 🌟 获取高质量URL - 用于用户停留时的画质升级
 */
export const getHighQualityUrl = (originalUrl) => {
  return getOptimizedThumbnailUrl(originalUrl, 'high');
};

/**
 * 📊 获取不同质量的URL集合 - 用于渐进加载
 */
export const getProgressiveUrls = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('labubuwallpaper.com')) {
    return { thumbnail: originalUrl, standard: originalUrl, high: originalUrl };
  }
  
  return {
    thumbnail: getOptimizedThumbnailUrl(originalUrl, 'thumbnail'),  // 首屏快速显示
    standard: getOptimizedThumbnailUrl(originalUrl, 'standard'),    // 正常浏览
    high: getOptimizedThumbnailUrl(originalUrl, 'high')             // 用户停留时升级
  };
}; 