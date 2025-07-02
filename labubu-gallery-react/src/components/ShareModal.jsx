import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check } from 'lucide-react';

/**
 * 分享模态框组件 - 支持多平台分享
 */
const ShareModal = ({ isOpen, onClose, item }) => {
  const [copied, setCopied] = useState(false);

  // 构建分享数据
  const getShareData = useCallback(() => {
    if (!item) return null;

    const shareUrl = `${window.location.origin}?wallpaper=${item.id}`;
    const shareTitle = `${item.title} - Labubu壁纸画廊`;
    const shareText = `发现了一张超美的Labubu壁纸：${item.title}`;
    const hashtags = ['Labubu', '壁纸', '可爱', item.category];

    return {
      url: shareUrl,
      title: shareTitle,
      text: shareText,
      hashtags: hashtags.join(',')
    };
  }, [item]);

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
      prompt('请复制以下链接分享到微信：', shareData.url);
      onClose();
    }
  }, [getShareData, onClose]);

  // Twitter分享
  const shareToTwitter = useCallback(() => {
    const shareData = getShareData();
    if (!shareData) return;

    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', shareData.text);
    twitterUrl.searchParams.set('url', shareData.url);
    twitterUrl.searchParams.set('hashtags', shareData.hashtags);
    
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
      prompt('请复制以下链接：', shareData.url);
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

  const shareOptions = [
    {
      name: '微博',
      icon: '🔥',
      color: 'bg-red-500 hover:bg-red-600',
      action: shareToWeibo,
      description: '分享到新浪微博'
    },
    {
      name: 'QQ空间',
      icon: '🌟',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: shareToQzone,
      description: '分享到QQ空间'
    },
    {
      name: '微信',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      action: shareToWechat,
      description: '复制链接分享到微信'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: shareToTwitter,
      description: '分享到Twitter'
    },
    {
      name: '更多',
      icon: '📱',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: nativeShare,
      description: '使用系统分享'
    }
  ];

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
              <div className="grid grid-cols-2 gap-3">
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.name}
                    onClick={option.action}
                    className={`${option.color} text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-sm">{option.name}</span>
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
