/**
 * ID 8 专门修复模块
 * 处理缓存问题和强制刷新
 */

import { fixUrlEncoding, hasEncodingIssues } from './imageUtils-fallback.js';

/**
 * ID 8的专门URL处理
 */
export const getId8SpecialUrls = () => {
  const id8BaseUrl = "https://labubuwallpaper.com/cdn-cgi/image/width=250,height=500,fit=cover,quality=90,format=auto/Labubu-with-Swim-Ring%2CLabubu-Live-Wallpaper.jpg";
  
  // 生成多个无缓存版本
  const timestamp = Date.now();
  const randomParam = Math.random().toString(36).substring(7);
  
  return {
    // 原始URL（带编码）
    original: id8BaseUrl,
    
    // 解码版本
    decoded: fixUrlEncoding(id8BaseUrl),
    
    // 无缓存版本
    noCache: `${id8BaseUrl}?v=${timestamp}`,
    noCacheDecoded: `${fixUrlEncoding(id8BaseUrl)}?v=${timestamp}`,
    
    // 随机参数版本
    random: `${id8BaseUrl}?r=${randomParam}`,
    randomDecoded: `${fixUrlEncoding(id8BaseUrl)}?r=${randomParam}`,
    
    // 备用URLs（来自数据）
    backup1: "https://labubuwallpaper.com/Labubu-with-Swim-Ring%2CLabubu-Live-Wallpaper.jpg",
    backup1Decoded: "https://labubuwallpaper.com/Labubu-with-Swim-Ring,Labubu-Live-Wallpaper.jpg",
    
    // 高质量版本（详情页用）
    highQuality: "https://labubuwallpaper.com/cdn-cgi/image/width=800,height=1600,fit=cover,quality=95,format=auto/Labubu-with-Swim-Ring%2CLabubu-Live-Wallpaper.jpg",
    highQualityDecoded: "https://labubuwallpaper.com/cdn-cgi/image/width=800,height=1600,fit=cover,quality=95,format=auto/Labubu-with-Swim-Ring,Labubu-Live-Wallpaper.jpg"
  };
};

/**
 * 为ID 8特殊处理URL选择
 */
export const getId8UrlByPurpose = (purpose = 'thumbnail') => {
  const urls = getId8SpecialUrls();
  
  switch (purpose) {
    case 'thumbnail':
    case 'preview':
      // 缩略图优先使用解码版本，添加随机参数避免缓存
      return [
        urls.randomDecoded,
        urls.noCacheDecoded,
        urls.decoded,
        urls.backup1Decoded,
        urls.random,
        urls.noCache,
        urls.original
      ];
      
    case 'modal':
    case 'detail':
      // 详情页使用高质量版本
      return [
        urls.highQualityDecoded,
        urls.highQuality,
        urls.randomDecoded,
        urls.backup1Decoded,
        urls.decoded
      ];
      
    case 'download':
      // 下载使用备用原始URL
      return [
        urls.backup1Decoded,
        urls.backup1,
        urls.highQualityDecoded,
        urls.decoded
      ];
      
    default:
      return [urls.decoded, urls.original];
  }
};

/**
 * 检查是否是ID 8
 */
export const isId8 = (item) => {
  return item && (item.id === 8 || item.id === '8');
};

/**
 * 强制清除ID 8的浏览器缓存
 */
export const clearId8Cache = () => {
  try {
    // 清除localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('id-8') || key.includes('Labubu-with-Swim-Ring')) {
        localStorage.removeItem(key);
      }
    });
    
    // 清除sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('id-8') || key.includes('Labubu-with-Swim-Ring')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🧹 ID 8 缓存已清除');
    return true;
  } catch (error) {
    console.warn('清除ID 8缓存失败:', error);
    return false;
  }
};

/**
 * 初始化ID 8修复
 */
export const initId8Fix = () => {
  console.log('🔧 初始化ID 8特殊修复...');
  
  // 清除旧缓存
  clearId8Cache();
  
  // 预热URL
  const urls = getId8SpecialUrls();
  console.log('🎯 ID 8可用URL:', Object.keys(urls).length + '个');
  
  return true;
}; 