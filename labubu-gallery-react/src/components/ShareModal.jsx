import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Share2, Copy, Check, Smartphone, Flame, Star, MessageCircle, Camera, Pin,
  Facebook, Twitter, Instagram, Linkedin, Send, Globe, Hash, Users
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateShareMetadata, optimizeForPlatform } from '../utils/shareUtils';

/**
 * 分享模态框组件 - 支持多平台分享
 */
const ShareModal = ({ isOpen, onClose, item }) => {
  const { t, currentLanguage } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // 错误处理函数
  const handleError = useCallback((error, functionName) => {
    console.error(`ShareModal ${functionName} error:`, error);
    // 不让错误导致白屏，静默处理
  }, []);

  // 安全的翻译函数
  const safeT = useCallback((key, fallback = key) => {
    try {
      return t ? t(key) : fallback;
    } catch (error) {
      handleError(error, 'safeT');
      return fallback;
    }
  }, [t, handleError]);

  // 构建分享数据
  const getShareData = useCallback(() => {
    try {
      if (!item) return null;
      return generateShareMetadata(item, safeT, currentLanguage);
    } catch (error) {
      handleError(error, 'getShareData');
      return {
        title: item?.title || 'Labubu Wallpaper',
        text: item?.description || 'Beautiful Labubu wallpaper',
        url: window.location.href
      };
    }
  }, [item, safeT, currentLanguage, handleError]);

  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // 尝试打开app，失败则回退到网页版
  const tryOpenApp = useCallback((appUrl, webUrl, windowOptions = 'width=600,height=400') => {
    try {
      if (isMobile) {
        // 移动端尝试打开app
        const startTime = Date.now();
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appUrl;
        document.body.appendChild(iframe);
        
        // 设置超时，如果app没有打开则打开网页版
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
            const endTime = Date.now();
            // 如果时间差小于2秒，说明可能没有安装app，打开网页版
            if (endTime - startTime < 2000) {
              window.open(webUrl, '_blank');
            }
          } catch (error) {
            handleError(error, 'tryOpenApp-timeout');
          }
        }, 1500);
      } else {
        // 桌面端直接打开网页版
        window.open(webUrl, '_blank', windowOptions);
      }
    } catch (error) {
      handleError(error, 'tryOpenApp');
      // 降级处理：直接打开网页版
      try {
        window.open(webUrl, '_blank', windowOptions);
      } catch (fallbackError) {
        handleError(fallbackError, 'tryOpenApp-fallback');
      }
    }
  }, [isMobile, handleError]);

  // 微博分享 - 支持app拉起
  const shareToWeibo = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const weiboWebUrl = new URL('https://service.weibo.com/share/share.php');
      weiboWebUrl.searchParams.set('url', shareData.url);
      weiboWebUrl.searchParams.set('title', `${shareData.text}`);
      weiboWebUrl.searchParams.set('pic', item.url);
      
      // 微博app深度链接
      const weiboAppUrl = `sinaweibo://compose?content=${encodeURIComponent(shareData.text + ' ' + shareData.url)}&image=${encodeURIComponent(item.url)}`;
      
      tryOpenApp(weiboAppUrl, weiboWebUrl.toString());
      onClose();
    } catch (error) {
      handleError(error, 'shareToWeibo');
      onClose();
    }
  }, [getShareData, item, onClose, tryOpenApp, handleError]);

  // QQ空间分享 - 支持app拉起
  const shareToQzone = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const qzoneWebUrl = new URL('https://connect.qq.com/widget/shareqq/index.html');
      qzoneWebUrl.searchParams.set('url', shareData.url);
      qzoneWebUrl.searchParams.set('title', shareData.title);
      qzoneWebUrl.searchParams.set('summary', shareData.text);
      qzoneWebUrl.searchParams.set('pics', item.url);
      
      // QQ空间app深度链接
      const qzoneAppUrl = `mqqapi://share/to_qzone?src_type=web&version=1&file_type=news&req_type=1&image_url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(shareData.title)}&description=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
      
      tryOpenApp(qzoneAppUrl, qzoneWebUrl.toString());
      onClose();
    } catch (error) {
      handleError(error, 'shareToQzone');
      onClose();
    }
  }, [getShareData, item, onClose, tryOpenApp, handleError]);

  // 微信分享 - 移动端优化
  const shareToWechat = useCallback(async () => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      try {
        // 尝试使用Web Share API (移动端支持更好)
        if (navigator.share && isMobile) {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url
          });
          onClose();
          return;
        }
        
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        
        // 移动端提示用户可以粘贴到微信
        if (isMobile) {
          alert(safeT('wechatShareTip', '链接已复制，请粘贴到微信分享'));
        }
      } catch (error) {
        // 降级处理
        const textToCopy = `${shareData.text} ${shareData.url}`;
        if (window.prompt) {
          prompt(safeT('copyLinkToWechat', '复制链接到微信'), textToCopy);
        }
        onClose();
      }
    } catch (error) {
      handleError(error, 'shareToWechat');
      onClose();
    }
  }, [getShareData, onClose, isMobile, t, handleError]);

  // Facebook分享
  const shareToFacebook = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
      facebookUrl.searchParams.set('u', shareData.url);
      facebookUrl.searchParams.set('quote', shareData.text);
      
      window.open(facebookUrl.toString(), '_blank', 'width=600,height=400');
      onClose();
    } catch (error) {
      handleError(error, 'shareToFacebook');
      onClose();
    }
  }, [getShareData, onClose, handleError]);

  // Pinterest分享
  const shareToPinterest = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const pinterestUrl = new URL('https://pinterest.com/pin/create/button/');
      pinterestUrl.searchParams.set('url', shareData.url);
      pinterestUrl.searchParams.set('media', item.url);
      pinterestUrl.searchParams.set('description', shareData.text);
      
      window.open(pinterestUrl.toString(), '_blank', 'width=600,height=400');
      onClose();
    } catch (error) {
      handleError(error, 'shareToPinterest');
      onClose();
    }
  }, [getShareData, item, onClose, handleError]);

  // Reddit分享
  const shareToReddit = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const redditUrl = new URL('https://reddit.com/submit');
      redditUrl.searchParams.set('url', shareData.url);
      redditUrl.searchParams.set('title', shareData.title);
      
      window.open(redditUrl.toString(), '_blank', 'width=600,height=400');
      onClose();
    } catch (error) {
      handleError(error, 'shareToReddit');
      onClose();
    }
  }, [getShareData, onClose, handleError]);

  // LinkedIn分享
  const shareToLinkedIn = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const linkedinUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
      linkedinUrl.searchParams.set('url', shareData.url);
      
      window.open(linkedinUrl.toString(), '_blank', 'width=600,height=400');
      onClose();
    } catch (error) {
      handleError(error, 'shareToLinkedIn');
      onClose();
    }
  }, [getShareData, onClose, handleError]);

  // WhatsApp分享 - 支持app拉起
  const shareToWhatsApp = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const message = `${shareData.text} ${shareData.url}`;
      
      if (isMobile) {
        // 移动端尝试打开WhatsApp app
        const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        
        tryOpenApp(whatsappAppUrl, whatsappWebUrl);
      } else {
        // 桌面端使用WhatsApp Web
        const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappWebUrl, '_blank');
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'shareToWhatsApp');
      onClose();
    }
  }, [getShareData, onClose, isMobile, tryOpenApp, handleError]);

  // Instagram分享 - 移动端优化
  const shareToInstagram = useCallback(async () => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const shareContent = `${shareData.text} ${shareData.url}`;

      if (isMobile) {
        try {
          // 尝试使用Web Share API
          if (navigator.share) {
            await navigator.share({
              title: shareData.title,
              text: shareContent,
              url: shareData.url
            });
            onClose();
            return;
          }
        } catch (error) {
          console.log('Web Share API failed for Instagram');
        }
        
        // 移动端尝试打开Instagram app
        const instagramAppUrl = `instagram://share?text=${encodeURIComponent(shareContent)}`;
        
        // 创建隐藏链接尝试打开app
        const link = document.createElement('a');
        link.href = instagramAppUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 同时复制内容到剪贴板
        try {
          await navigator.clipboard.writeText(shareContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          alert(safeT('instagramShareTip', '内容已复制，请粘贴到Instagram分享'));
        } catch (clipboardError) {
          prompt(safeT('copyLinkForInstagram', '复制内容到Instagram'), shareContent);
        }
      } else {
        // 桌面端复制链接
        try {
          await navigator.clipboard.writeText(shareContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          alert(safeT('instagramShareTip', '内容已复制，请在Instagram中粘贴分享'));
        } catch (error) {
          prompt(safeT('copyLinkForInstagram', '复制内容到Instagram'), shareContent);
        }
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'shareToInstagram');
      onClose();
    }
  }, [getShareData, t, isMobile, onClose, handleError]);

  // Telegram分享 - 支持app拉起
  const shareToTelegram = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      const message = `${shareData.text} ${shareData.url}`;
      
      if (isMobile) {
        // 移动端尝试打开Telegram app
        const telegramAppUrl = `tg://msg?text=${encodeURIComponent(message)}`;
        const telegramWebUrl = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
        
        tryOpenApp(telegramAppUrl, telegramWebUrl);
      } else {
        // 桌面端使用Telegram Web
        const telegramWebUrl = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
        window.open(telegramWebUrl, '_blank');
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'shareToTelegram');
      onClose();
    }
  }, [getShareData, onClose, isMobile, tryOpenApp, handleError]);

  // Twitter/X分享 - 支持app拉起
  const shareToTwitter = useCallback(() => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      // 优化分享内容
      const optimized = optimizeForPlatform(shareData, 'twitter');
      const tweetText = `${optimized.text} ${shareData.url}`;
      
      if (isMobile) {
        // 移动端尝试打开Twitter app
        const twitterAppUrl = `twitter://post?message=${encodeURIComponent(tweetText)}`;
        const twitterWebUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=${optimized.hashtags}`;
        
        tryOpenApp(twitterAppUrl, twitterWebUrl);
      } else {
        // 桌面端使用Web Share API或网页版
        if (navigator.share) {
          navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url
          }).catch(() => {
            // 回退到网页版
            const twitterWebUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=${optimized.hashtags}`;
            window.open(twitterWebUrl, '_blank', 'width=600,height=400');
          });
        } else {
          const twitterWebUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=${optimized.hashtags}`;
          window.open(twitterWebUrl, '_blank', 'width=600,height=400');
        }
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'shareToTwitter');
      onClose();
    }
  }, [getShareData, onClose, isMobile, tryOpenApp, handleError]);

  // 复制链接
  const copyLink = useCallback(async () => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        prompt(safeT('copyLink', '复制链接'), shareData.url);
      }
    } catch (error) {
      handleError(error, 'copyLink');
    }
  }, [getShareData, safeT, handleError]);

  // 原生分享
  const nativeShare = useCallback(async () => {
    try {
      const shareData = getShareData();
      if (!shareData) return;

      try {
        if (navigator.share) {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url
          });
          onClose();
        } else {
          // 降级到复制链接
          copyLink();
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyLink();
        }
      }
    } catch (error) {
      handleError(error, 'nativeShare');
      copyLink();
    }
  }, [getShareData, copyLink, onClose, handleError]);

  if (!item) return null;

  // 根据当前语言动态生成分享选项
  const getShareOptions = useCallback(() => {
    // 通用选项（所有语言都显示）
    const universalOptions = [
      {
        name: safeT('shareOptions.more', 'More'),
        icon: Smartphone,
        color: 'bg-purple-500 hover:bg-purple-600',
        action: nativeShare,
        description: safeT('shareOptions.more', 'Use system share')
      }
    ];

    // 国内社媒选项
    const domesticOptions = [
      {
        name: '微博',
        icon: Flame,
        color: 'bg-red-500 hover:bg-red-600',
        action: shareToWeibo,
        description: safeT('shareOptions.weibo', '分享到微博')
      },
      {
        name: 'QQ空间',
        icon: Star,
        color: 'bg-yellow-500 hover:bg-yellow-600',
        action: shareToQzone,
        description: safeT('shareOptions.qzone', '分享到QQ空间')
      },
      {
        name: '微信',
        icon: MessageCircle,
        color: 'bg-green-500 hover:bg-green-600',
        action: shareToWechat,
        description: safeT('shareOptions.wechat', '分享到微信')
      }
    ];

    // 国际社媒选项
    const internationalOptions = [
      {
        name: 'Facebook',
        icon: Facebook,
        color: 'bg-blue-600 hover:bg-blue-700',
        action: shareToFacebook,
        description: safeT('shareOptions.facebook', 'Share to Facebook')
      },
      {
        name: 'Twitter/X',
        icon: Twitter,
        color: 'bg-black hover:bg-gray-800',
        action: shareToTwitter,
        description: safeT('shareOptions.twitter', 'Share to Twitter/X')
      },
      {
        name: 'Instagram',
        icon: Camera,
        color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        action: shareToInstagram,
        description: safeT('shareOptions.instagram', 'Copy link to share on Instagram')
      },
      {
        name: 'Pinterest',
        icon: Pin,
        color: 'bg-red-600 hover:bg-red-700',
        action: shareToPinterest,
        description: safeT('shareOptions.pinterest', 'Share to Pinterest')
      },
      {
        name: 'Reddit',
        icon: Hash,
        color: 'bg-orange-600 hover:bg-orange-700',
        action: shareToReddit,
        description: safeT('shareOptions.reddit', 'Share to Reddit')
      },
      {
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'bg-blue-700 hover:bg-blue-800',
        action: shareToLinkedIn,
        description: safeT('shareOptions.linkedin', 'Share to LinkedIn')
      },
      {
        name: 'WhatsApp',
        icon: MessageCircle,
        color: 'bg-green-600 hover:bg-green-700',
        action: shareToWhatsApp,
        description: safeT('shareOptions.whatsapp', 'Share to WhatsApp')
      },
      {
        name: 'Telegram',
        icon: Send,
        color: 'bg-blue-500 hover:bg-blue-600',
        action: shareToTelegram,
        description: safeT('shareOptions.telegram', 'Share to Telegram')
      }
    ];

    // 如果显示所有地区，返回所有选项
    if (showAllRegions) {
      return [
        ...domesticOptions,
        ...internationalOptions,
        ...universalOptions
      ];
    }

    // 根据语言返回对应地区的选项
    if (currentLanguage === 'zh') {
      return [...domesticOptions, ...universalOptions];
    }

    return [...internationalOptions, ...universalOptions];
  }, [currentLanguage, showAllRegions, safeT, shareToWeibo, shareToQzone, shareToWechat, shareToFacebook, shareToTwitter, shareToInstagram, shareToPinterest, shareToReddit, shareToLinkedIn, shareToWhatsApp, shareToTelegram, nativeShare, handleError]);

  const shareOptions = getShareOptions();

  // 安全渲染检查
  if (!isOpen || !item) {
    return null;
  }

  // 最终安全检查
  try {
    // 确保所有必要的数据都存在
    if (!shareOptions || shareOptions.length === 0) {
      console.warn('ShareModal: No share options available');
      return null;
    }

    // 确保翻译函数可用
    if (!safeT) {
      console.warn('ShareModal: Translation function not available');
      return null;
    }
  } catch (error) {
    handleError(error, 'final-safety-check');
    return null;
  }

  // 错误边界渲染
  const renderShareButton = (option, index) => {
    try {
      return (
        <motion.button
          key={option.name}
          onClick={() => {
            try {
              option.action();
            } catch (error) {
              handleError(error, `shareButton-${option.name}`);
              onClose();
            }
          }}
          className={`share-option-btn no-focus-outline ${option.color} text-white rounded-xl flex flex-col items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg`}
          style={{ height: '80px', padding: '12px' }} // 80px = 8 * 10
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={option.description}
        >
          {/* 安全的图标渲染 */}
          {typeof option.icon === 'string' ? (
            <span className="text-xl">{option.icon}</span>
          ) : (
            <option.icon size={20} className="text-white" />
          )}
          <span className="font-medium text-xs text-center leading-tight">{option.name}</span>
        </motion.button>
      );
    } catch (error) {
      handleError(error, `renderShareButton-${option.name}`);
      return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">分享壁纸</h3>
              </div>
              <button
                onClick={onClose}
                className="close-btn no-focus-outline hover:bg-gray-100 rounded-full transition-colors"
                style={{ width: '40px', height: '40px', padding: '8px' }} // 40px = 8 * 5
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 壁纸预览 */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.resolution} • {item.category}
                  </p>
                </div>
              </div>
            </div>

            {/* 分享选项 */}
            <div className="p-6">
              {/* 地区提示和切换按钮 */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {showAllRegions 
                    ? '🌐 ' + t('shareRegion.all')
                    : currentLanguage === 'zh' 
                      ? '🇨🇳 ' + t('shareRegion.domestic')
                      : '🌍 ' + t('shareRegion.international')
                  }
                </p>
                <button
                  onClick={() => setShowAllRegions(!showAllRegions)}
                  className="region-toggle-btn no-focus-outline text-xs text-blue-500 hover:text-blue-600 transition-colors"
                  style={{ height: '24px', padding: '0 8px' }} // 24px = 8 * 3
                >
                  {showAllRegions ? t('shareRegion.showRecommended') : t('shareRegion.showAll')}
                </button>
              </div>
              
              {/* 动态网格布局 */}
              <div className={`grid gap-3 ${
                shareOptions.length <= 4 
                  ? 'grid-cols-2 sm:grid-cols-4' 
                  : shareOptions.length <= 6
                  ? 'grid-cols-3 sm:grid-cols-3'
                  : shareOptions.length <= 8
                  ? 'grid-cols-4 sm:grid-cols-4'
                  : 'grid-cols-3 sm:grid-cols-4'
              }`}>
                {shareOptions.map((option, index) => renderShareButton(option, index)).filter(Boolean)}
              </div>

              {/* 复制链接 */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 truncate">
                      {getShareData()?.url}
                    </p>
                  </div>
                  <motion.button
                    onClick={copyLink}
                    className={`copy-link-btn no-focus-outline rounded-lg font-medium text-sm transition-all duration-200 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ height: '48px', padding: '0 16px' }} // 48px = 8 * 6
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>已复制</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        <span>复制</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* 提示信息 */}
              {copied && (
                <motion.div
                  className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-green-700 text-center">
                    🎉 链接已复制！可以粘贴到微信或其他应用分享
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
