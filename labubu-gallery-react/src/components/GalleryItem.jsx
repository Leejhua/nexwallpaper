import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Pause } from 'lucide-react';
import { getThumbnailUrl, getHighResUrl } from '../utils/imageUtils';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import PopularityBadge from './PopularityBadge';
import HoverInfoOverlay from './HoverInfoOverlay';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 画廊项目组件 - 单个壁纸/视频卡片
 */
const GalleryItem = ({ item, onPreview, index }) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHoverInfo, setShowHoverInfo] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1); // 存储图片宽高比
  const videoRef = useRef(null);
  
  // 点击统计
  const { recordClick } = useClickStatsContext();

  // 下载功能 - 优化事件处理（移到前面避免初始化顺序问题）
  const handleDownload = useCallback(async (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    e.preventDefault(); // 阻止默认行为
    
    // 记录下载统计
    recordClick(item.id, 'download');
    
    try {
      // 使用高清原图进行下载
      const downloadUrl = getHighResUrl(item.url);
      
      // 尝试使用fetch下载
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${item.title}.${item.format || 'jpg'}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error('Fetch failed');
      }
    } catch (error) {
      console.error('Download failed, trying fallback:', error);
      // 降级方案
      try {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `${item.title}.${item.format || 'jpg'}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    }
  }, [item, recordClick]);

  // 处理快速下载事件
  useEffect(() => {
    const handleQuickDownload = (e) => {
      if (e.detail.item.id === item.id) {
        // 创建模拟事件对象
        const mockEvent = {
          stopPropagation: () => {},
          preventDefault: () => {}
        };
        handleDownload(mockEvent);
      }
    };

    window.addEventListener('quickDownload', handleQuickDownload);
    return () => {
      window.removeEventListener('quickDownload', handleQuickDownload);
    };
  }, [item.id, handleDownload]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  // 处理图片比例检测
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const ratio = img.naturalWidth / img.naturalHeight;
    setAspectRatio(ratio);
    setImageLoaded(true);
  }, []);

  // 处理视频比例检测
  const handleVideoLoad = useCallback((e) => {
    const video = e.target;
    const ratio = video.videoWidth / video.videoHeight;
    setAspectRatio(ratio);
    setImageLoaded(true);
  }, []);

  const isVideo = item.type === 'video';

  // 处理视频悬停播放 - 移动到合并的handleMouseEnter中

  // 点击卡片打开详情 - 优化事件处理
  const handleCardClick = useCallback((e) => {
    // 记录点击统计
    recordClick(item.id, 'view');
    onPreview(item);
  }, [item, onPreview, recordClick]);

  // 悬浮处理函数 - 合并视频播放和信息显示逻辑
  const handleMouseEnter = useCallback(async () => {
    setIsHovered(true);
    
    // 处理视频悬停播放
    if (isVideo && videoRef.current && imageLoaded) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        // 视频自动播放失败，忽略错误
      }
    }
    
    // 延迟显示信息，避免快速划过时闪烁
    const timer = setTimeout(() => {
      setShowHoverInfo(true);
    }, 200);
    setHoverTimer(timer);
  }, [isVideo, imageLoaded]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowHoverInfo(false);
    
    // 处理视频暂停
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // 重置到开始位置
      setIsPlaying(false);
    }
    
    // 清理定时器
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  }, [hoverTimer, isVideo]);

  // 获取分类颜色
  const getCategoryColor = (category) => {
    const colors = {
      fantasy: 'from-purple-500 to-pink-500',
      desktop: 'from-blue-500 to-cyan-500',
      mobile: 'from-green-500 to-teal-500',
      seasonal: 'from-orange-500 to-red-500',
      '4k': 'from-indigo-500 to-purple-500',
      live: 'from-pink-500 to-rose-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  // 获取分类中文名
  // 获取分类名称
  const getCategoryName = (category) => {
    return t(`categories.${category}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`group relative pixiv-card cursor-pointer gallery-item optimize-rendering ${
        isVideo ? 'video-card' : ''
      } ${isPlaying ? 'video-playing' : ''}`}
      whileHover={{ y: -2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* 图片/视频容器 - 现在占满整个卡片，自适应图片尺寸 */}
      <div 
        className="relative overflow-hidden rounded-lg shadow-sm w-full bg-gray-50"
        style={{ 
          minHeight: imageLoaded ? 'auto' : '200px'
        }}
      >
        {!imageError ? (
          <>
            {isVideo ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={isVideo ? item.url : getThumbnailUrl(item.url)}
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                  preload="metadata"
                  muted
                  loop
                  playsInline
                  onLoadedData={handleVideoLoad}
                  onError={() => setImageError(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* 播放状态指示器 */}
                {isPlaying && (
                  <div className="absolute top-3 left-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      {t('live')}
                    </motion.div>
                  </div>
                )}

                {/* 悬停提示 */}
                {!isHovered && imageLoaded && !isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {t('hoverToPlay')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={getThumbnailUrl(item.url)}
                alt={item.title}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={() => setImageError(true)}
              />
            )}
          </>
        ) : (
          <div 
            className="w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
            style={{ minHeight: '200px' }}
          >
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">{isVideo ? '🎬' : '🖼️'}</div>
              <div className="text-sm">{t('error')}</div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {!imageLoaded && !imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            style={{ minHeight: '200px' }}
          >
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Pixiv风格悬停遮罩 */}
        <div 
          className="absolute inset-0 transition-all duration-200"
          style={{
            background: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
          }}
        />

        {/* 原有的Pixiv风格下载按钮已删除，现在使用悬浮层中的快速下载按钮 */}

        {/* 热度标签 */}
        <PopularityBadge 
          wallpaperId={item.id}
          position="top-right"
          variant="fire"
        />
        
        {/* 喜欢标签 */}
        <PopularityBadge 
          wallpaperId={item.id}
          position="top-left"
          variant="likes"
        />

        {/* 悬浮信息层 */}
        <AnimatePresence>
          {showHoverInfo && (
            <HoverInfoOverlay 
              item={item}
              isVisible={showHoverInfo}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Pixiv风格信息区域 - 隐藏，改为悬浮显示 */}
      <div style={{ display: 'none' }}>
        {/* 原有信息内容保留但隐藏 */}
      </div>
    </motion.div>
  );
};

export default GalleryItem;
