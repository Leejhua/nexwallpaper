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
      siteName: safeT('title', 'Labubu Gallery'),
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
      siteName: 'Labubu Gallery',
      imageAlt: item?.title || 'Labubu Wallpaper'
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

    default:
      return base;
  }
};

/**
 * 生成Open Graph和Twitter Card元标签
 * @param {Object} metadata - 元数据
 * @returns {string} HTML meta标签字符串
 */
export const generateMetaTags = (metadata) => {
  if (!metadata) return '';

  return `
    <!-- Open Graph -->
    <meta property="og:type" content="${metadata.type}" />
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${metadata.image}" />
    <meta property="og:url" content="${metadata.url}" />
    <meta property="og:site_name" content="${metadata.siteName}" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
    <meta name="twitter:image" content="${metadata.image}" />
    <meta name="twitter:image:alt" content="${metadata.imageAlt}" />
    
    <!-- General -->
    <meta name="description" content="${metadata.description}" />
    <meta name="keywords" content="${metadata.hashtags.join(', ')}" />
  `.trim();
};

/**
 * 检测用户地区和语言，推荐最佳分享方式
 * @param {string} currentLanguage - 当前语言
 * @returns {Object} 推荐的分享平台配置
 */
export const getRecommendedPlatforms = (currentLanguage) => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
  const isIOS = /iphone|ipad/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  // 中文环境 - 推荐国内平台
  if (currentLanguage === 'zh') {
    let domestic = ['weibo', 'qzone', 'wechat'];
    
    if (isMobile) {
      // 移动端优先微信和QQ
      domestic = ['wechat', 'weibo', 'qzone'];
    }
    
    return {
      region: 'domestic',
      platforms: domestic,
      primary: domestic.slice(0, 3)
    };
  }

  // 英文/西班牙语环境 - 推荐国际平台
  let international = ['facebook', 'twitter', 'pinterest'];

  if (isMobile) {
    international.unshift('whatsapp');
    if (isIOS) {
      international.push('instagram');
    }
    if (isAndroid) {
      international.push('telegram');
    }
  } else {
    international.push('linkedin', 'reddit');
  }

  return {
    region: 'international',
    platforms: international,
    primary: international.slice(0, 6)
  };
};
