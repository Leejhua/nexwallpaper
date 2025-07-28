/**
 * 视频文件处理工具
 * 为视频文件生成多种降级和优化选项
 */

/**
 * 为视频生成CDN优化的预览图URL
 */
export const getVideoPreviewImageUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('labubuwallpaper.com')) {
    return null;
  }
  
  try {
    const videoPath = videoUrl.replace('https://labubuwallpaper.com/', '');
    
    // 生成视频的第一帧截图作为预览图
    const previewImageUrl = `https://labubuwallpaper.com/cdn-cgi/image/width=400,height=300,fit=cover,quality=80,format=jpeg/${videoPath}`;
    
    return previewImageUrl;
  } catch (error) {
    console.warn('生成视频预览图失败:', error);
    return null;
  }
};

/**
 * 为视频生成多种质量的降级URL
 */
export const getVideoFallbackUrls = (originalVideoUrl) => {
  if (!originalVideoUrl || !originalVideoUrl.includes('labubuwallpaper.com')) {
    return [];
  }
  
  try {
    const videoPath = originalVideoUrl.replace('https://labubuwallpaper.com/', '');
    const fallbackUrls = [];
    
    // 1. 尝试生成压缩版视频
    if (originalVideoUrl.includes('.mp4')) {
      fallbackUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/width=640,height=480,fit=cover,quality=70,format=auto/${videoPath}`);
    }
    
    // 2. 尝试生成静态预览图（作为最后降级选项）
    const previewImage = getVideoPreviewImageUrl(originalVideoUrl);
    if (previewImage) {
      fallbackUrls.push(previewImage);
    }
    
    // 3. 生成更小尺寸的预览图
    fallbackUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/width=200,height=150,fit=cover,quality=60,format=jpeg/${videoPath}`);
    
    return fallbackUrls.filter(url => url);
  } catch (error) {
    console.warn('生成视频降级URL失败:', error);
    return [];
  }
};

/**
 * 检测视频URL是否可能存在问题
 */
export const isProblematicVideoUrl = (videoUrl, backupUrls = []) => {
  // 原始URL + 空备用URL = 高风险
  const isOriginalUrl = videoUrl && !videoUrl.includes('cdn-cgi/image/');
  const hasNoBackups = !backupUrls || backupUrls.length === 0;
  
  return isOriginalUrl && hasNoBackups;
};

/**
 * 为视频项目生成完整的URL降级链
 */
export const getCompleteVideoUrlChain = (videoItem) => {
  const urls = [];
  
  // 1. 优先使用项目自带的备用URL
  if (videoItem.backupUrls && videoItem.backupUrls.length > 0) {
    urls.push(...videoItem.backupUrls);
  }
  
  // 2. 原始URL
  urls.push(videoItem.url);
  
  // 3. 生成的降级URL
  const fallbackUrls = getVideoFallbackUrls(videoItem.url);
  urls.push(...fallbackUrls);
  
  // 去重并过滤有效URL
  return [...new Set(urls)].filter(url => url && typeof url === 'string' && url.startsWith('http'));
};

/**
 * 获取视频的预加载策略
 */
export const getVideoPreloadStrategy = (videoItem) => {
  // 对于已知问题的视频，使用更保守的预加载策略
  if (isProblematicVideoUrl(videoItem.url, videoItem.backupUrls)) {
    return 'metadata'; // 只预加载元数据
  }
  
  return 'auto'; // 正常预加载
}; 