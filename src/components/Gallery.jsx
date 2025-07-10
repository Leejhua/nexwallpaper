import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import GalleryItem from './GalleryItem';
import SkeletonCard from './SkeletonCard';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { useSequentialLoad, useMasonryLayout } from '../hooks/useSequentialLoad';
import { useImageLoader } from '../hooks/useImageLoader';
import { BlurFade } from './ui/BlurFade';
import { getLoadingConfig, isMobileDevice } from '../utils/loadingConfig';

/**
 * 优化版瀑布流画廊组件 - 懒加载首屏40条，避免闪屏白屏
 */
const Gallery = ({ 
  items, 
  loading, 
  onPreview,
  currentFilter,
  filteredItems,
  sortMode = 'default',
  randomSeed = Math.random() * 1000000
}) => {
  const { t } = useLanguage();
  
  // 状态管理
  const [columnCount, setColumnCount] = useState(4);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  // Refs
  const loadBatchStatsRef = useRef();
  const observerRef = useRef();
  const loadTriggerRef = useRef();
  const containerRef = useRef();
  const initTimeoutRef = useRef();
  
  // 获取基于设备的加载配置
  const loadingConfig = getLoadingConfig();
  const isMobile = isMobileDevice();
  
  // 获取统计上下文
  const { loadBatchStats, isOnline, getStats, getPopularityScore, getLikeCount, getLikeRate } = useClickStatsContext();
  
  // 更新ref
  useEffect(() => {
    loadBatchStatsRef.current = loadBatchStats;
  }, [loadBatchStats]);

  // 伪随机数生成器 - 使用种子确保可重现的随机性
  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  // 随机打乱数组 - 使用Fisher-Yates算法
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    let currentSeed = randomSeed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280; // 线性同余生成器
      const j = Math.floor(seededRandom(currentSeed) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }, [seededRandom, randomSeed]);

  // 排序函数
  const sortItems = useCallback((itemsToSort) => {
    if (sortMode === 'default') {
      // 默认模式使用随机排序，每次页面加载都不同
      return shuffleArray(itemsToSort);
    }
    
    return [...itemsToSort].sort((a, b) => {
      switch (sortMode) {
        case 'popularity':
          const scoreA = getPopularityScore(a.id);
          const scoreB = getPopularityScore(b.id);
          return scoreB - scoreA;
        
        case 'recent':
          const statsA = getStats(a.id);
          const statsB = getStats(b.id);
          return (statsB.lastClicked || 0) - (statsA.lastClicked || 0);
        
        case 'downloads':
          const downloadsA = getStats(a.id).actions?.download || 0;
          const downloadsB = getStats(b.id).actions?.download || 0;
          return downloadsB - downloadsA;
        
        case 'likes':
          const likesA = getStats(a.id).likeStats?.totalLikes || 0;
          const likesB = getStats(b.id).likeStats?.totalLikes || 0;
          return likesB - likesA;
        
        case 'likeRate':
          const rateA = getStats(a.id).likeStats?.totalLikes || 0;
          const rateB = getStats(b.id).likeStats?.totalLikes || 0;
          const viewsA = getStats(a.id).actions?.view || 1;
          const viewsB = getStats(b.id).actions?.view || 1;
          return (rateB / viewsB) - (rateA / viewsA);
        
        default:
          return 0;
      }
    });
  }, [sortMode, getStats, getPopularityScore, shuffleArray]);

  // 先应用排序，然后进行连续加载
  const sortedItems = React.useMemo(() => {
    return sortItems(items);
  }, [items, sortMode, sortItems]);

  // 🎯 新优化Hook集成 - 连续加载，根据设备类型使用不同策略
  const { preloadImages, getQueueStatus } = useImageLoader();
  const {
    visibleItems: sequentialItems,
    isLoading: isSequentialLoading,
    hasMore: hasMoreSequential,
    loadMore: loadMoreSequential,
    getLoadingStatus,
    reset
  } = useSequentialLoad(sortedItems, null, [items, sortMode]);
  
  // 瀑布流布局管理
  const { columns: masonryColumns, redistributeItems } = useMasonryLayout(sequentialItems, columnCount);

  // 根据设备类型设置不同的加载策略

  // 🎯 响应式列数计算 - 与加载配置保持一致，实现按行加载
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(1);       // 移动端：1列
      else if (width < 1024) setColumnCount(2); // 平板：2列
      else if (width < 1280) setColumnCount(3); // 小桌面：3列  
      else setColumnCount(4);                   // 大桌面：4列
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // 渲染优化骨架屏
  const renderSkeleton = () => {
          return Array.from({ length: columnCount }).map((_, columnIndex) => (
        <div key={`skeleton-column-${columnIndex}`} className="flex-1 space-y-4">
          {Array.from({ length: Math.ceil(loadingConfig.initialBatch / columnCount) }).map((_, itemIndex) => (
            <SkeletonCard 
              key={`skeleton-${columnIndex}-${itemIndex}`}
              aspectRatio={0.7 + (itemIndex % 3) * 0.2} // 变化的宽高比
              className="mb-4"
            />
          ))}
        </div>
      ));
  };

  // 简化初始化逻辑 - 使用新的连续加载Hook，防止快速滚动白屏
  useEffect(() => {
    if (sequentialItems.length > 0 && !isInitialized) {
      setIsInitialLoading(false);
      setShowSkeleton(false);
      setIsInitialized(true);
    }
    
    // 仅在稳定状态下预加载，避免快速滚动时的资源竞争
    if (isInitialized && !isSequentialLoading && sequentialItems.length > 0) {
      const currentLoaded = sequentialItems.length;
      const nextBatch = items.slice(currentLoaded, currentLoaded + loadingConfig.preloadBatchSize);
      if (nextBatch.length > 0) {
        const nextBatchUrls = nextBatch
          .map(item => item.url)
          .filter(Boolean);
        
        // 延迟预加载，避免与主要加载冲突，移动端延迟更长
        setTimeout(() => {
          preloadImages(nextBatchUrls, -2); // 更低优先级预加载
        }, isMobile ? 1000 : 500); // 移动端延迟1秒，桌面端500ms
      }
    }
  }, [sequentialItems.length, isInitialized, isSequentialLoading, items, preloadImages]);

  // 加载统计数据 - 使用新的连续加载项目
  useEffect(() => {
    if (sequentialItems.length > 0 && isOnline) {
      const wallpaperIds = sequentialItems.map(item => item.id);
      
      // 防抖处理，避免频繁调用
      const timeoutId = setTimeout(() => {
        if (loadBatchStatsRef.current) {
          loadBatchStatsRef.current(wallpaperIds).catch(error => {
            console.error('Failed to load batch stats:', error);
          });
        }
      }, 1000); // 1秒防抖，避免频繁调用
      
      return () => clearTimeout(timeoutId);
    }
  }, [sequentialItems.length, isOnline]); // 只依赖长度，不依赖整个数组

  // 🎯 简化的加载触发器ref - 代替原来Hook返回的ref
  const sequentialLoadTriggerRef = useRef(null);

  // 连续加载逻辑已由Hook处理，这里只需要简单的状态映射
  const loadMore = loadMoreSequential;
  const hasMore = hasMoreSequential;
  const isLoadingMore = isSequentialLoading;

  // 初始加载状态
  if (isInitialLoading || (loading && sequentialItems.length === 0)) {
    return (
      <div className="space-y-6">
        {/* 加载状态指示 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="text-gray-600">
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              {t('loading')}
            </span>
          </div>
        </motion.div>

        {/* 骨架屏 */}
        <div className="flex gap-6 gallery-container">
          {showSkeleton && renderSkeleton()}
        </div>
      </div>
    );
  }

  // 无数据状态
  if (items.length === 0 && !isInitialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <div className="text-gray-400 mb-4">
          <Search size={64} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t('noWallpapersFound')}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {currentFilter === 'all' 
            ? t('tryChangingFilters') 
            : t('noWallpapersInCategory').replace('{category}', currentFilter)
          }
        </p>
        <motion.div
          className="text-blue-600 cursor-pointer hover:text-blue-700 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
        >
          <Sparkles size={20} />
          <span>{t('refresh')}</span>
        </motion.div>
      </motion.div>
    );
  }

  // 主要渲染 - 使用瀑布流布局
  return (
    <div className="space-y-6">
      {/* 加载进度指示器 */}
      {isSequentialLoading && sequentialItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-gray-500"
        >
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>正在加载更多内容... ({sequentialItems.length}/{items.length})</span>
          </div>
        </motion.div>
      )}

      {/* 瀑布流网格 - 使用新的Hook布局 */}
      <div className="gallery-container">
        <div className="flex gap-6 items-start">
          {Array.from({ length: columnCount }).map((_, columnIndex) => (
            <div key={`column-${columnIndex}`} className="flex-1 space-y-4">
              {masonryColumns[columnIndex]?.map((item, itemIndex) => (
                <BlurFade
                  key={`${item.id}-${columnIndex}-${itemIndex}`}
                  delay={itemIndex * 0.02}
                  inView
                >
                  <GalleryItem
                    item={item}
                    onPreview={onPreview}
                    index={itemIndex + columnIndex * Math.ceil(sequentialItems.length / columnCount)}
                  />
                </BlurFade>
              ))}
            </div>
          ))}
        </div>
      </div>




    </div>
  );
};

export default Gallery; 