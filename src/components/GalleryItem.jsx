import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Pause, Video, Image } from 'lucide-react';
import { getThumbnailUrl, getHighResUrl, getThumbnailUrlWithFallback, generateFallbackUrls, isValidUrl } from '../utils/imageUtils';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import PopularityBadge from './PopularityBadge';
import HoverInfoOverlay from './HoverInfoOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { useTitleTranslation } from '../hooks/useTitleTranslation';
import ReactGA from 'react-ga4';

/**
 * 画廊项目组件 - 单个壁纸/视频卡片
 */
const GalleryItem = ({ item, onPreview, index }) => {
  const { t } = useLanguage();
  const { translateTitle } = useTitleTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0); // 当前尝试的URL索引
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHoverInfo, setShowHoverInfo] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1); // 存储图片宽高比
  const videoRef = useRef(null);
  
  // 点击统计
  const { recordClick } = useClickStatsContext();

  // 判断是否为视频 - 需要在useMemo之前定义
  const isVideo = item.type === 'video';

  // 已知的问题ID列表 - 这些ID需要特殊处理
  const knownProblemIds = [132, 158, 109, 102, 156, 103, 134, 86];
  const isProblemItem = knownProblemIds.includes(item.id);

  // 获取可用的URL列表（包含备用URL）
  const availableUrls = React.useMemo(() => {
    if (isVideo) {
      // 视频文件使用原始URL和备用URL
      const videoUrls = [item.url, ...(item.backupUrls || [])];
      const validUrls = videoUrls.filter(url => isValidUrl(url));
      
      // 对于问题视频，尝试不同的文件扩展名
      if (isProblemItem && validUrls.length > 0) {
        const baseUrl = validUrls[0];
        if (baseUrl.endsWith('.mov')) {
          validUrls.push(baseUrl.replace('.mov', '.mp4'));
        } else if (baseUrl.endsWith('.mp4')) {
          validUrls.push(baseUrl.replace('.mp4', '.mov'));
        }
      }
      
      return validUrls;
    } else {
      // 图片文件使用缩略图版本和智能备用URL
      const thumbnailUrls = getThumbnailUrlWithFallback(item);
      
      // 为主URL生成额外的备用版本
      const extraFallbacks = generateFallbackUrls(item.url);
      
      // 对于已知问题项目，添加额外的处理
      let additionalUrls = [];
      if (isProblemItem) {
        // 尝试不同的图片格式
        const baseUrl = item.url.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const formats = ['jpg', 'jpeg', 'png', 'webp'];
        formats.forEach(format => {
          additionalUrls.push(`${baseUrl}.${format}`);
        });
        
        // 尝试简化的CDN参数
        if (item.url.includes('cdn-cgi/image/')) {
          const imagePath = item.url.split('/cdn-cgi/image/')[1];
          if (imagePath && imagePath.includes('/')) {
            const actualPath = imagePath.substring(imagePath.indexOf('/') + 1);
            additionalUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/width=250,height=500,fit=cover,quality=85,format=auto/${actualPath}`);
            additionalUrls.push(`https://labubuwallpaper.com/cdn-cgi/image/f=auto,q=85/${actualPath}`);
          }
        }
      }
      
      // 合并所有URL并去重
      const allUrls = [...thumbnailUrls.all, ...extraFallbacks, ...additionalUrls];
      const validUrls = allUrls.filter(url => isValidUrl(url));
      
      return [...new Set(validUrls)]; // 去重
    }
  }, [item, isVideo, isProblemItem]);

  // 获取当前要使用的URL
  const getCurrentUrl = () => {
    return availableUrls[currentUrlIndex] || item.url;
  };

  // 处理URL加载失败，尝试下一个备用URL
  const handleImageError = useCallback((e) => {
    const failedUrl = getCurrentUrl();
    const nextIndex = currentUrlIndex + 1;
    
    // 详细的错误日志 - 特别标记已知问题项目
    const logLevel = isProblemItem ? 'warn' : 'warn';
    console[logLevel](`🔴 Image loading failed${isProblemItem ? ' (KNOWN PROBLEM ITEM)' : ''}:`, {
      itemId: item.id,
      isProblemItem,
      currentUrlIndex,
      failedUrl: failedUrl.substring(0, 100) + '...',
      nextIndex,
      totalUrls: availableUrls.length,
      error: e?.target?.error || 'Unknown error',
      itemTitle: item.title.substring(0, 50) + '...'
    });
    
    if (nextIndex < availableUrls.length) {
      console.log(`🔄 Trying backup URL ${nextIndex}/${availableUrls.length} for item ${item.id}${isProblemItem ? ' (PROBLEM ITEM)' : ''}`);
      setCurrentUrlIndex(nextIndex);
      setImageLoaded(false); // 重置加载状态
      setImageError(false); // 重置错误状态，尝试新URL
      
      // 对于已知问题项目，给更多时间加载
      const timeoutDuration = isProblemItem ? 5000 : 3000;
      setTimeout(() => {
        if (!imageLoaded && !imageError) {
          console.log(`⏰ URL ${nextIndex} taking time to load for item ${item.id}${isProblemItem ? ' (PROBLEM ITEM - extended timeout)' : ''}`);
        }
      }, timeoutDuration);
    } else {
      console.error(`❌ All ${availableUrls.length} URLs failed for item ${item.id}${isProblemItem ? ' (KNOWN PROBLEM ITEM)' : ''}:`, {
        itemId: item.id,
        totalAttempts: availableUrls.length,
        allUrls: availableUrls.map(url => url.substring(0, 80) + '...'),
        isProblemItem
      });
      setImageError(true); // 所有URL都失败了
    }
  }, [currentUrlIndex, availableUrls.length, item.id, getCurrentUrl, imageLoaded, imageError, isProblemItem]);

  // 重置URL索引当item改变时，并预检查URL
  useEffect(() => {
    setCurrentUrlIndex(0);
    setImageError(false);
    setImageLoaded(false);
    
    // 调试信息：显示可用的URL列表 - 特别标记已知问题项目
    const logLevel = isProblemItem ? 'warn' : 'log';
    console[logLevel](`🔗 URLs available for item ${item.id}${isProblemItem ? ' (KNOWN PROBLEM ITEM)' : ''}:`, {
      itemId: item.id,
      title: item.title.substring(0, 50) + '...',
      isProblemItem,
      primary: availableUrls[0]?.substring(0, 100) + '...',
      backupCount: availableUrls.length - 1,
      total: availableUrls.length,
      type: isVideo ? 'video' : 'image',
      hasUrlEncoding: availableUrls[0]?.includes('%'),
      allUrls: isProblemItem ? availableUrls.map((url, i) => `${i + 1}. ${url.substring(0, 80)}...`) : 'hidden'
    });
  }, [item.id, availableUrls, isVideo, isProblemItem]);

  // 高级快速下载功能 - 解决CORS问题，真正触发浏览器下载
  const handleDownload = useCallback(async (e) => {
    e?.stopPropagation?.(); // 阻止事件冒泡
    e?.preventDefault?.(); // 阻止默认行为
    
    // 安全的文件名处理
          const cleanTitle = (translateTitle(item.title) || 'nexwallpaper').replace(/[<>:"/\\|?*]/g, '_');
    const fileExtension = item?.format?.toLowerCase() || (item?.type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${cleanTitle}.${fileExtension}`;
    const downloadUrl = getHighResUrl(item.url);
    
    // 使用代理URL
    const proxyUrl = downloadUrl.replace('https://labubuwallpaper.com', '/download-proxy');

    console.log('🚀 Gallery高级快速下载:', { url: downloadUrl, proxyUrl, fileName, itemId: item.id });
    
    // 记录下载统计
    recordClick(item.id, 'download');
    
    try {
      // 方案1：使用fetch + Blob的方式，通过代理解决CORS问题
      console.log('📥 Gallery Fetch+Blob代理下载...');
      
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
      console.log('📦 Gallery文件数据获取成功:', { 
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
        console.log('🧹 GalleryItem Blob URL和链接已清理');
      }, 100);
      
      console.log('✅ Gallery Fetch+Blob代理下载完成');
      
    } catch (fetchError) {
      console.warn('⚠️ Gallery Fetch下载失败，尝试直链下载:', fetchError.message);
      
      try {
        // 方案2：降级到直链下载 (也使用代理)
        console.log('📥 Gallery直链下载...');
        
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = fileName;
        link.style.display = 'none';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Gallery直链下载完成');
        
        // 短暂延时后如果没有下载，显示提示
        setTimeout(() => {
          console.log('💡 Gallery下载已触发，浏览器可能阻止了跨域下载');
        }, 2000);
        
      } catch (directError) {
        console.warn('⚠️ Gallery直链下载也失败，显示用户指导:', directError.message);
        
        // 方案3：最终降级方案 - 用户友好的下载指导 (使用原始URL)
        const shouldOpenInNewTab = confirm(`自动下载失败，可能由于浏览器安全限制。\n\n请选择下载方式：\n✅ 确定：在新标签页打开文件，然后右键保存\n❌ 取消：复制文件链接，手动访问下载`);
        
        if (shouldOpenInNewTab) {
          try {
            const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              console.log('✅ Gallery新窗口已打开');
              alert('💡 温馨提示：在新页面中右键点击文件选择"另存为"即可下载');
            } else {
              throw new Error('弹窗被阻止');
            }
          } catch (windowError) {
            console.error('❌ Gallery无法打开新窗口:', windowError.message);
            // 复制链接到剪贴板
            try {
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(downloadUrl);
              } else {
                const textArea = document.createElement('textarea');
                textArea.value = downloadUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
              }
              alert('无法打开新窗口，链接已复制到剪贴板。请手动访问并下载。');
            } catch (copyError) {
              alert(`复制失败，请手动复制链接:\n${downloadUrl}`);
            }
          }
        } else {
          // 用户选择复制链接
          try {
            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(downloadUrl);
            } else {
              const textArea = document.createElement('textarea');
              textArea.value = downloadUrl;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              document.execCommand('copy');
              textArea.remove();
            }
            alert('链接已复制到剪贴板。请手动访问并右键保存文件。');
          } catch (copyError) {
            alert(`复制失败，请手动复制链接:\n${downloadUrl}`);
          }
        }
      }
    }
  }, [item, translateTitle, getHighResUrl, recordClick]);

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
    const currentUrl = getCurrentUrl();
    
    // 成功加载日志 - 特别标记已知问题项目的成功
    const logLevel = isProblemItem ? 'warn' : 'log';
    console[logLevel](`✅ Image loaded successfully for item ${item.id}${isProblemItem ? ' (PROBLEM ITEM - SUCCESS!)' : ''}:`, {
      itemId: item.id,
      isProblemItem,
      urlIndex: currentUrlIndex + 1,
      totalUrls: availableUrls.length,
      url: currentUrl.substring(0, 100) + '...',
      naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
      ratio: ratio.toFixed(2),
      wasRetry: currentUrlIndex > 0,
      retryCount: currentUrlIndex
    });
    
    // 对于已知问题项目的成功加载，记录成功的URL模式
    if (isProblemItem) {
      console.warn(`🎯 PROBLEM ITEM ${item.id} SUCCESSFULLY LOADED with URL pattern:`, {
        successfulUrl: currentUrl,
        urlPattern: currentUrl.includes('cdn-cgi/image/') ? 'CDN optimized' : 'Original',
        hasUrlEncoding: currentUrl.includes('%'),
        resolution: `${img.naturalWidth}x${img.naturalHeight}`
      });
    }
    
    setAspectRatio(ratio);
    setImageLoaded(true);
    setImageError(false); // 确保清除错误状态
  }, [getCurrentUrl, item.id, currentUrlIndex, isProblemItem, availableUrls.length]);

  // 处理视频比例检测
  const handleVideoLoad = useCallback((e) => {
    const video = e.target;
    const ratio = video.videoWidth / video.videoHeight;
    const currentUrl = getCurrentUrl();
    
    // 成功加载日志 - 特别标记已知问题项目的成功
    const logLevel = isProblemItem ? 'warn' : 'log';
    console[logLevel](`🎥 Video loaded successfully for item ${item.id}${isProblemItem ? ' (PROBLEM ITEM - SUCCESS!)' : ''}:`, {
      itemId: item.id,
      isProblemItem,
      urlIndex: currentUrlIndex + 1,
      totalUrls: availableUrls.length,
      url: currentUrl.substring(0, 100) + '...',
      videoSize: `${video.videoWidth}x${video.videoHeight}`,
      duration: video.duration?.toFixed(2) + 's',
      ratio: ratio.toFixed(2),
      wasRetry: currentUrlIndex > 0,
      retryCount: currentUrlIndex
    });
    
    // 对于已知问题项目的成功加载，记录成功的URL模式
    if (isProblemItem) {
      console.warn(`🎯 PROBLEM ITEM ${item.id} VIDEO SUCCESSFULLY LOADED with URL pattern:`, {
        successfulUrl: currentUrl,
        hasUrlEncoding: currentUrl.includes('%'),
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        duration: video.duration?.toFixed(2) + 's'
      });
    }
    
    setAspectRatio(ratio);
    setImageLoaded(true);
    setImageError(false); // 确保清除错误状态
  }, [getCurrentUrl, item.id, currentUrlIndex, isProblemItem, availableUrls.length]);

  // 处理视频悬停播放 - 移动到合并的handleMouseEnter中

  // 点击卡片打开详情 - 优化事件处理
  const handleCardClick = useCallback((e) => {
    // 记录点击统计
    recordClick(item.id, 'view');
    ReactGA.event({
      category: 'Interaction',
      action: 'Card Click',
      label: String(item.id)
    });
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
      className={`group relative pixiv-card cursor-pointer gallery-item optimize-rendering dark:bg-gray-800 ${isVideo ? 'video-card' : ''} ${isPlaying ? 'video-playing' : ''}`}
      whileHover={{ y: -2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* 图片/视频容器 - 现在占满整个卡片，自适应图片尺寸 */}
      <div 
        className="relative overflow-hidden rounded-lg shadow-sm w-full bg-gray-50 dark:bg-gray-700"
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
                  src={getCurrentUrl()}
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                  preload="metadata"
                  muted
                  loop
                  playsInline
                  onLoadedData={handleVideoLoad}
                  onError={handleImageError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* 播放状态指示器 */}
                




              </div>
            ) : (
              <img
                src={getCurrentUrl()}
                alt={translateTitle(item.title)}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </>
        ) : (
          <div 
            className={`w-full flex items-center justify-center bg-gradient-to-br ${isProblemItem ? 'from-orange-100 to-red-100' : 'from-gray-100 to-gray-200'}`}
            style={{ minHeight: '200px' }}
          >
            <div className="text-center text-gray-500">
              <div className={`mb-2 ${isProblemItem ? 'text-orange-500' : 'text-gray-400'}`}>
                {isVideo ? <Video size={48} /> : <Image size={48} />}
              </div>
              <div className={`text-sm font-medium ${isProblemItem ? 'text-orange-700' : ''}`}>
                {t('error')}
                {isProblemItem && (
                  <div className="text-xs text-orange-600 mt-1">
                    已知问题项目 - 正在优化中
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ID: {item.id}
              </div>
              {currentUrlIndex > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {t('triedBackupUrls')} ({currentUrlIndex}/{availableUrls.length})
                  {isProblemItem && ` - 特殊处理中`}
                </div>
              )}
              <div className="mt-2 space-x-2">
                {availableUrls.length > currentUrlIndex + 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentUrlIndex(prev => prev + 1);
                      setImageError(false);
                      setImageLoaded(false);
                    }}
                    className={`px-3 py-1 text-xs text-white rounded hover:opacity-90 transition-colors ${isProblemItem ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    重试下一个地址 ({currentUrlIndex + 1}/{availableUrls.length})
                  </button>
                )}
                {isProblemItem && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // 跳到最后几个URL（通常是原始URL）
                      const jumpToIndex = Math.max(availableUrls.length - 3, currentUrlIndex + 1);
                      setCurrentUrlIndex(jumpToIndex);
                      setImageError(false);
                      setImageLoaded(false);
                    }}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    尝试原始地址
                  </button>
                )}
              </div>
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
