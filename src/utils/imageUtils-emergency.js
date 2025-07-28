/**
 * 紧急修复工具 - 用于大规模URL失效时的临时替换
 * 基于检查结果的应急方案
 */

/**
 * ID 1的成功URL模式（仅有的可用案例）
 * 状态：缩略图可用(200)，详情页失效(fetch failed)
 */
const WORKING_URL_PATTERN = {
  id: 1,
  url: "https://labubuwallpaper.com/cdn-cgi/image/width=250,height=500,fit=cover,quality=90,format=auto/labubu-garden-swing-happy-mood%2CLabubu-iPhone-Wallpaper.png",
  status: {
    thumbnail: 200,  // 可用
    detail: 'failed', // 失效
    original: 'failed' // 失效
  }
};

/**
 * 紧急降级：使用占位符图片
 */
const EMERGENCY_PLACEHOLDER = {
  thumbnail: '/images/placeholder-thumbnail.jpg',
  detail: '/images/placeholder-detail.jpg',
  video: '/images/placeholder-video.jpg'
};

/**
 * 生成临时修复URL
 */
export const generateEmergencyUrl = (item, purpose = 'thumbnail') => {
  if (!item) return EMERGENCY_PLACEHOLDER[purpose];
  
  try {
    // 特殊处理：ID 1的成功模式（唯一可用的缩略图）
    if (item.id === 1 && purpose === 'thumbnail') {
      return WORKING_URL_PATTERN.url;
    }
    
    // 尝试基于ID 1的模式生成类似URL
    if (item.url && item.url.includes('labubuwallpaper.com')) {
      const safeName = encodeURIComponent(
        `${item.title || 'wallpaper'}-${item.id}`
          .replace(/[^a-zA-Z0-9\-]/g, '-')
          .toLowerCase()
      );
      
      // 基于ID 1的成功模式构造
      const basePattern = "https://labubuwallpaper.com/cdn-cgi/image/width=250,height=500,fit=cover,quality=90,format=auto/";
      return `${basePattern}${safeName}%2CLabubu-iPhone-Wallpaper.png`;
    }
    
    // 最终降级：占位符
    return EMERGENCY_PLACEHOLDER[purpose];
    
  } catch (error) {
    console.warn('生成紧急URL失败:', error);
    return EMERGENCY_PLACEHOLDER[purpose];
  }
};

/**
 * 检查URL是否需要紧急修复
 */
export const needsEmergencyFix = (url) => {
  if (!url) return true;
  
  // 所有labubuwallpaper.com的URL都需要检查
  return url.includes('labubuwallpaper.com');
};

/**
 * 创建占位符图片
 */
export const createPlaceholderImage = (width = 250, height = 500, text = 'Labubu Wallpaper') => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#FF6B9D');
  gradient.addColorStop(1, '#C44569');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 文字
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL('image/png');
};

/**
 * 初始化紧急修复（创建本地占位符）
 */
export const initializeEmergencyFix = () => {
  try {
    // 创建本地占位符图片
    const placeholderData = createPlaceholderImage();
    
    // 存储到sessionStorage供快速访问
    sessionStorage.setItem('emergency-placeholder', placeholderData);
    
    console.log('🚨 紧急修复已初始化');
    return true;
  } catch (error) {
    console.error('紧急修复初始化失败:', error);
    return false;
  }
}; 