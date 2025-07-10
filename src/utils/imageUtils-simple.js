/**
 * 简化版图片工具 - 用于调试缩略图问题
 */

/**
 * 简单的缩略图URL生成 - 去除复杂逻辑
 */
export const getSimpleThumbnailUrl = (originalUrl) => {
  if (!originalUrl) {
    console.warn('❌ URL为空');
    return originalUrl;
  }
  
  try {
    // 对于非labubuwallpaper.com的图片，直接返回原URL
    if (!originalUrl.includes('labubuwallpaper.com')) {
      return originalUrl;
    }
    
    // 简化的路径提取
    let imagePath = '';
    
    if (originalUrl.includes('cdn-cgi/image/')) {
      // 从CDN URL提取路径 - 简化版
      const parts = originalUrl.split('/');
      const imageIndex = parts.findIndex(part => part.includes('format='));
      if (imageIndex >= 0 && imageIndex + 1 < parts.length) {
        imagePath = parts.slice(imageIndex + 1).join('/');
      } else {
        // 备用方法
        const match = originalUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
        if (match) {
          imagePath = match[1];
        }
      }
    } else {
      // 直接URL - 简化版
      imagePath = originalUrl.replace('https://labubuwallpaper.com/', '').replace(/^\/+/, '');
    }
    
    if (!imagePath) {
      console.warn('⚠️ 无法提取图片路径，返回原URL:', originalUrl);
      return originalUrl;
    }
    
    // 生成简单的缩略图URL
    const thumbnailParams = 'width=350,height=525,fit=cover,quality=80,format=auto';
    const thumbnailUrl = `https://labubuwallpaper.com/cdn-cgi/image/${thumbnailParams}/${imagePath}`;
    
    return thumbnailUrl;
    
  } catch (error) {
    console.error('❌ 生成缩略图URL失败:', error);
    return originalUrl;
  }
};

/**
 * 简单的预览URL获取
 */
export const getSimplePreviewUrl = (item) => {
  if (!item || !item.url) {
    console.warn('❌ item或item.url为空');
    return '';
  }
  
  // 优先尝试主URL的缩略图
  const thumbnailUrl = getSimpleThumbnailUrl(item.url);
  
  // 如果缩略图URL和原URL相同，尝试第一个备用URL
  if (thumbnailUrl === item.url && item.backupUrls && item.backupUrls.length > 0) {
    const backupThumbnail = getSimpleThumbnailUrl(item.backupUrls[0]);
    if (backupThumbnail !== item.backupUrls[0]) {
      return backupThumbnail;
    }
    return item.backupUrls[0];
  }
  
  return thumbnailUrl;
};

/**
 * 生成简单的备用URL列表
 */
export const getSimpleBackupUrls = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('labubuwallpaper.com')) {
    return [];
  }
  
  const backupUrls = [];
  
  try {
    // 提取图片路径
    let imagePath = originalUrl.replace('https://labubuwallpaper.com/', '').replace(/^\/+/, '');
    
    if (originalUrl.includes('cdn-cgi/image/')) {
      const match = originalUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (match) {
        imagePath = match[1];
      }
    }
    
    if (imagePath) {
      // 生成不同参数的备用URL
      const configs = [
        'width=300,height=450,fit=cover,quality=75,format=auto',
        'width=400,height=600,fit=cover,quality=80,format=auto',
        'quality=90,format=auto'
      ];
      
      configs.forEach(params => {
        backupUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/${params}/${imagePath}`);
      });
      
      // 添加原始URL（无CDN处理）
      backupUrls.push(`https://labubuwallpaper.com/${imagePath}`);
    }
    
  } catch (error) {
    console.error('❌ 生成备用URL失败:', error);
  }
  
  return backupUrls;
};

/**
 * 测试URL是否可访问
 */
export const testImageUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('加载超时'));
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve({
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        success: true
      });
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('加载失败'));
    };
    
    img.src = url;
  });
}; 