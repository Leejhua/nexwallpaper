/**
 * 分享工具函数
 * 用于生成社媒分享的优化内容和元数据
 */

/**
 * 生成社媒分享的元数据
 * @param {Object} item - 壁纸项目数据
 * @param {Function} t - 翻译函数
 * @param {string} currentLanguage - 当前语言
 * @returns {Object} 分享元数据
 */
export const generateShareMetadata = (item, t, currentLanguage) => {
  try {
    if (!item) return null;

    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?wallpaper=${item.id || 'unknown'}`;
    
    // 安全的翻译函数调用
    const safeT = (key, fallback = key) => {
      try {
        return t ? t(key) : fallback;
      } catch (error) {
        console.warn('Translation error:', error);
        return fallback;
      }
    };
    
    // 根据语言生成优化的标题和描述
    let title, description, hashtags;
    
    switch (currentLanguage) {
      case 'en':
        title = `${item.title || 'Labubu Wallpaper'} - Beautiful Labubu Wallpaper Collection`;
        description = `Download this stunning ${item.resolution || '4K'} Labubu wallpaper. Perfect for desktop and mobile devices. High quality, cute design, fantasy theme.`;
        hashtags = ['Labubu', 'Wallpaper', 'Cute', 'Fantasy', 'HD', '4K', item.category];
        break;
      case 'es':
        title = `${item.title || 'Fondo Labubu'} - Hermosa Colección de Fondos Labubu`;
        description = `Descarga este impresionante fondo de Labubu en ${item.resolution || '4K'}. Perfecto para escritorio y dispositivos móviles. Alta calidad, diseño lindo, tema fantástico.`;
        hashtags = ['Labubu', 'Fondo', 'Lindo', 'Fantasía', 'HD', '4K', item.category];
        break;
      default: // zh
        title = `${item.title || 'Labubu壁纸'} - 精美Labubu壁纸收藏`;
        description = `下载这张精美的${item.resolution || '4K'} Labubu壁纸。适合桌面和移动设备。高质量、可爱设计、奇幻主题。`;
        hashtags = ['Labubu', '壁纸', '可爱', '奇幻', '高清', '4K', item.category];
    }

    return {
      url: shareUrl,
      title,
      text: description, // 添加text字段作为description的别名
      description,
      image: item.url || '',
      hashtags: hashtags.filter(Boolean),
      type: 'website',
      siteName: safeT('title', 'NexWallpaper'),
      imageAlt: title
    };
  } catch (error) {
    console.error('generateShareMetadata error:', error);
    // 返回基础的分享数据
    return {
      url: window.location.href,
      title: item?.title || 'Labubu Wallpaper',
      text: item?.description || 'Beautiful Labubu wallpaper',
      description: item?.description || 'Beautiful Labubu wallpaper',
      image: item?.url || '',
      hashtags: ['Labubu'],
      type: 'website',
      siteName: 'NexWallpaper',
      imageAlt: item?.title || 'NexWallpaper'
    };
  }
};

/**
 * 为不同平台优化分享内容
 * @param {Object} metadata - 基础元数据
 * @param {string} platform - 平台名称
 * @returns {Object} 平台优化的分享数据
 */
export const optimizeForPlatform = (metadata, platform) => {
  try {
    if (!metadata) return null;

    const base = { ...metadata };

    switch (platform) {
      case 'twitter':
        // Twitter限制280字符
        return {
          ...base,
          text: `${(base.description || base.text || '').substring(0, 200)}... ${base.url}`,
          hashtags: (base.hashtags || []).slice(0, 5).join(' ')
        };

      case 'facebook':
        return {
          ...base,
          quote: base.description || base.text || ''
        };

      case 'pinterest':
        return {
          ...base,
          description: `${base.title || ''} - ${base.description || base.text || ''}`
        };

      case 'linkedin':
        return {
          ...base,
          summary: base.description || base.text || ''
        };

      case 'reddit':
        return {
          ...base,
          title: `${base.title || ''} [${(base.hashtags || []).slice(0, 3).join(', ')}]`
        };

      case 'whatsapp':
      case 'telegram':
        return {
          ...base,
          text: `${base.title || ''}\n\n${base.description || base.text || ''}\n\n${base.url || ''}`
        };

      default:
        return base;
    }
  } catch (error) {
    console.error('optimizeForPlatform error:', error);
    // 返回原始数据
    return metadata || {
      title: 'Labubu Wallpaper',
      text: 'Beautiful Labubu wallpaper',
      url: window.location.href,
      hashtags: []
    };
  }
};

/**
 * 检测用户设备类型
 * @returns {Object} 设备信息
 */
export const detectDevice = () => {
  const userAgent = navigator.userAgent;
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  };
};

/**
 * 生成分享链接
 * @param {string} platform - 平台名称
 * @param {Object} data - 分享数据
 * @returns {string} 分享链接
 */
export const generateShareUrl = (platform, data) => {
  try {
    const { url, title, text, image } = data;
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      
      case 'twitter':
        return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(text)}`;
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      
      case 'reddit':
        return `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      
      case 'telegram':
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      
      default:
        return url;
    }
  } catch (error) {
    console.error('generateShareUrl error:', error);
    return data?.url || window.location.href;
  }
};
