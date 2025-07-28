import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 懒加载Hook - 分批加载和视口优化
 */
export const useLazyLoad = (items = [], options = {}) => {
  const {
    initialBatch = 12,      // 首屏加载数量
    batchSize = 6,          // 每批加载数量
    loadAhead = 3,          // 提前加载屏数
    threshold = 0.5,        // 触发加载的阈值
    rootMargin = '300px'    // 扩展检测区域
  } = options;

  const [visibleItems, setVisibleItems] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const loadTriggerRef = useRef(null);

  // 初始化 - 加载首屏内容
  useEffect(() => {
    if (items.length === 0) return;

    const initialItems = items.slice(0, initialBatch);
    setVisibleItems(initialItems);
    setCurrentBatch(1);
    setHasMore(items.length > initialBatch);
  }, [items, initialBatch]);

  // 加载下一批数据
  const loadNextBatch = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // 模拟异步加载
    setTimeout(() => {
      const startIndex = currentBatch * batchSize + (currentBatch === 1 ? 0 : initialBatch - batchSize);
      const endIndex = startIndex + batchSize;
      const nextBatch = items.slice(startIndex, endIndex);
      
      if (nextBatch.length > 0) {
        setVisibleItems(prev => [...prev, ...nextBatch]);
        setCurrentBatch(prev => prev + 1);
        setHasMore(endIndex < items.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 100); // 短暂延迟以避免频繁加载
  }, [isLoading, hasMore, currentBatch, batchSize, initialBatch, items]);

  // 设置Intersection Observer
  useEffect(() => {
    if (!loadTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadNextBatch();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(loadTriggerRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadNextBatch, hasMore, isLoading, threshold, rootMargin]);

  // 手动触发加载
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadNextBatch();
    }
  }, [loadNextBatch, isLoading, hasMore]);

  // 重置加载状态
  const reset = useCallback(() => {
    setVisibleItems([]);
    setCurrentBatch(0);
    setIsLoading(false);
    setHasMore(true);
  }, []);

  // 获取加载状态信息
  const getLoadingStatus = useCallback(() => {
    return {
      totalItems: items.length,
      visibleCount: visibleItems.length,
      currentBatch,
      isLoading,
      hasMore,
      progress: items.length > 0 ? (visibleItems.length / items.length) * 100 : 0
    };
  }, [items.length, visibleItems.length, currentBatch, isLoading, hasMore]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    loadMore,
    reset,
    loadTriggerRef,
    getLoadingStatus
  };
};

/**
 * 视口检测Hook - 检测元素是否在视口中
 */
export const useInViewport = (options = {}) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        const inViewport = entry.isIntersecting;
        
        if (inViewport) {
          setIsInViewport(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInViewport(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    elementRef,
    isInViewport,
    entry
  };
};

/**
 * 虚拟滚动Hook - 优化大列表性能
 */
export const useVirtualScroll = (items = [], itemHeight = 300, containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  // 计算可见范围
  const visibleRange = useCallback(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - 1), // 预加载上一个
      endIndex: Math.min(endIndex + 1, items.length) // 预加载下一个
    };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  // 获取可见项目
  const visibleItems = useCallback(() => {
    const { startIndex, endIndex } = visibleRange();
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, visibleRange]);

  // 处理滚动事件
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 获取容器样式
  const getContainerStyle = useCallback(() => {
    return {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative'
    };
  }, [containerHeight]);

  // 获取内容样式
  const getContentStyle = useCallback(() => {
    return {
      height: items.length * itemHeight,
      position: 'relative'
    };
  }, [items.length, itemHeight]);

  // 获取项目样式
  const getItemStyle = useCallback((index) => {
    return {
      position: 'absolute',
      top: index * itemHeight,
      width: '100%',
      height: itemHeight
    };
  }, [itemHeight]);

  return {
    visibleItems: visibleItems(),
    handleScroll,
    getContainerStyle,
    getContentStyle,
    getItemStyle,
    setContainerRef,
    scrollTop,
    visibleRange: visibleRange()
  };
};

export default useLazyLoad; 