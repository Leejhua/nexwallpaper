/**
 * 图片工具函数
 * 处理各种图片URL生成、优化和备用策略
 */

/**
 * 检测是否支持WebP格式
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
};

/**
 * 获取最优图片格式
 */
export const getOptimalFormat = () => {
  return supportsWebP() ? 'webp' : 'jpeg';
};

/**
 * 清理和标准化URL路径
 */
const cleanUrl = (url) => {
  if (!url) return url;
  
  try {
    // 对于已经包含CDN参数的URL，不要全面解码，只处理路径部分
    if (url.includes('cdn-cgi/image/')) {
      // 标准化路径分隔符，但保持URL编码
      let cleanedUrl = url.replace(/\/+/g, '/');
      // 修复协议部分的双斜杠
      cleanedUrl = cleanedUrl.replace(/^(https?):\/([^\/])/, '$1://$2');
      return cleanedUrl;
    }
    
    // 对于普通URL进行完整处理
    let cleanedUrl = decodeURIComponent(url);
    cleanedUrl = cleanedUrl.replace(/\/+/g, '/');
    cleanedUrl = cleanedUrl.replace(/^(https?):\/([^\/])/, '$1://$2');
    
    return cleanedUrl;
  } catch (e) {
    console.warn('URL cleaning failed:', e);
    return url;
  }
};

/**
 * 生成缩略图URL - 增强版，支持更好的错误处理
 */
export const getThumbnailUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  try {
    // 对于非labubuwallpaper.com的图片，直接返回原URL
    if (!originalUrl.includes('labubuwallpaper.com')) {
      return originalUrl;
    }
    
    // 首先尝试提取原始文件路径
    let imagePath = '';
    
    if (originalUrl.includes('cdn-cgi/image/')) {
      // 处理已有CDN URL: https://labubuwallpaper.com/cdn-cgi/image/width=250,height=500,fit=cover,quality=90,format=auto/filename.png
      const pathMatch = originalUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (pathMatch) {
        imagePath = pathMatch[1];
      } else {
        // 备用解析方法
        const parts = originalUrl.split('/');
        const imageIndex = parts.findIndex(part => part.includes('format='));
        if (imageIndex >= 0 && imageIndex + 1 < parts.length) {
          imagePath = parts.slice(imageIndex + 1).join('/');
        }
      }
    } else {
      // 处理直接URL: https://labubuwallpaper.com/filename.png
      imagePath = originalUrl.replace('https://labubuwallpaper.com/', '').replace(/^\/+/, '');
    }
    
    // 如果无法提取路径，返回原URL
    if (!imagePath) {
      console.warn('无法提取图片路径:', originalUrl);
      return originalUrl;
    }
    
    // 生成缩略图URL - 使用保守的参数
    const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
    const optimalFormat = getOptimalFormat();
    
    // 缩略图使用较小的尺寸和适中的质量
    const thumbnailParams = `width=350,height=525,fit=cover,quality=80,format=${optimalFormat}`;
    
    const thumbnailUrl = `${baseUrl}${thumbnailParams}/${imagePath}`;
    
    return thumbnailUrl;
    
  } catch (error) {
    console.warn('生成缩略图URL失败:', error, originalUrl);
    return originalUrl;
  }
};

/**
 * 生成高质量详情页URL
 */
export const getHighQualityUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  try {
    const cleanedUrl = cleanUrl(originalUrl);
    
    // 对于labubuwallpaper.com的图片
    if (cleanedUrl.includes('labubuwallpaper.com')) {
      
      // 如果是CDN URL，尝试生成更高质量的版本
      if (cleanedUrl.includes('cdn-cgi/image/')) {
        const parts = cleanedUrl.split('/');
        const imageIndex = parts.findIndex(part => part.includes('format='));
        let imagePath;
        
        if (imageIndex >= 0 && imageIndex + 1 < parts.length) {
          imagePath = parts.slice(imageIndex + 1).join('/');
        } else {
          imagePath = parts[parts.length - 1];
        }
        
        const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
        const optimalFormat = getOptimalFormat();
        const params = `width=1920,height=1080,fit=scale-down,quality=95,format=${optimalFormat}`;
        
        return `${baseUrl}${params}/${imagePath}`;
      }
      
      // 对于直接图片URL，保持原样或生成高质量版本
      return cleanedUrl;
    }
    
    return cleanedUrl;
    
  } catch (error) {
    console.warn('生成高质量URL失败:', error);
    return originalUrl;
  }
};

/**
 * 生成多级备用URL策略 - 增强版，专门处理缩略图问题
 */
export const generateBackupUrls = (originalUrl) => {
  if (!originalUrl) return [];
  
  const backupUrls = [];
  
  try {
    if (!originalUrl.includes('labubuwallpaper.com')) {
      return []; // 非目标域名，不生成备用URL
    }
    
    // 提取图片路径
    let imagePath = '';
    
    if (originalUrl.includes('cdn-cgi/image/')) {
      // 从CDN URL提取路径
      const pathMatch = originalUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (pathMatch) {
        imagePath = pathMatch[1];
      }
    } else {
      // 从直接URL提取路径
      imagePath = originalUrl.replace('https://labubuwallpaper.com/', '').replace(/^\/+/, '');
    }
    
    if (!imagePath) {
      console.warn('无法提取图片路径用于生成备用URL:', originalUrl);
      return [];
    }
    
    // 1. 首选：原始URL（如果不是CDN）
    if (!originalUrl.includes('cdn-cgi/image/')) {
      backupUrls.push(originalUrl);
    }
    
    // 2. 多种缩略图尺寸配置（从保守到激进）
    const thumbnailConfigs = [
      'width=300,height=450,fit=cover,quality=75,format=auto',   // 最保守
      'width=350,height=525,fit=cover,quality=80,format=auto',   // 保守
      'width=400,height=600,fit=cover,quality=80,format=auto',   // 中等
      'width=250,height=500,fit=cover,quality=85,format=auto',   // 原始参数
      'width=500,height=750,fit=cover,quality=75,format=auto',   // 较大尺寸
    ];
    
    thumbnailConfigs.forEach(params => {
      backupUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/${params}/${imagePath}`);
    });
    
    // 3. 详情图尺寸配置
    const detailConfigs = [
      'width=800,height=1200,fit=cover,quality=85,format=auto',
      'width=1024,height=768,fit=cover,quality=90,format=auto',
      'quality=90,format=auto'  // 仅质量和格式
    ];
    
    detailConfigs.forEach(params => {
      backupUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/${params}/${imagePath}`);
    });
    
    // 4. 不带CDN参数的原始URL
    backupUrls.push(`https://labubuwallpaper.com/${imagePath}`);
    
    // 5. 格式变换策略
    const baseImagePath = imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    if (baseImagePath !== imagePath) { // 确保有文件扩展名
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      extensions.forEach(ext => {
        // 原始格式
        backupUrls.push(`https://labubuwallpaper.com/${baseImagePath}.${ext}`);
        // 带缩略图参数的格式变换
        backupUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/width=350,height=525,fit=cover,quality=80,format=auto/${baseImagePath}.${ext}`);
      });
    }
    
    // 6. URL解码处理（针对包含%2C等编码的URL）
    if (imagePath.includes('%')) {
      try {
        const decodedPath = decodeURIComponent(imagePath);
        backupUrls.push(`https://labubuwallpaper.com/${decodedPath}`);
        backupUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/width=350,height=525,fit=cover,quality=80,format=auto/${decodedPath}`);
      } catch (decodeError) {
        console.warn('URL解码失败:', decodeError);
      }
    }
    
    // 去重并过滤掉原始URL
    const uniqueUrls = [...new Set(backupUrls)].filter(url => url !== originalUrl);
    
    return uniqueUrls;
    
  } catch (error) {
    console.warn('生成备用URL失败:', error);
    return [];
  }
};

/**
 * 获取用于预览的URL（缩略图）- 增强版
 */
export const getPreviewUrl = (item) => {
  if (!item) return '';
  
  // 优先使用主URL生成缩略图
  const mainThumbnail = getThumbnailUrl(item.url);
  
  // 如果主URL生成的缩略图和原URL相同，说明可能有问题，尝试备用URL
  if (mainThumbnail === item.url && item.backupUrls && item.backupUrls.length > 0) {
    // 尝试第一个备用URL
    const backupThumbnail = getThumbnailUrl(item.backupUrls[0]);
    if (backupThumbnail !== item.backupUrls[0]) {
      return backupThumbnail;
    }
    // 如果备用URL也有问题，直接返回备用URL
    return item.backupUrls[0];
  }
  
  return mainThumbnail;
};

/**
 * 获取用于详情页显示的高质量URL
 */
export const getDetailUrl = (item) => {
  if (!item) return '';
  
  // 对于详情页，优先使用原始URL或备用URL中最高质量的
  if (item.backupUrls && item.backupUrls.length > 0) {
    // 查找原始URL（没有CDN参数的）
    const originalUrl = item.backupUrls.find(url => 
      !url.includes('cdn-cgi/image/') && url.includes('labubuwallpaper.com')
    );
    
    if (originalUrl) {
      return getHighQualityUrl(originalUrl);
    }
    
    return getHighQualityUrl(item.backupUrls[0]);
  }
  
  return getHighQualityUrl(item.url);
};

/**
 * 图片加载错误处理 - 尝试备用URL
 */
export const handleImageError = (event, item, onSuccess) => {
  const img = event.target;
  const currentSrc = img.src;
  
  // 生成所有可能的备用URL
  const allBackupUrls = [
    ...(item.backupUrls || []),
    ...generateBackupUrls(item.url)
  ];
  
  // 去重并过滤掉当前失败的URL
  const availableUrls = [...new Set(allBackupUrls)].filter(url => url !== currentSrc);
  
  if (availableUrls.length > 0) {
    const nextUrl = availableUrls[0];
    img.onload = () => {
      if (onSuccess) onSuccess(nextUrl);
    };
    
    img.onerror = (e) => {
      // 递归尝试下一个备用URL
      const remainingUrls = availableUrls.slice(1);
      if (remainingUrls.length > 0) {
        const updatedItem = { 
          ...item, 
          backupUrls: remainingUrls 
        };
        handleImageError(e, updatedItem, onSuccess);
      } else {
        console.error(`所有备用URL都失败了，原始图片: ${item.url}`);
      }
    };
    
    img.src = nextUrl;
  } else {
    console.error(`没有可用的备用URL，原始图片: ${item.url}`);
  }
};

/**
 * 预加载图片
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * 处理复杂的CDN URL编码问题 - 专门修复ID 1和ID 2等问题
 */
export const handleComplexCdnUrl = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('cdn-cgi/image/')) {
    return originalUrl;
  }
  
  try {
    // 特殊处理包含编码字符的URL
    if (originalUrl.includes('%2C')) {
      // 解码URL中的逗号编码
      const decodedUrl = originalUrl.replace(/%2C/g, ',');
      return decodedUrl;
    }
    
    return originalUrl;
  } catch (error) {
    console.warn('处理复杂CDN URL失败:', error);
    return originalUrl;
  }
};
