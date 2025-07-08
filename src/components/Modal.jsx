import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Share2, Maximize2, AlertCircle, Search } from 'lucide-react';
import { getHighResUrl, getThumbnailUrl } from '../utils/imageUtils';
import LikeButton from './LikeButton';
import LikeCounter from './LikeCounter';
import ErrorBoundary from './ErrorBoundary';
import ShareModal from './ShareModal';
import ShareModalErrorBoundary from './ShareModalErrorBoundary';
import DownloadFormatSelector from './DownloadFormatSelector';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { useTagTranslation } from '../hooks/useTagTranslation';
import { useTitleTranslation } from '../hooks/useTitleTranslation';

/**
 * 模态框组件 - 移动端优化版本
 */
const Modal = memo(({ isOpen, item, onClose, onTagClick }) => {
  const { t, currentLanguage } = useLanguage();
  const { translateTag } = useTagTranslation();
  const { translateTitle } = useTitleTranslation();
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

  // 复制到剪贴板函数
  const copyToClipboard = useCallback(async (text, message = '链接已复制到剪贴板') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      alert(message);
      console.log('📋 链接已复制:', text);
    } catch (error) {
      console.error('复制失败:', error);
      alert(`复制失败，请手动复制链接:\n${text}`);
    }
  }, []);

  // 高级下载功能 - 解决CORS问题，真正触发浏览器下载
  const handleDownload = useCallback(async (url, title) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    // 安全的文件名处理
            const cleanTitle = (title || 'nexwallpaper').replace(/[<>:"/\\|?*]/g, '_');
    const fileExtension = item?.format?.toLowerCase() || (item?.type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${cleanTitle}.${fileExtension}`;
    
    // 使用代理URL
    const proxyUrl = url.replace('https://labubuwallpaper.com', '/download-proxy');

    console.log('🚀 开始高级下载:', { url, proxyUrl, fileName, itemType: item?.type });
    
    try {
      // 方案1：使用fetch + Blob的方式，通过代理解决CORS问题
      console.log('📥 尝试Fetch+Blob代理下载...');
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        // mode: 'cors' 在同源请求中不再需要
        cache: 'no-cache',
        headers: {
          'Accept': item?.type === 'video' ? 'video/*' : 'image/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 获取文件数据
      const blob = await response.blob();
      console.log('📦 文件数据获取成功:', { 
        size: blob.size, 
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024) 
      });
      
      // 创建Blob URL并下载
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // 添加到DOM，点击，然后延迟移除
      document.body.appendChild(link);
      link.click();
      
      // 延迟清理，确保下载被触发
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        console.log('🧹 Modal Blob URL和链接已清理');
      }, 100);
      
      console.log('✅ Fetch+Blob下载完成');
      
      // 记录下载统计
      if (item?.id) {
        recordClick(item.id, 'download');
      }
      
    } catch (fetchError) {
      console.warn('⚠️ Fetch下载失败，尝试直链下载:', fetchError.message);
      
      try {
        // 方案2：降级到直链下载 (也使用代理)
        console.log('📥 尝试直链代理下载...');
        
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = fileName;
        link.style.display = 'none';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ 直链下载完成');
        
        // 记录下载统计
        if (item?.id) {
          recordClick(item.id, 'download');
        }
        
        // 短暂延时后检查是否需要显示指导
        setTimeout(() => {
          console.log('💡 如果没有开始下载，浏览器可能阻止了跨域下载');
        }, 2000);
        
      } catch (directError) {
        console.warn('⚠️ 直链下载也失败，显示用户指导:', directError.message);
        
        // 方案3：最终降级方案 - 用户指导 (使用原始URL)
        const shouldOpenInNewTab = confirm(`自动下载失败，可能由于浏览器安全限制。\n\n请选择下载方式：\n✅ 确定：在新标签页打开文件，然后右键保存\n❌ 取消：复制文件链接，手动访问下载`);
        
        if (shouldOpenInNewTab) {
          try {
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              console.log('✅ 新窗口已打开，用户可以手动保存');
              alert('💡 温馨提示：在新页面中右键点击文件选择"另存为"即可下载');
            } else {
              throw new Error('弹窗被阻止');
            }
          } catch (windowError) {
            console.error('❌ 无法打开新窗口:', windowError.message);
            copyToClipboard(url, '无法打开新窗口，链接已复制到剪贴板。请手动访问并下载。');
          }
        } else {
          // 用户选择复制链接
          copyToClipboard(url, '链接已复制到剪贴板。请手动访问并右键保存文件。');
        }
        
        // 记录下载统计
        if (item?.id) {
          recordClick(item.id, 'download');
        }
      }
    } finally {
      // 重置下载状态
      setTimeout(() => setIsDownloading(false), 1000);
    }
  }, [isDownloading, item, recordClick, copyToClipboard]);

  // 标签点击处理
  const handleTagClick = useCallback((tag) => {
    if (onTagClick) {
      onTagClick(tag);
      onClose(); // 关闭详情页，返回主页面查看搜索结果
    }
  }, [onTagClick, onClose]);

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
                  ? 'top-3 right-3 z-50' 
                  : 'top-4 right-4 z-10'
              } text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg border border-gray-200 group flex items-center justify-center`}
              style={{ 
                width: isMobile ? '32px' : '40px',  // 32px = 8*4, 40px = 8*5
                height: isMobile ? '32px' : '40px'
              }}
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
                        alt={translateTitle(item.title)}
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
                    {translateTitle(item.title)}
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
                  <div className="flex items-center gap-2 justify-start">
                    <DownloadFormatSelector
                      item={item}
                      isDownloading={isDownloading}
                      onDownload={(url, title) => handleDownload(url, title)}
                      isMobile={isMobile}
                      className="flex-1"
                    />
                    
                    <ErrorBoundary>
                      <LikeButton 
                        wallpaperId={item.id}
                        size={isMobile ? "small" : "medium"}
                        showCount={false}
                        square={true} // 设置为正方形
                      />
                    </ErrorBoundary>

                    <button
                      onClick={handleShare}
                      className="share-btn no-focus-outline border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
                      style={{ 
                        height: isMobile ? '32px' : '40px',
                        width: isMobile ? '32px' : '40px',
                        padding: '0'
                      }}
                      title={t('buttons.share')}
                    >
                      <Share2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  </div>
                </div>

                {/* 标签区域 - Pixiv风格 */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-900">{t('tags')}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Search className="w-3 h-3" />
                      <span>{t('clickToSearch')}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* 分类标签 */}
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-200 cursor-pointer transition-all duration-200 hover:scale-105"
                      onClick={() => handleTagClick(getCategoryName(item.category))}
                      title={`${t('search')} ${getCategoryName(item.category)} ${t('wallpapers')}`}
                    >
                      #{getCategoryName(item.category)}
                    </span>
                    
                    {/* 自定义标签 */}
                    {item.tags && item.tags.slice(0, 6).filter(tag => tag && tag.trim()).map((tag, index) => {
                      const displayTag = translateTag(tag);
                      
                      return (
                        <span
                          key={`tag-${tag}-${index}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 hover:bg-gray-200 cursor-pointer transition-all duration-200 hover:scale-105"
                          onClick={() => handleTagClick(tag)}
                          title={`${t('search')} ${displayTag} ${t('wallpapers')}`}
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
    <ShareModalErrorBoundary onClose={() => setIsShareModalOpen(false)}>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={item}
      />
    </ShareModalErrorBoundary>
    </>
  );
});

Modal.displayName = 'Modal';

export default Modal;
