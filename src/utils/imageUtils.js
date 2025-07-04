/**
 * 图片工具函数
 */

/**
 * 生成缩略图URL
 * 将高清图片URL转换为缩略图URL
 */
export const getThumbnailUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  // 对于labubuwallpaper.xyz的图片，添加缩略图参数
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
 */
export const getHighResUrl = (originalUrl) => {
  return originalUrl; // 详情页使用原始高清URL
};
