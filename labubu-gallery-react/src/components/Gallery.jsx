import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GalleryItem from './GalleryItem';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';

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
  const [displayedItems, setDisplayedItems] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 获取统计上下文
  const { loadBatchStats, isOnline } = useClickStatsContext();
  const loadBatchStatsRef = useRef(loadBatchStats);
  
  // 更新ref
  useEffect(() => {
    loadBatchStatsRef.current = loadBatchStats;
  }, [loadBatchStats]);
  const [columns, setColumns] = useState([[], [], [], [], []]);
  const [columnCount, setColumnCount] = useState(4);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 初始加载状态
  const [showSkeleton, setShowSkeleton] = useState(true); // 骨架屏状态
  const observerRef = useRef();
  const loadTriggerRef = useRef();
  const containerRef = useRef();
  
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
      console.log('🎲 Applying random shuffle to default view, seed:', randomSeed);
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

  // 首屏加载40条，后续每次加载20条
  const INITIAL_LOAD_SIZE = 40; // 首屏显示40条
  const LOAD_SIZE = 20; // 后续每次加载20条

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
      className="bg-gray-200 rounded-xl animate-pulse mb-4"
      style={{ height: `${height}px` }}
    >
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
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

  // 当items或columnCount变化时，重新初始化 - 优化加载体验
  useEffect(() => {
    console.log('Items changed, reinitializing...', { 
      itemsLength: items.length, 
      currentFilter,
      columnCount,
      sortMode 
    });
    
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
            
            console.log('Initial load completed:', {
              initialItemsCount: initialItems.length,
              hasMore: items.length > initialLoadSize,
              columnsDistribution: newColumns.map(col => col.length)
            });
          }
        };
        
        renderBatch();
      } else {
        // 没有数据时也要隐藏骨架屏
        setIsInitialLoading(false);
        setShowSkeleton(false);
      }
    }, 200); // 200ms延迟，给用户平滑的加载感受
    
    return () => clearTimeout(loadTimer);
  }, [items, columnCount, redistributeAllItems, currentFilter, sortItems]);

  // 加载统计数据 - 当显示的项目变化时，使用防抖避免频繁调用
  useEffect(() => {
    if (displayedItems.length > 0 && isOnline) {
      const wallpaperIds = displayedItems.map(item => item.id);
      
      // 防抖处理，避免频繁调用
      const timeoutId = setTimeout(() => {
        console.log('Loading batch stats for:', wallpaperIds.length, 'items');
        if (loadBatchStatsRef.current) {
          loadBatchStatsRef.current(wallpaperIds).catch(error => {
            console.error('Failed to load batch stats:', error);
          });
        }
      }, 1000); // 1秒防抖，避免频繁调用
      
      return () => clearTimeout(timeoutId);
    }
  }, [displayedItems.length, isOnline]); // 只依赖长度，不依赖整个数组

  // 加载更多数据 - 优化版本，避免闪烁
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || items.length === 0 || isInitialLoading) {
      console.log('Load more blocked:', { isLoadingMore, hasMore, itemsLength: items.length, isInitialLoading });
      return;
    }

    console.log('Loading more items...', { loadedCount, totalItems: items.length });
    setIsLoadingMore(true);
    
    // 平滑加载，避免突然出现大量内容
    setTimeout(() => {
      // 应用排序
      const sortedItems = sortItems(items);
      const nextItems = sortedItems.slice(loadedCount, loadedCount + LOAD_SIZE);
      const newDisplayedItems = [...displayedItems, ...nextItems];
      
      console.log('Adding new items:', {
        nextItemsCount: nextItems.length,
        newTotalCount: newDisplayedItems.length,
        remainingItems: items.length - (loadedCount + LOAD_SIZE)
      });
      
      setDisplayedItems(newDisplayedItems);
      setLoadedCount(prev => prev + LOAD_SIZE);
      setHasMore(loadedCount + LOAD_SIZE < items.length);
      
      // 重新分配所有项目到列，确保均匀分布
      const newColumns = redistributeAllItems(newDisplayedItems);
      setColumns(newColumns);
      
      console.log('Load more completed:', {
        columnsDistribution: newColumns.map(col => col.length),
        hasMoreRemaining: loadedCount + LOAD_SIZE < items.length
      });
      
      setIsLoadingMore(false);
    }, 100); // 100ms延迟，提供平滑的加载体验
  }, [items, loadedCount, displayedItems, isLoadingMore, hasMore, isInitialLoading, redistributeAllItems, sortItems]);

  // 无限滚动观察器 - 优化触发时机
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isInitialLoading) {
          console.log('Intersection observer triggered load more');
          loadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '300px' // 提前300px开始加载，平衡性能和体验
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
      
      // 当滚动到距离底部400px时触发加载
      if (scrollTop + windowHeight >= documentHeight - 400) {
        console.log('Scroll listener triggered load more');
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
          <div className="text-gray-600">
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              正在加载精美壁纸...
            </span>
          </div>
          <div className="text-sm text-gray-500">
            ⏳ 首屏加载40张高清壁纸
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
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          没有找到相关壁纸
        </h3>
        <p className="text-gray-600 mb-6">
          尝试更换筛选条件或搜索关键词
        </p>
        <motion.button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
      {/* 结果统计 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="text-gray-600">
          显示 <span className="font-semibold text-blue-600">{displayedItems.length}</span> / 
          <span className="font-semibold text-purple-600">{filteredItems}</span> 个结果
          {currentFilter !== 'all' && (
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {currentFilter === 'fantasy' && '奇幻世界'}
              {currentFilter === 'desktop' && '桌面壁纸'}
              {currentFilter === 'mobile' && '手机壁纸'}
              {currentFilter === 'seasonal' && '季节主题'}
              {currentFilter === '4k' && '4K超清'}
              {currentFilter === 'live' && '动态壁纸'}
            </span>
          )}
        </div>
        
        {/* 懒加载状态指示 */}
        <div className="text-sm text-gray-500">
          {isLoadingMore ? '⏳ 加载中...' : hasMore ? '📜 滚动加载更多' : '✅ 已加载全部'}
          {!isInitialLoading && (
            <span className="ml-2 text-xs">
              (首屏{INITIAL_LOAD_SIZE}张，每次加载{LOAD_SIZE}张)
            </span>
          )}
        </div>
      </motion.div>

      {/* 调试信息 (开发时可见) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
          调试: 总项目{items.length} | 已显示{displayedItems.length} | 已加载{loadedCount} | 
          列分布[{columns.map(col => col.length).join(', ')}] | 
          筛选器:{currentFilter} | 还有更多:{hasMore ? '是' : '否'}
        </div>
      )}

      {/* 稳定瀑布流容器 */}
      <div 
        ref={containerRef}
        className="flex gap-6 gallery-container"
        style={{ minHeight: '400px' }}
      >
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div 
            key={`column-${columnIndex}`}
            className="flex-1 space-y-6 masonry-column"
            style={{ minHeight: '100px' }}
          >
            <AnimatePresence mode="popLayout">
              {columns[columnIndex]?.map((item, itemIndex) => {
                const globalIndex = displayedItems.findIndex(displayedItem => displayedItem.id === item.id);
                return (
                  <motion.div
                    key={`${item.id}-${currentFilter}`} // 添加currentFilter确保重新渲染
                    className="masonry-item"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4,
                      delay: globalIndex * 0.02,
                      ease: "easeOut"
                    }}
                    layout={false}
                  >
                    <GalleryItem
                      item={item}
                      onPreview={onPreview}
                      index={globalIndex}
                    />
                  </motion.div>
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
                <p className="text-gray-600 text-sm">正在加载更多精美壁纸...</p>
                <p className="text-gray-400 text-xs mt-1">每次加载 {LOAD_SIZE} 张</p>
              </motion.div>
            ) : (
              <motion.button
                onClick={loadMore}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 text-gray-700 rounded-full">
            <span className="text-green-500">✨</span>
            <span className="font-medium">已展示全部 {displayedItems.length} 个精美壁纸</span>
            <span className="text-blue-500">🎉</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Gallery;
