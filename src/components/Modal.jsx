import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Share2, Maximize2, AlertCircle } from 'lucide-react';
import { getHighResUrl } from '../utils/imageUtils';
import LikeButton from './LikeButton';
import LikeCounter from './LikeCounter';
import ErrorBoundary from './ErrorBoundary';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';

/**
 * 模态框组件 - 优化性能，防止卡死
 */
const Modal = memo(({ isOpen, item, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null); // 添加图片尺寸状态

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
      console.log('Modal: Item changed, resetting states', item.id);
      setImageLoaded(false);
      setImageError(false);
      setIsDownloading(false);
      setImageDimensions(null);
    }
  }, [item]);

  // 清理状态当组件卸载时
  useEffect(() => {
    return () => {
      console.log('Modal: Cleanup on unmount');
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

  // 下载功能 - 防止卡死
  const handleDownload = useCallback(async (url, title) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // 使用fetch获取图片数据，然后创建blob下载
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });
      
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

  // 分享功能 - 简化处理
  const handleShare = useCallback(async () => {
    if (!item) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          url: item.url
        });
      } else {
        await navigator.clipboard.writeText(item.url);
      }
    } catch (error) {
      console.log('分享功能不可用');
    }
  }, [item]);

  // 如果没有item，直接返回null
  if (!item) return null;

  const isVideo = item.type === 'video';

  // 获取分类中文名
  const getCategoryName = (category) => {
    const names = {
      fantasy: '奇幻', desktop: '桌面', mobile: '手机',
      seasonal: '季节', '4k': '4K', live: '动态'
    };
    return names[category] || category;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative max-w-6xl max-h-[95vh] w-full bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pixiv风格主要内容区域 */}
            <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
              {/* 左侧图片区域 */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
                {!imageError ? (
                  <>
                    {isVideo ? (
                      <video
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                        src={getHighResUrl(item.url)}
                        controls
                        muted
                        playsInline
                        onLoadedData={() => {
                          console.log('Video loaded');
                          setImageLoaded(true);
                        }}
                        onError={() => {
                          console.log('Video error');
                          setImageError(true);
                        }}
                      />
                    ) : (
                      <img
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                        src={getHighResUrl(item.url)}
                        alt={item.title}
                        onLoad={() => {
                          console.log('Image loaded');
                          setImageLoaded(true);
                        }}
                        onError={() => {
                          console.log('Image error');
                          setImageError(true);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                      <div className="text-sm">加载失败</div>
                    </div>
                  </div>
                )}

                {/* Pixiv风格加载状态 */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-sm text-gray-600">加载中...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧信息区域 - Pixiv风格 */}
              <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col">
                {/* 作品标题区域 */}
                <div className="relative p-4 sm:p-6 border-b border-gray-100">
                  {/* 关闭按钮 - 移到标题区域内 */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shadow-sm group"
                    title="关闭 (ESC)"
                  >
                    <X className="w-4 h-4" />
                    {/* 键盘快捷键提示 */}
                    <span className="absolute -bottom-8 right-0 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ESC
                    </span>
                  </button>

                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight pr-12 sm:pr-14">
                    {item.title}
                  </h1>
                  
                  {/* Pixiv风格作品信息 */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>{imageDimensions || item.resolution || '高清'}</span>
                    <span>•</span>
                    <span>{item.format?.toUpperCase() || 'JPG'}</span>
                    <span>•</span>
                    <span>{isVideo ? '视频' : '图片'}</span>
                  </div>

                  {/* Pixiv风格操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(getHighResUrl(item.url), item.title)}
                      disabled={isDownloading}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md font-medium transition-colors ${
                        isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">保存中...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="text-sm">保存</span>
                        </>
                      )}
                    </button>

                    <ErrorBoundary>
                      <LikeButton 
                        wallpaperId={item.id}
                        size="small"
                        showCount={false}
                      />
                    </ErrorBoundary>

                    <button
                      onClick={handleShare}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 标签区域 - Pixiv风格 */}
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* 分类标签 */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors">
                      #{getCategoryName(item.category)}
                    </span>
                    
                    {/* 自定义标签 */}
                    {item.tags && item.tags.slice(0, 6).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 作品详情 - Pixiv风格 */}
                <div className="p-6 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">作品详情</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>发布时间</span>
                      <span>{new Date().toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>文件格式</span>
                      <span>{item.format?.toUpperCase() || 'JPG'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>分辨率</span>
                      <span>{imageDimensions || item.resolution || '高分辨率'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>来源</span>
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {item.source === 'xyz' ? 'labubuwallpaper.xyz' : 'labubuwallpaper.com'}
                      </span>
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
                    <span>ID: {item.id || Math.floor(Math.random() * 100000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

export default Modal;
