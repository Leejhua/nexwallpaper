/**
 * 图片工具函数
 */

/**
 * 生成缩略图URL
 * 将高清图片URL转换为缩略图URL
 */
export const getThumbnailUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  // 对于labubuwallpaper.com的图片进行优化
  if (originalUrl.includes('labubuwallpaper.com')) {
    // 如果URL已经包含CDN缩略图参数，直接返回
    if (originalUrl.includes('cdn-cgi/image/') && originalUrl.includes('width=')) {
      return originalUrl;
    }
    
    // 对于没有CDN参数的图片，添加缩略图优化
    // 适用于直接图片URL（如：https://labubuwallpaper.com/image.jpg）
    if (originalUrl.match(/\.(jpg|jpeg|png|webp)$/i)) {
      const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
      const params = 'width=400,height=600,fit=cover,quality=85,format=auto';
      const imagePath = originalUrl.replace('https://labubuwallpaper.com/', '');
      return `${baseUrl}${params}/${imagePath}`;
    }
  }
  
  // 对于labubuwallpaper.xyz的图片（保留原有逻辑以防万一）
  if (originalUrl.includes('res.labubuwallpaper.xyz')) {
    // 使用Cloudinary的缩略图参数 - c_fit保持完整图片无裁切
    return originalUrl.replace(
      '/image/upload/',
      '/image/upload/c_fit,w_400,q_auto:low/'
    );
  }
  
  // 对于其他图片，保持原URL
  return originalUrl;
};

/**
 * 获取高清图片URL（用于详情页）
 * 如果是缩略图URL，转换为高清版本
 */
export const getHighResUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  // 对于已经优化的CDN URL，提供更高质量版本
  if (originalUrl.includes('labubuwallpaper.com/cdn-cgi/image/')) {
    // 提取图片路径
    const imagePath = originalUrl.split('/cdn-cgi/image/')[1];
    if (imagePath && imagePath.includes('/')) {
      const actualPath = imagePath.substring(imagePath.indexOf('/') + 1);
      // 返回高质量版本或原始图片
      const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
      const highQualityParams = 'width=1200,height=1800,fit=cover,quality=95,format=auto';
      return `${baseUrl}${highQualityParams}/${actualPath}`;
    }
  }
  
  return originalUrl; // 详情页使用原始高清URL
};

/**
 * 检查URL是否可用，提供备用URL机制
 */
export const getWorkingUrl = (item) => {
  if (!item) return null;
  
  // 主URL
  const mainUrl = item.url;
  
  // 备用URL列表
  const backupUrls = item.backupUrls || [];
  
  // 返回URL列表，按优先级排序
  return {
    primary: mainUrl,
    fallbacks: backupUrls,
    all: [mainUrl, ...backupUrls]
  };
};

/**
 * 尝试获取可工作的图片URL
 * 带有错误重试机制
 */
export const getThumbnailUrlWithFallback = (item) => {
  const urls = getWorkingUrl(item);
  
  // 优先使用主URL的缩略图版本
  const primaryThumbnail = getThumbnailUrl(urls.primary);
  
  // 备用缩略图URL列表
  const fallbackThumbnails = urls.fallbacks.map(url => getThumbnailUrl(url));
  
  // 添加原始URL作为最后的备用选项（针对CDN失败的情况）
  const originalUrls = [urls.primary, ...urls.fallbacks];
  
  // 构建完整的备用URL列表
  const allThumbnails = [primaryThumbnail, ...fallbackThumbnails];
  const allUrls = [...allThumbnails, ...originalUrls];
  
  // 去重
  const uniqueUrls = [...new Set(allUrls)];
  
  return {
    primary: primaryThumbnail,
    fallbacks: fallbackThumbnails,
    all: uniqueUrls
  };
};

/**
 * 检查URL是否看起来有效
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 生成备用CDN URL
 * 如果主CDN失败，尝试不同的参数和编码处理
 */
export const generateFallbackUrls = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('labubuwallpaper.com')) {
    return [originalUrl];
  }

  const fallbacks = [originalUrl];
  
  // 如果是CDN URL，生成不同质量的版本
  if (originalUrl.includes('cdn-cgi/image/')) {
    // 提取原始图片路径
    const imagePath = originalUrl.split('/cdn-cgi/image/')[1];
    if (imagePath && imagePath.includes('/')) {
      const actualPath = imagePath.substring(imagePath.indexOf('/') + 1);
      const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
      
      // 添加不同质量的备用版本 - 针对URL编码问题优化
      const qualityVariants = [
        'width=400,height=600,fit=cover,quality=80,format=auto',
        'width=300,height=450,fit=cover,quality=70,format=auto', 
        'width=400,height=600,fit=cover,quality=85,format=jpeg', // 强制JPEG格式
        'width=300,height=450,fit=cover,quality=75,format=webp', // 尝试WebP格式
        'width=200,height=300,fit=cover,quality=60,format=auto'
      ];
      
      qualityVariants.forEach(params => {
        fallbacks.push(`${baseUrl}${params}/${actualPath}`);
      });
      
      // 尝试解码URL编码的版本
      try {
        const decodedPath = decodeURIComponent(actualPath);
        if (decodedPath !== actualPath) {
          fallbacks.push(`https://labubuwallpaper.com/${decodedPath}`);
          fallbacks.push(`${baseUrl}width=400,height=600,fit=cover,quality=85,format=auto/${decodedPath}`);
        }
      } catch (e) {
        // 解码失败，忽略
      }
      
      // 最后添加原始图片
      fallbacks.push(`https://labubuwallpaper.com/${actualPath}`);
    }
  } else {
    // 对于非CDN URL，添加CDN优化版本
    const fileName = originalUrl.split('/').pop();
    if (fileName) {
      const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
      
      // 为原始URL添加CDN优化版本
      const cdnVariants = [
        'width=400,height=600,fit=cover,quality=85,format=auto',
        'width=300,height=450,fit=cover,quality=75,format=jpeg',
        'width=400,height=600,fit=cover,quality=80,format=webp'
      ];
      
      cdnVariants.forEach(params => {
        fallbacks.push(`${baseUrl}${params}/${fileName}`);
      });
    }
  }
  
  return [...new Set(fallbacks)]; // 去重
};
