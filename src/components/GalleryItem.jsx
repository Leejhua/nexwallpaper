import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Pause, Video, Image } from 'lucide-react';
import { getHighQualityUrl, getThumbnailUrl, handleComplexCdnUrl } from '../utils/imageUtils';
import { getOptimizedThumbnailUrl, getOptimizedPreviewUrl, getOptimizedBackupUrls } from '../utils/imageUtils-optimized';
import { getUrlByPurpose, generateFallbackUrls, fixUrlEncoding } from '../utils/imageUtils-fallback';
import { isId8, getId8UrlByPurpose, initId8Fix } from '../utils/imageUtils-id8-fix';
import { getCompleteVideoUrlChain, getVideoPreloadStrategy, isProblematicVideoUrl } from '../utils/videoUtils';
import { mobileDownload, detectMobileEnvironment, createDownloadStatus } from '../utils/mobileDownloader';
import { useVideoAutoPlay } from '../hooks/useIntersectionObserver';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import PopularityBadge from './PopularityBadge';
import HoverInfoOverlay from './HoverInfoOverlay';
import SkeletonCard from './SkeletonCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useTitleTranslation } from '../hooks/useTitleTranslation';
import { useImageLoader } from '../hooks/useImageLoader';
import { useInViewport } from '../hooks/useLazyLoad';
import { getViewportConfig, getSimplePriority, isInViewport as checkInViewport } from '../utils/viewportPriorityConfig';

/**
 * 画廊项目组件 - 单个壁纸/视频卡片
 */
const GalleryItem = ({ item, onPreview, index }) => {
  const { t } = useLanguage();
  const { translateTitle } = useTitleTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0); // 当前尝试的URL索引
  const [isHovered, setIsHovered] = useState(false);
  const [showHoverInfo, setShowHoverInfo] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1); // 存储图片宽高比
  const [isMobile, setIsMobile] = useState(false); // 移动端检测
  
  // 🎥 新的视频自动播放系统：移动端视窗检测 + 桌面端hover
  const {
    containerRef: autoPlayContainerRef,
    videoRef,
    isInView,
    isPlaying,
    shouldAutoPlay,
    handleDesktopHover
  } = useVideoAutoPlay(item, isMobile);
  
  // 优化Hook集成 - 增强版视口优先级加载
  const { loadImage, isLoading: isImageLoading } = useImageLoader();
  const { elementRef: viewportRef, isInViewport } = useInViewport({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: false
  });
  
  // 创建图片预加载引用
  const imageRef = useRef(null);
  
  // 点击统计
  const { recordClick } = useClickStatsContext();

  // 判断是否为视频 - 需要在useMemo之前定义
  const isVideo = item.type === 'video';

  // 移除已知问题项目的特殊处理，使用标准版图片工具应该能解决大部分问题

  // 移动端检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔧 ID 8 特殊处理初始化
  React.useEffect(() => {
    if (isId8(item)) {
      initId8Fix();
    }
  }, [item.id]);

  // 获取可用的URL列表（使用新的fallback策略）
  const availableUrls = React.useMemo(() => {
    try {
      // 🎯 ID 8特殊处理
      if (isId8(item)) {
        console.log(`🔧 ID 8 特殊URL处理激活`);
        const id8Urls = getId8UrlByPurpose('thumbnail');
        console.log(`🎯 ID 8 可用URLs:`, id8Urls.length + '个');
        return id8Urls;
      }
      
      if (isVideo) {
        // 🎥 视频文件：使用fallback工具生成的可靠URL
        const videoUrl = getUrlByPurpose(item, 'video');
        const fallbackUrls = generateFallbackUrls(item.url, item);
        
        return [videoUrl, ...fallbackUrls, item.url].filter(Boolean);
      } else {
        // 🖼️ 图片文件：使用fallback工具的智能降级
        const thumbnailUrl = getUrlByPurpose(item, 'thumbnail');
        const fallbackUrls = generateFallbackUrls(item.url, item);
        
        // 合并所有可用URL，去重
        const allUrls = [
          thumbnailUrl,
          ...(item.backupUrls || []),
          ...fallbackUrls,
          item.url
        ].filter(Boolean);
        
        const uniqueUrls = [...new Set(allUrls)]
          .filter(url => url && typeof url === 'string' && url.startsWith('http'));
        
        return uniqueUrls;
      }
    } catch (error) {
      console.warn(`获取项目 ${item.id} 的可用URL失败:`, error);
      return [item.url];
    }
  }, [item, isVideo]);

  // 获取当前要使用的URL
  const getCurrentUrl = () => {
    return availableUrls[currentUrlIndex] || item.url;
  };

  // 处理URL加载失败，尝试下一个备用URL
  const handleImageError = useCallback((e) => {
    const nextIndex = currentUrlIndex + 1;
    
    if (nextIndex < availableUrls.length) {
      setCurrentUrlIndex(nextIndex);
      setImageLoaded(false);
      setImageError(false);
    } else {
      console.warn(`❌ 项目 ${item.id} 加载失败 (尝试了 ${availableUrls.length} 个URL)`);
      setImageError(true);
    }
  }, [currentUrlIndex, availableUrls.length, item.id]);

  // 重置URL索引当item改变时
  useEffect(() => {
    setCurrentUrlIndex(0);
    setImageError(false);
    setImageLoaded(false);
  }, [item.id, availableUrls, isVideo]);

  // 🎯 简化版图片预加载 - FIFO策略
  useEffect(() => {
    const config = getViewportConfig();
    
    // 检查是否启用预加载功能
    if (!config.enabled || isVideo || !getCurrentUrl() || imageLoaded || imageError) {
      return;
    }
    
    // 🚀 简化优先级：只区分视口内和预加载
    const priority = isInViewport ? getSimplePriority('visible') : getSimplePriority('preload');
    
    // 简单的预加载逻辑，不阻塞主流程
    const timeoutId = setTimeout(() => {
      loadImage(getCurrentUrl(), priority).catch(() => {
        // 预加载失败不影响主流程
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [getCurrentUrl, item.id, isInViewport, imageLoaded, imageError, isVideo, loadImage]);

  // 移动端优化的快速下载功能
  const handleDownload = useCallback(async (e) => {
    e?.stopPropagation?.(); // 阻止事件冒泡
    e?.preventDefault?.(); // 阻止默认行为
    
    // 安全的文件名处理
    const cleanTitle = (translateTitle(item.title) || 'nexwallpaper').replace(/[<>:"/\\|?*]/g, '_');
    const fileExtension = item?.format?.toLowerCase() || (item?.type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${cleanTitle}.${fileExtension}`;
    const downloadUrl = getUrlByPurpose(item, 'download');
    
    // 使用代理URL
    const proxyUrl = downloadUrl.replace('https://labubuwallpaper.com', '/download-proxy');

    // 记录下载统计
    recordClick(item.id, 'download');
    
    // 检测移动端环境
    const env = detectMobileEnvironment();
    
    try {
      if (env.isMobile || env.isTablet) {
        // 移动端使用优化的下载工具
        const result = await mobileDownload(proxyUrl, fileName);
        
        if (!result.success && result.method !== 'cancelled') {
          // 如果移动端下载失败且不是用户取消，复制链接
          try {
            await navigator.clipboard.writeText(downloadUrl);
            alert('下载失败，链接已复制到剪贴板\n请手动访问并下载');
          } catch (clipboardError) {
            alert(`下载失败，请手动复制链接:\n${downloadUrl}`);
          }
        }
      } else {
        // 桌面端使用标准下载
        const response = await fetch(proxyUrl, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Accept': item?.type === 'video' ? 'video/*' : 'image/*',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.warn('下载失败，尝试移动端降级方案:', error.message);
      
      // 降级方案：使用移动端下载工具
      try {
        const result = await mobileDownload(proxyUrl, fileName);
        
        if (!result.success && result.method !== 'cancelled') {
          // 最终降级：复制链接
          try {
            await navigator.clipboard.writeText(downloadUrl);
            alert('下载失败，链接已复制到剪贴板\n请手动访问并下载');
          } catch (clipboardError) {
            alert(`下载失败，请手动复制链接:\n${downloadUrl}`);
          }
        }
      } catch (fallbackError) {
        console.error('所有下载方案都失败了:', fallbackError);
        alert(`下载失败，请手动复制链接:\n${downloadUrl}`);
      }
    }
  }, [item, translateTitle, getHighQualityUrl, recordClick]);

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
    setImageError(false);
  }, []);

  // 处理视频比例检测
  const handleVideoLoad = useCallback((e) => {
    const video = e.target;
    const ratio = video.videoWidth / video.videoHeight;
    
    setAspectRatio(ratio);
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // 处理视频悬停播放 - 移动到合并的handleMouseEnter中

  // 点击卡片打开详情 - 优化事件处理
  const handleCardClick = useCallback((e) => {
    // 记录点击统计
    recordClick(item.id, 'view');
    onPreview(item);
  }, [item, onPreview, recordClick]);

  // 悬浮处理函数 - 更新为智能播放控制系统
  const handleMouseEnter = useCallback(async () => {
    setIsHovered(true);
    
    // 🖥️ 桌面端视频悬停播放（通过新的自动播放系统）
    if (isVideo) {
      handleDesktopHover(true);
    }
    
    // 延迟显示信息，避免快速划过时闪烁
    const timer = setTimeout(() => {
      setShowHoverInfo(true);
    }, 200);
    setHoverTimer(timer);
  }, [isVideo, handleDesktopHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowHoverInfo(false);
    
    // 🖥️ 桌面端视频悬停结束（通过新的自动播放系统）
    if (isVideo) {
      handleDesktopHover(false);
    }
    
    // 清理定时器
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  }, [hoverTimer, isVideo, handleDesktopHover]);

  // 移动端触摸事件处理 - 简化为仅处理UI交互
  const handleTouchStart = useCallback(async () => {
    if (!isMobile) return;
    
    setIsHovered(true);
    
    // 📱 移动端视频播放由视窗检测自动处理，这里仅处理UI显示
    
    // 延迟显示信息
    const timer = setTimeout(() => {
      setShowHoverInfo(true);
    }, 200);
    setHoverTimer(timer);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    
    // 移动端触摸结束后延迟处理，避免快速触摸导致闪烁
    setTimeout(() => {
      setIsHovered(false);
      setShowHoverInfo(false);
      
      // 📱 移动端视频播放/暂停由视窗检测自动处理
      
      // 清理定时器
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
    }, 1500); // 1.5秒后自动隐藏
  }, [isMobile, hoverTimer]);

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
      ref={(el) => {
        // 🔗 同时设置多个ref：图片预加载 + 视频自动播放
        if (viewportRef) viewportRef.current = el;
        if (autoPlayContainerRef) autoPlayContainerRef.current = el;
      }}
      data-item-id={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`group relative pixiv-card cursor-pointer gallery-item optimize-rendering ${
        isVideo ? 'video-card' : ''
      } ${isPlaying ? 'video-playing' : ''}`}
      whileHover={{ y: -2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* 图片/视频容器 - 修复：移除overflow:hidden，确保图片完全展示 */}
      <div 
        className="relative rounded-lg shadow-sm w-full bg-gray-50"
        style={{ 
          // 移除 overflow: hidden，允许图片完全展示
          // 使用 minHeight 而不是固定高度，让容器适应内容
          minHeight: imageLoaded ? 'auto' : '200px'
        }}
      >
        {!imageError ? (
          <>
            {isVideo ? (
              <div className="relative w-full">
                <video
                  ref={videoRef}
                  src={getCurrentUrl()}
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-105 rounded-lg"
                  preload={getVideoPreloadStrategy(item)}
                  muted
                  loop
                  playsInline
                  onLoadedData={handleVideoLoad}
                  onError={handleImageError}
                  style={{
                    // 确保视频完全显示
                    maxWidth: '100%',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {t('hoverToPlay')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img
                ref={imageRef}
                src={getCurrentUrl()}
                alt={translateTitle(item.title)}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-105 rounded-lg"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  // 确保图片完全显示，不被裁剪
                  maxWidth: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  // 添加背景色，确保透明图片有背景
                  backgroundColor: '#f9fafb'
                }}
              />
            )}
          </>
        ) : (
          <div 
            className="w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
            style={{ minHeight: '200px' }}
          >
            <div className="text-center text-gray-500">
              <div className="mb-2 text-gray-400">
                {isVideo ? <Video size={48} /> : <Image size={48} />}
              </div>
              <div className="text-sm font-medium">
                {t('error')}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ID: {item.id}
              </div>
              {currentUrlIndex > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  已尝试 {currentUrlIndex + 1}/{availableUrls.length} 个地址
                </div>
              )}
              {availableUrls.length > currentUrlIndex + 1 && (
                <div className="mt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentUrlIndex(prev => prev + 1);
                      setImageError(false);
                      setImageLoaded(false);
                    }}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    重试下一个地址
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 加载状态 - 使用骨架屏 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0">
            <SkeletonCard aspectRatio={aspectRatio} />
          </div>
        )}

        {/* Pixiv风格悬停遮罩 - 修复：只在图片区域显示，不影响布局 */}
        <div 
          className="absolute inset-0 transition-all duration-200 rounded-lg pointer-events-none"
          style={{
            background: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
            // 确保遮罩不影响图片显示
            zIndex: 1
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
