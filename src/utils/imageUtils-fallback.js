/**
 * 图片URL失效降级处理工具
 * 专门处理大规模URL失效的应急修复
 */

/**
 * 修复URL编码问题
 */
export const fixUrlEncoding = (url) => {
  if (!url) return url;
  
  try {
    // 修复常见的URL编码问题
    let fixedUrl = url
      .replace(/%2C/g, ',')      // 修复逗号编码
      .replace(/%20/g, ' ')      // 修复空格编码
      .replace(/%28/g, '(')      // 修复左括号
      .replace(/%29/g, ')')      // 修复右括号
      .replace(/%5B/g, '[')      // 修复左方括号
      .replace(/%5D/g, ']');     // 修复右方括号
    
    return fixedUrl;
  } catch (error) {
    console.warn('URL编码修复失败:', error);
    return url;
  }
};

/**
 * 检查URL是否可能有编码问题
 */
export const hasEncodingIssues = (url) => {
  if (!url) return false;
  return /%[0-9A-F]{2}/i.test(url);
};

/**
 * 生成降级URL策略
 */
export const generateFallbackUrls = (originalUrl, item) => {
  if (!originalUrl) return [];
  
  const fallbackUrls = [];
  
  try {
    // 1. 修复编码问题的版本
    if (hasEncodingIssues(originalUrl)) {
      const decodedUrl = fixUrlEncoding(originalUrl);
      if (decodedUrl !== originalUrl) {
        fallbackUrls.push(decodedUrl);
      }
    }
    
    // 2. 简化CDN参数的版本
    if (originalUrl.includes('cdn-cgi/image/')) {
      const pathMatch = originalUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (pathMatch) {
        const imagePath = pathMatch[1];
        
        // 生成不同质量的降级URL
        const fallbackConfigs = [
          'width=400,height=600,fit=cover,quality=75,format=auto',
          'width=300,height=450,fit=cover,quality=70,format=auto',
          'width=200,height=300,fit=cover,quality=60,format=auto',
          'quality=80,format=auto', // 仅质量压缩
          'format=auto'             // 仅格式转换
        ];
        
        fallbackConfigs.forEach(config => {
          const fallbackUrl = `https://labubuwallpaper.com/cdn-cgi/image/${config}/${imagePath}`;
          fallbackUrls.push(fallbackUrl);
          
          // 同时添加编码修复版本
          if (hasEncodingIssues(fallbackUrl)) {
            fallbackUrls.push(fixUrlEncoding(fallbackUrl));
          }
        });
        
        // 3. 不使用CDN的原始URL
        const rawUrl = `https://labubuwallpaper.com/${imagePath}`;
        fallbackUrls.push(rawUrl);
        if (hasEncodingIssues(rawUrl)) {
          fallbackUrls.push(fixUrlEncoding(rawUrl));
        }
      }
    }
    
    // 4. 使用备用URL（如果项目有的话）
    if (item && item.backupUrls && Array.isArray(item.backupUrls)) {
      item.backupUrls.forEach(backupUrl => {
        if (backupUrl && typeof backupUrl === 'string') {
          fallbackUrls.push(backupUrl);
          
          // 添加编码修复版本
          if (hasEncodingIssues(backupUrl)) {
            fallbackUrls.push(fixUrlEncoding(backupUrl));
          }
        }
      });
    }
    
    // 5. 去重并过滤
    const uniqueUrls = [...new Set(fallbackUrls)]
      .filter(url => url && url !== originalUrl);
    
    return uniqueUrls;
    
  } catch (error) {
    console.warn('生成降级URL失败:', error);
    return [];
  }
};

/**
 * 获取可靠的图片URL - 智能降级策略
 */
export const getReliableImageUrl = (item, preferredQuality = 'high') => {
  if (!item || !item.url) {
    return null;
  }
  
  // URL候选列表，按优先级排序
  const urlCandidates = [];
  
  try {
    // 1. 根据偏好质量决定顺序
    if (preferredQuality === 'high') {
      // 高质量偏好：原始URL -> 备用URL -> 降级URL
      urlCandidates.push(item.url);
      
      if (item.backupUrls && Array.isArray(item.backupUrls)) {
        urlCandidates.push(...item.backupUrls);
      }
      
      urlCandidates.push(...generateFallbackUrls(item.url, item));
      
    } else {
      // 缩略图偏好：降级URL -> 备用URL -> 原始URL
      urlCandidates.push(...generateFallbackUrls(item.url, item));
      
      if (item.backupUrls && Array.isArray(item.backupUrls)) {
        urlCandidates.push(...item.backupUrls);
      }
      
      urlCandidates.push(item.url);
    }
    
    // 2. 去重并返回第一个有效URL
    const uniqueUrls = [...new Set(urlCandidates)]
      .filter(url => url && typeof url === 'string' && url.startsWith('http'));
    
    return uniqueUrls.length > 0 ? uniqueUrls[0] : item.url;
    
  } catch (error) {
    console.warn('获取可靠图片URL失败:', error);
    return item.url;
  }
};

/**
 * 特殊处理视频文件的URL
 */
export const getVideoReliableUrl = (item) => {
  if (!item || item.type !== 'video') {
    return getReliableImageUrl(item);
  }
  
  try {
    // 对于视频文件，不使用CDN图片处理
    const videoUrl = item.url;
    
    // 如果URL包含CDN图片处理参数，移除它们
    if (videoUrl.includes('cdn-cgi/image/')) {
      const pathMatch = videoUrl.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/);
      if (pathMatch) {
        const videoPath = pathMatch[1];
        const directVideoUrl = `https://labubuwallpaper.com/${videoPath}`;
        
        // 同时提供编码修复版本
        const fallbackUrls = [
          directVideoUrl,
          fixUrlEncoding(directVideoUrl)
        ];
        
        return fallbackUrls[0];
      }
    }
    
    // 返回原始URL或编码修复版本
    return hasEncodingIssues(videoUrl) ? fixUrlEncoding(videoUrl) : videoUrl;
    
  } catch (error) {
    console.warn('获取视频可靠URL失败:', error);
    return item.url;
  }
};

/**
 * 统一的URL获取接口 - 根据用途自动选择策略
 */
export const getUrlByPurpose = (item, purpose = 'thumbnail') => {
  if (!item) return null;
  
  try {
    switch (purpose) {
      case 'thumbnail':
      case 'preview':
        // 缩略图使用较小尺寸，但确保可用性
        if (item.url && item.url.includes('labubuwallpaper.com')) {
          // 尝试使用原始URL（已经是缩略图尺寸）
          const thumbnailUrl = item.url;
          
          // 如果有编码问题，优先修复
          if (hasEncodingIssues(thumbnailUrl)) {
            const fixedUrl = fixUrlEncoding(thumbnailUrl);
            console.log(`🔧 ID ${item.id} 缩略图URL编码修复:`, { original: thumbnailUrl, fixed: fixedUrl });
            return fixedUrl;
          }
          
          return thumbnailUrl;
        }
        return getReliableImageUrl(item, 'thumbnail');
        
      case 'detail':
      case 'modal':
        // 详情页使用高质量版本，但有智能降级
        if (item.url && item.url.includes('labubuwallpaper.com')) {
          try {
            const imagePath = item.url.includes('cdn-cgi/image/') 
              ? item.url.match(/cdn-cgi\/image\/[^\/]+\/(.+)$/)?.[1]
              : item.url.replace('https://labubuwallpaper.com/', '');
            
            if (imagePath) {
              // 生成高质量版本
              const modalParams = 'width=800,height=1600,fit=cover,quality=95,format=auto';
              const highQualityUrl = `https://labubuwallpaper.com/cdn-cgi/image/${modalParams}/${imagePath}`;
              
              console.log(`🖼️ ID ${item.id} 详情页高质量URL:`, highQualityUrl);
              return highQualityUrl;
            }
          } catch (error) {
            console.warn(`ID ${item.id} 生成高质量URL失败，使用降级策略:`, error);
          }
        }
        return getReliableImageUrl(item, 'high');
        
      case 'download':
        // 下载优先使用备用URL中的原始版本
        if (item.backupUrls && item.backupUrls.length > 0) {
          // 寻找非CDN的原始URL
          const originalUrl = item.backupUrls.find(url => url && !url.includes('cdn-cgi/image/'));
          if (originalUrl) {
            return hasEncodingIssues(originalUrl) ? fixUrlEncoding(originalUrl) : originalUrl;
          }
        }
        return item.type === 'video' 
          ? getVideoReliableUrl(item) 
          : getReliableImageUrl(item, 'high');
          
      case 'video':
        return getVideoReliableUrl(item);
        
      default:
        return getReliableImageUrl(item, 'thumbnail');
    }
  } catch (error) {
    console.warn(`getUrlByPurpose失败 (ID: ${item.id}, purpose: ${purpose}):`, error);
    return item.url;
  }
};

/**
 * 批量检查和修复项目URL
 */
export const batchFixUrls = (items) => {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => {
    if (!item || !item.url) return item;
    
    try {
      const fixedItem = { ...item };
      
      // 修复主URL的编码问题
      if (hasEncodingIssues(item.url)) {
        fixedItem.url = fixUrlEncoding(item.url);
      }
      
      // 修复备用URL的编码问题
      if (item.backupUrls && Array.isArray(item.backupUrls)) {
        fixedItem.backupUrls = item.backupUrls.map(url => 
          hasEncodingIssues(url) ? fixUrlEncoding(url) : url
        );
      }
      
      // 生成额外的降级URL
      const fallbackUrls = generateFallbackUrls(item.url, item);
      if (fallbackUrls.length > 0) {
        fixedItem.backupUrls = [
          ...(fixedItem.backupUrls || []),
          ...fallbackUrls
        ];
      }
      
      return fixedItem;
      
    } catch (error) {
      console.warn(`修复项目 ${item.id} 的URL失败:`, error);
      return item;
    }
  });
}; 