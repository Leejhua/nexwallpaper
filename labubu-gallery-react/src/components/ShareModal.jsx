import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateShareMetadata, optimizeForPlatform } from '../utils/shareUtils';

/**
 * 分享模态框组件 - 支持多平台分享
 */
const ShareModal = ({ isOpen, onClose, item }) => {
  const { t, currentLanguage } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false); // 新增状态

  // 构建分享数据
  const getShareData = useCallback(() => {
    if (!item) return null;
    return generateShareMetadata(item, t, currentLanguage);
  }, [item, t, currentLanguage]);

  // 微博分享
  const shareToWeibo = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const weiboUrl = new URL('https://service.weibo.com/share/share.php');
    weiboUrl.searchParams.set('url', shareData.url);
    weiboUrl.searchParams.set('title', `${shareData.text} ${shareData.url}`);
    weiboUrl.searchParams.set('pic', item.url); // 分享图片
    
    window.open(weiboUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, item, onClose]);

  // QQ空间分享
  const shareToQzone = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const qzoneUrl = new URL('https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey');
    qzoneUrl.searchParams.set('url', shareData.url);
    qzoneUrl.searchParams.set('title', shareData.title);
    qzoneUrl.searchParams.set('summary', shareData.text);
    qzoneUrl.searchParams.set('pics', item.url);
    
    window.open(qzoneUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, item, onClose]);

  // 微信分享 (复制链接)
  const shareToWechat = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // 不关闭模态框，让用户知道链接已复制
    } catch (error) {
      // 降级处理
      prompt(t('copyLinkToWechat'), shareData.url);
      onClose();
    }
  }, [getShareData, onClose]);

  // Facebook分享
  const shareToFacebook = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
    facebookUrl.searchParams.set('u', shareData.url);
    facebookUrl.searchParams.set('quote', shareData.text);
    
    window.open(facebookUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, onClose]);

  // Pinterest分享
  const shareToPinterest = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const pinterestUrl = new URL('https://pinterest.com/pin/create/button/');
    pinterestUrl.searchParams.set('url', shareData.url);
    pinterestUrl.searchParams.set('media', item.url);
    pinterestUrl.searchParams.set('description', shareData.text);
    
    window.open(pinterestUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, item, onClose]);

  // Reddit分享
  const shareToReddit = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const redditUrl = new URL('https://reddit.com/submit');
    redditUrl.searchParams.set('url', shareData.url);
    redditUrl.searchParams.set('title', shareData.title);
    
    window.open(redditUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, onClose]);

  // LinkedIn分享
  const shareToLinkedIn = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const linkedinUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedinUrl.searchParams.set('url', shareData.url);
    
    window.open(linkedinUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, onClose]);

  // WhatsApp分享
  const shareToWhatsApp = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const whatsappUrl = new URL('https://wa.me/');
    whatsappUrl.searchParams.set('text', `${shareData.text} ${shareData.url}`);
    
    window.open(whatsappUrl.toString(), '_blank');
    onClose();
  }, [getShareData, onClose]);

  // Instagram分享 (复制链接，因为Instagram不支持直接URL分享)
  const shareToInstagram = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      // 提示用户已复制，可以粘贴到Instagram
      alert(t('instagramShareTip'));
    } catch (error) {
      prompt(t('copyLinkForInstagram'), `${shareData.text} ${shareData.url}`);
    }
  }, [getShareData, t]);

  // Telegram分享
  const shareToTelegram = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const telegramUrl = new URL('https://t.me/share/url');
    telegramUrl.searchParams.set('url', shareData.url);
    telegramUrl.searchParams.set('text', shareData.text);
    
    window.open(telegramUrl.toString(), '_blank');
    onClose();
  }, [getShareData, onClose]);

  // Twitter分享
  const shareToTwitter = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const optimized = optimizeForPlatform(shareData, 'twitter');
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', optimized.text);
    twitterUrl.searchParams.set('hashtags', optimized.hashtags);
    
    window.open(twitterUrl.toString(), '_blank', 'width=600,height=400');
    onClose();
  }, [getShareData, onClose]);

  // 复制链接
  const copyLink = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      prompt(t('copyLink'), shareData.url);
    }
  }, [getShareData]);

  // 原生分享
  const nativeShare = useCallback(async () => {
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
  }, [getShareData, copyLink, onClose]);

  if (!item) return null;

  // 根据当前语言动态生成分享选项
  const getShareOptions = useCallback(() => {
    // 通用选项（所有语言都显示）
    const universalOptions = [
      {
        name: t('shareOptions.more'),
        icon: '📱',
        color: 'bg-purple-500 hover:bg-purple-600',
        action: nativeShare,
        description: t('shareOptions.more')
      }
    ];

    // 国内社媒选项
    const domesticOptions = [
      {
        name: '微博',
        icon: '🔥',
        color: 'bg-red-500 hover:bg-red-600',
        action: shareToWeibo,
        description: t('shareOptions.weibo')
      },
      {
        name: 'QQ空间',
        icon: '🌟',
        color: 'bg-yellow-500 hover:bg-yellow-600',
        action: shareToQzone,
        description: t('shareOptions.qzone')
      },
      {
        name: '微信',
        icon: '💚',
        color: 'bg-green-500 hover:bg-green-600',
        action: shareToWechat,
        description: t('shareOptions.wechat')
      }
    ];

    // 国际社媒选项
    const internationalOptions = [
      {
        name: 'Facebook',
        icon: '📘',
        color: 'bg-blue-600 hover:bg-blue-700',
        action: shareToFacebook,
        description: t('shareOptions.facebook')
      },
      {
        name: 'Twitter/X',
        icon: '🐦',
        color: 'bg-black hover:bg-gray-800',
        action: shareToTwitter,
        description: t('shareOptions.twitter')
      },
      {
        name: 'Instagram',
        icon: '📷',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        action: shareToInstagram,
        description: t('shareOptions.instagram')
      },
      {
        name: 'Pinterest',
        icon: '📌',
        color: 'bg-red-600 hover:bg-red-700',
        action: shareToPinterest,
        description: t('shareOptions.pinterest')
      },
      {
        name: 'Reddit',
        icon: '🤖',
        color: 'bg-orange-600 hover:bg-orange-700',
        action: shareToReddit,
        description: t('shareOptions.reddit')
      },
      {
        name: 'LinkedIn',
        icon: '💼',
        color: 'bg-blue-700 hover:bg-blue-800',
        action: shareToLinkedIn,
        description: t('shareOptions.linkedin')
      },
      {
        name: 'WhatsApp',
        icon: '💬',
        color: 'bg-green-600 hover:bg-green-700',
        action: shareToWhatsApp,
        description: t('shareOptions.whatsapp')
      },
      {
        name: 'Telegram',
        icon: '✈️',
        color: 'bg-blue-500 hover:bg-blue-600',
        action: shareToTelegram,
        description: t('shareOptions.telegram')
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
  }, [currentLanguage, showAllRegions, t, shareToWeibo, shareToQzone, shareToWechat, shareToFacebook, shareToTwitter, shareToInstagram, shareToPinterest, shareToReddit, shareToLinkedIn, shareToWhatsApp, shareToTelegram, nativeShare]);

  const shareOptions = getShareOptions();

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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                  className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
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
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.name}
                    onClick={option.action}
                    className={`${option.color} text-white p-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title={option.description}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="font-medium text-xs text-center leading-tight">{option.name}</span>
                  </motion.button>
                ))}
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
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
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
