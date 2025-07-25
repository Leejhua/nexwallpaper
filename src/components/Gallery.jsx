import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import GalleryItem from './GalleryItem';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { BlurFade } from './ui/BlurFade';

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
  const [displayedItems, setDisplayedItems] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 获取统计上下文
  const { clickStats, loadBatchStats, isOnline } = useClickStatsContext();
  const loadBatchStatsRef = useRef(loadBatchStats);
  
  // 更新ref
  useEffect(() => {
    loadBatchStatsRef.current = loadBatchStats;
  }, [loadBatchStats]);
  const [isInitialized, setIsInitialized] = useState(false); // 初始化标记
  const [columns, setColumns] = useState([[], [], [], [], []]);
  const [columnCount, setColumnCount] = useState(4);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 初始加载状态
  const [showSkeleton, setShowSkeleton] = useState(true); // 骨架屏状态
  const observerRef = useRef();
  const loadTriggerRef = useRef();
  const containerRef = useRef();
  const initTimeoutRef = useRef(); // 防抖定时器
  
  // 点击统计
  const { getStats, getPopularityScore, getLikeCount, getLikeRate } = useClickStatsContext();

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

  // 首屏加载40条，后续每次加载60条 - 激进优化滚动体验
  const INITIAL_LOAD_SIZE = 40; // 首屏显示40条
  const LOAD_SIZE = 60; // 后续每次加载60条，彻底消除空白时间

  // 响应式列数计算 - 为横屏图片优化
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else if (width < 1280) setColumnCount(3);
      else if (width < 1536) setColumnCount(4);
      else setColumnCount(4); // 限制最大列数为4，给横屏图片更多空间
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // 重新分配所有项目到列的函数
  const redistributeAllItems = useCallback((allItems) => {
    const newColumns = Array(5).fill().map(() => []);
    
    allItems.forEach((item, index) => {
      const columnIndex = index % columnCount;
      newColumns[columnIndex].push(item);
    });
    
    return newColumns;
  }, [columnCount]);

  // 骨架屏组件
  const SkeletonItem = ({ height = 200 }) => (
    <div 
      className="bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-4"
      style={{ height: `${height}px` }}
    >

      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
  );

  // 渲染骨架屏
  const renderSkeleton = () => {
    const skeletonHeights = [200, 250, 180, 220, 190, 240, 170, 210];
    return Array.from({ length: columnCount }).map((_, columnIndex) => (
      <div key={`skeleton-column-${columnIndex}`} className="flex-1 space-y-4">
        {Array.from({ length: Math.ceil(INITIAL_LOAD_SIZE / columnCount) }).map((_, itemIndex) => (
          <SkeletonItem 
            key={`skeleton-${columnIndex}-${itemIndex}`}
            height={skeletonHeights[(columnIndex + itemIndex) % skeletonHeights.length]}
          />
        ))}
      </div>
    ));
  };

  // 当items或columnCount变化时，重新初始化 - 优化加载体验，避免双重刷新
  useEffect(() => {
    // 清除之前的定时器，实现防抖
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    // 如果是首次初始化，立即执行
    const delay = isInitialized ? 100 : 0;
    
    initTimeoutRef.current = setTimeout(() => {
      // 显示骨架屏，避免白屏
      setShowSkeleton(true);
      setIsInitialLoading(true);
      
      // 重置所有状态
      setDisplayedItems([]);
      setLoadedCount(0);
      setHasMore(true);
      setColumns(Array(5).fill().map(() => []));
      setIsLoadingMore(false);
      
      // 模拟加载延迟，确保平滑过渡
      const loadTimer = setTimeout(() => {
        if (items.length > 0) {
          // 应用排序
          const sortedItems = sortItems(items);
          const initialLoadSize = Math.min(INITIAL_LOAD_SIZE, sortedItems.length);
          const initialItems = sortedItems.slice(0, initialLoadSize);
          
          // 分批渲染，避免一次性渲染造成卡顿
          const batchSize = 10;
          let currentBatch = 0;
          const totalBatches = Math.ceil(initialItems.length / batchSize);
          
          const renderBatch = () => {
            const startIndex = currentBatch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, initialItems.length);
            const batchItems = initialItems.slice(0, endIndex);
            
            setDisplayedItems(batchItems);
            setLoadedCount(endIndex);
            
            // 重新分配到列
            const newColumns = redistributeAllItems(batchItems);
            setColumns(newColumns);
            
            currentBatch++;
            
            if (currentBatch < totalBatches) {
              // 继续下一批，间隔很短避免闪烁
              setTimeout(renderBatch, 50);
            } else {
              // 完成初始加载
              setHasMore(items.length > initialLoadSize);
              setIsInitialLoading(false);
              setShowSkeleton(false);
              setIsInitialized(true); // 标记为已初始化
            }
          };
          
          renderBatch();
        } else {
          // 没有数据时也要隐藏骨架屏
          setIsInitialLoading(false);
          setShowSkeleton(false);
          setIsInitialized(true);
        }
      }, isInitialized ? 100 : 200); // 首次加载稍长延迟，后续更快
      
      return () => clearTimeout(loadTimer);
    }, delay);
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [items, columnCount, redistributeAllItems, currentFilter, sortMode, randomSeed]); // 明确依赖项，避免sortItems导致的循环

  // 加载统计数据 - 当显示的项目变化时，使用防抖避免频繁调用
  useEffect(() => {
    if (displayedItems.length > 0 && isOnline) {
      // 计算新添加的 IDs
      const allIds = displayedItems.map(item => item.id);
      const loadedIds = new Set(Object.keys(clickStats));
      const newIds = allIds.filter(id => !loadedIds.has(id));
      
      if (newIds.length === 0) return;
      
      // 防抖处理
      const timeoutId = setTimeout(() => {
        if (loadBatchStatsRef.current) {
          loadBatchStatsRef.current(newIds).catch(error => {
            console.error('Failed to load batch stats:', error);
          });
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [displayedItems.length, isOnline, clickStats]);

  // 加载更多数据 - 优化版本，避免闪烁
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || items.length === 0 || isInitialLoading) {
      return;
    }

    setIsLoadingMore(true);
    
    // 平滑加载，避免突然出现大量内容
    setTimeout(() => {
      // 应用排序
      const sortedItems = sortItems(items);
      const nextItems = sortedItems.slice(loadedCount, loadedCount + LOAD_SIZE);
      const newDisplayedItems = [...displayedItems, ...nextItems];
      
      setDisplayedItems(newDisplayedItems);
      setLoadedCount(prev => prev + LOAD_SIZE);
      setHasMore(loadedCount + LOAD_SIZE < items.length);
      
      // 重新分配所有项目到列，确保均匀分布
      const newColumns = redistributeAllItems(newDisplayedItems);
      setColumns(newColumns);
      
      setIsLoadingMore(false);
    }, 30); // 30ms延迟，最快响应速度
  }, [items, loadedCount, displayedItems, isLoadingMore, hasMore, isInitialLoading, redistributeAllItems, sortItems]);

  // 无限滚动观察器 - 优化触发时机
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isInitialLoading) {
          loadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '1200px' // 提前1200px开始加载，激进预加载策略
      }
    );

    observerRef.current = observer;

    if (loadTriggerRef.current) {
      observer.observe(loadTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoadingMore, isInitialLoading]);

  // 滚动监听器 - 优化触发条件
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore || isInitialLoading) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 当滚动到距离底部1200px时触发加载，激进预加载
      if (scrollTop + windowHeight >= documentHeight - 1200) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, isLoadingMore, isInitialLoading]);

  // 初始加载状态
  if (isInitialLoading || (loading && displayedItems.length === 0)) {
    return (
      <div className="space-y-6">
        {/* 加载状态指示 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              {t('loading')}
            </span>
          </div>
        </motion.div>

        {/* 骨架屏 */}
        <div className="flex gap-4 gallery-container dark:text-gray-300">
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
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <Search size={64} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {t('noResults')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          尝试更换筛选条件或搜索关键词
        </p>
        <motion.button
          onClick={() => window.location.reload()}
          className="reload-btn no-focus-outline bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          style={{ height: '48px', padding: '0 24px' }} // 48px = 8 * 6
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新加载
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 稳定瀑布流容器 */}
      <div
        ref={containerRef}
        className="flex gap-4"
        style={{ minHeight: '400px' }}
      >
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className="flex-1 flex-col space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {columns[columnIndex]?.map((item, itemIndex) => {
                const globalIndex = displayedItems.findIndex(displayedItem => displayedItem.id === item.id);
                return (
                  <div key={`${item.id}-${currentFilter.join('-')}`} className="break-inside-avoid">
                    <BlurFade
                      className="masonry-item"
                      delay={globalIndex * 0.02}
                      duration={0.4}
                      direction="down"
                      inView={true}
                      blur="6px"
                    >
                      <GalleryItem
                        item={item}
                        onPreview={onPreview}
                        index={globalIndex}
                      />
                    </BlurFade>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* 加载更多触发器 - 优化位置 */}
      {hasMore && !isInitialLoading && (
        <div className="relative">
          {/* 隐形触发器 - 适中的位置 */}
          <div 
            ref={loadTriggerRef} 
            className="absolute -top-[400px] left-0 w-full h-4"
            style={{ pointerEvents: 'none' }}
          />
          
          {/* 可见的加载区域 */}
          <div className="flex justify-center py-6">
            {isLoadingMore ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">正在加载更多精美壁纸...</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">每次加载 {LOAD_SIZE} 张</p>
              </motion.div>
            ) : (
              <motion.button
                onClick={loadMore}
                className="load-more-btn no-focus-outline bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                style={{ height: '48px', padding: '0 24px' }} // 48px = 8 * 6
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="flex items-center gap-2">
                  <span>加载更多</span>
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                    +{Math.min(LOAD_SIZE, items.length - displayedItems.length)}
                  </span>
                </span>
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* 加载完成提示 */}
      {!hasMore && displayedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 text-gray-700 dark:text-gray-200 rounded-full">
            <Sparkles className="text-green-500" size={16} />
            <span className="font-medium">{t('allDisplayed')} {displayedItems.length} {t('wallpapers')}</span>
            <span className="text-blue-500">🎉</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Gallery;
