import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Share2, Maximize2, AlertCircle } from 'lucide-react';
import { getHighResUrl, getThumbnailUrl } from '../utils/imageUtils';
import LikeButton from './LikeButton';
import LikeCounter from './LikeCounter';
import ErrorBoundary from './ErrorBoundary';
import ShareModal from './ShareModal';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 模态框组件 - 移动端优化版本
 */
const Modal = memo(({ isOpen, item, onClose }) => {
  const { t, currentLanguage } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取统计功能 - 添加错误处理
  let recordClick, getStats;
  try {
    const statsContext = useClickStatsContext();
    recordClick = statsContext.recordClick;
    getStats = statsContext.getStats;
  } catch (error) {
    console.warn('Stats context not available:', error);
    recordClick = () => {};
    getStats = () => ({});
  }

  // 重置状态当item变化时
  useEffect(() => {
    if (item) {
      setImageLoaded(false);
      setImageError(false);
      setIsDownloading(false);
      setImageDimensions(null);
    }
  }, [item]);

  // 清理状态当组件卸载时
  useEffect(() => {
    return () => {
      setImageLoaded(false);
      setImageError(false);
      setIsDownloading(false);
      setImageDimensions(null);
    };
  }, []);

  // 获取图片真实尺寸
  const getImageDimensions = useCallback((imgElement) => {
    if (imgElement && imgElement.naturalWidth && imgElement.naturalHeight) {
      const width = imgElement.naturalWidth;
      const height = imgElement.naturalHeight;
      setImageDimensions(`${width}x${height}`);
    }
  }, []);

  // 获取视频真实尺寸
  const getVideoDimensions = useCallback((videoElement) => {
    if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      setImageDimensions(`${width}x${height}`);
    }
  }, []);

  // 键盘事件处理 - 优化性能
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 下载功能 - 移动端优化，添加超时处理
  const handleDownload = useCallback(async (url, title) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // 创建超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      // 使用fetch获取图片数据，然后创建blob下载
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title || 'labubu-wallpaper'}.${item?.format || 'jpg'}`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      // 记录下载统计
      if (item?.id) {
        recordClick(item.id, 'download');
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      // 降级方案：直接使用URL下载
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || 'labubu-wallpaper'}.${item?.format || 'jpg'}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 记录下载统计
        if (item?.id) {
          recordClick(item.id, 'download');
        }
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        // 最后的降级方案：打开新窗口
        window.open(url, '_blank', 'noopener,noreferrer');
        
        // 记录下载统计（即使是打开新窗口）
        if (item?.id) {
          recordClick(item.id, 'download');
        }
      }
    } finally {
      setTimeout(() => setIsDownloading(false), 1500); // 稍微延长重置时间
    }
  }, [isDownloading, item]);

  // 分享功能 - 打开分享模态框
  const handleShare = useCallback(() => {
    if (!item) return;
    setIsShareModalOpen(true);
  }, [item]);

  // 如果没有item，直接返回null
  if (!item) return null;

  const isVideo = item.type === 'video';

  // 获取分类中文名
  // 获取分类名称
  const getCategoryName = (category) => {
    return t(`categories.${category}`);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          {/* Pixiv风格模态框容器 */}
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative max-w-6xl max-h-[95vh] w-full bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 - 在详情页内部完整展示，不遮挡图片 */}
            <button
              onClick={onClose}
              className={`close-btn no-focus-outline absolute ${
                isMobile 
                  ? 'top-3 right-3 z-50 w-8 h-8' 
                  : 'top-4 right-4 z-10 w-10 h-10'
              } text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg border border-gray-200 group flex items-center justify-center`}
              title={t('buttons.close')}
            >
              <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {/* 键盘快捷键提示 - 桌面端显示 */}
              {!isMobile && (
                <span className="absolute -bottom-10 right-0 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ESC
                </span>
              )}
            </button>
            {/* Pixiv风格主要内容区域 - 移动端优化 */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} h-full max-h-[95vh]`}>
              {/* 左侧图片区域 - 为关闭按钮预留空间 */}
              <div className={`flex-1 bg-gray-50 flex items-center justify-center relative ${
                isMobile ? 'p-6 pt-12' : 'p-6 pt-16'
              }`}>
                {!imageError ? (
                  <>
                    {isVideo ? (
                      <video
                        className={`max-w-full ${isMobile ? 'max-h-[50vh]' : 'max-h-[70vh]'} object-contain rounded-lg shadow-lg`}
                        src={isMobile ? getThumbnailUrl(item.url) : getHighResUrl(item.url)}
                        controls
                        muted
                        playsInline
                        preload={isMobile ? "metadata" : "auto"}
                        onLoadedData={(e) => {
                          setImageLoaded(true);
                          getVideoDimensions(e.target);
                        }}
                        onError={() => {
                          setImageError(true);
                        }}
                      />
                    ) : (
                      <img
                        className={`max-w-full ${isMobile ? 'max-h-[50vh]' : 'max-h-[70vh]'} object-contain rounded-lg shadow-lg`}
                        src={isMobile ? getThumbnailUrl(item.url) : getHighResUrl(item.url)}
                        alt={item.title}
                        onLoad={(e) => {
                          setImageLoaded(true);
                          getImageDimensions(e.target);
                        }}
                        onError={() => {
                          setImageError(true);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                      <div className="text-sm">{t('error')}</div>
                    </div>
                  </div>
                )}

                {/* Pixiv风格加载状态 */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-sm text-gray-600">{t('loading')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧信息区域 - 移动端优化 */}
              <div className={`w-full ${isMobile ? '' : 'lg:w-80'} bg-white ${isMobile ? '' : 'border-l border-gray-200'} flex flex-col ${isMobile ? 'max-h-[40vh] overflow-y-auto' : ''}`}>
                {/* 作品标题区域 */}
                <div className="relative p-4 sm:p-6 border-b border-gray-100">
                  <h1 className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-bold text-gray-900 mb-3 leading-tight ${isMobile ? 'pr-8' : 'pr-4'}`}>
                    {item.title}
                  </h1>
                  
                  {/* Pixiv风格作品信息 */}
                  <div className={`flex items-center gap-4 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-4 flex-wrap`}>
                    <span>{imageDimensions || item.resolution || t('highQuality')}</span>
                    <span>•</span>
                    <span>{item.format?.toUpperCase() || 'JPG'}</span>
                    <span>•</span>
                    <span>{isVideo ? t('video') : t('image')}</span>
                  </div>

                  {/* Pixiv风格操作按钮 - 移动端优化 */}
                  <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                    <button
                      onClick={() => handleDownload(getHighResUrl(item.url), item.title)}
                      disabled={isDownloading}
                      className={`download-btn no-focus-outline flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md font-medium transition-colors ${isMobile ? 'text-xs px-2 py-1.5' : ''} ${
                        isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{t('downloading')}</span>
                        </>
                      ) : (
                        <>
                          <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{t('buttons.download')}</span>
                        </>
                      )}
                    </button>

                    <ErrorBoundary>
                      <LikeButton 
                        wallpaperId={item.id}
                        size={isMobile ? "small" : "medium"}
                        showCount={false}
                      />
                    </ErrorBoundary>

                    <button
                      onClick={handleShare}
                      className={`share-btn no-focus-outline px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors ${isMobile ? 'px-2 py-1.5' : ''}`}
                    >
                      <Share2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  </div>
                </div>

                {/* 标签区域 - Pixiv风格 */}
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{t('tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* 分类标签 */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors">
                      #{getCategoryName(item.category)}
                    </span>
                    
                    {/* 自定义标签 */}
                    {item.tags && item.tags.slice(0, 6).filter(tag => tag && tag.trim()).map((tag, index) => {
                      // 根据当前语言显示对应的标签文本
                      let displayTag = tag;
                      
                      if (currentLanguage === 'zh') {
                        // 中文环境：直接显示中文标签
                        displayTag = tag;
                      } else {
                        // 英文或西班牙语环境：如果有翻译则显示翻译，否则显示原文
                        const translation = t(`tagTranslations.${tag}`);
                        displayTag = translation !== `tagTranslations.${tag}` ? translation : tag;
                      }
                      
                      return (
                        <span
                          key={`tag-${tag}-${index}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          #{displayTag}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 作品详情 - Pixiv风格 */}
                <div className="p-6 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{t('details')}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>{t('publishTime')}</span>
                      <span>{new Date().toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'es' ? 'es-ES' : 'en-US')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('fileFormat')}</span>
                      <span>{item.format?.toUpperCase() || 'JPG'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('resolution')}</span>
                      <span>{imageDimensions || item.resolution || t('highResolution')}</span>
                    </div>
                  </div>
                </div>

                {/* 底部统计信息 - Pixiv风格 */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <ErrorBoundary>
                        <LikeCounter 
                          wallpaperId={item.id}
                          variant="inline"
                          showTrend={true}
                        />
                      </ErrorBoundary>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {getStats(item.id).actions?.download || 0}
                      </span>
                    </div>
                    <span>{t('id')}: {item.id || Math.floor(Math.random() * 100000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* 分享模态框 */}
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      item={item}
    />
    </>
  );
});

Modal.displayName = 'Modal';

export default Modal;
