import { useState, useEffect, useCallback, useRef } from 'react';
import { getLoadingConfig } from '../utils/loadingConfig';
import { useLoadingStatePersistence } from './useScrollPosition';

/**
 * 简化版顺序加载Hook - 统一快速策略
 * 专注于快速显示和平滑滚动体验，支持状态持久化
 * 修复跳跃加载问题
 */
export const useSequentialLoad = (sortedItems, onLoadMore, deps = []) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingTriggeredRef = useRef(false);
  const lastTriggerTimeRef = useRef(0);
  const isInitializedRef = useRef(false);
  
  const config = getLoadingConfig();
  const { saveLoadingState, restoreLoadingState, clearLoadingState } = useLoadingStatePersistence();

  // 🎯 改进的初始化加载 - 支持排序变化的状态恢复
  const initializeItems = useCallback(() => {
    if (!sortedItems || sortedItems.length === 0) {
      setVisibleItems([]);
      setHasMore(false);
      clearLoadingState(); // 清除无效状态
      return;
    }

    // 🔄 尝试恢复之前的加载状态
    const savedState = restoreLoadingState();
    let initialCount = config.initialBatch; // 默认12张
    
    if (savedState && savedState.visibleItemsCount > initialCount) {
      // 🚨 修复跳跃加载：检查恢复的数量是否超过当前可用项目数
      const maxAvailable = sortedItems.length;
      const requestedCount = savedState.visibleItemsCount;
      
      if (requestedCount <= maxAvailable) {
        // 安全恢复：确保不超过当前可用数量
        initialCount = requestedCount;
      } else {
        // 数据量减少了，使用当前最大可用数量
        initialCount = Math.min(maxAvailable, config.initialBatch * 3); // 最多恢复到3倍初始批次
      }
    }
    
    // 🛡️ 确保不超过可用项目数量
    initialCount = Math.min(initialCount, sortedItems.length);
    
    const initialItems = sortedItems.slice(0, initialCount);
    
    setVisibleItems(initialItems);
    setHasMore(initialItems.length < sortedItems.length);
    loadingTriggeredRef.current = false;
    isInitializedRef.current = true;
    
    // 💾 保存当前状态
    saveLoadingState({
      visibleItemsCount: initialItems.length,
      hasMore: initialItems.length < sortedItems.length,
      // 🆕 新增：保存当前排序的项目ID顺序，用于检测排序变化
      sortedItemIds: sortedItems.slice(0, Math.min(100, sortedItems.length)).map(item => item.id)
    });
    

  }, [sortedItems, config.initialBatch, restoreLoadingState, saveLoadingState, clearLoadingState]);

  // 🔄 简化的加载更多逻辑
  const loadMore = useCallback(async (source = 'auto') => {
    const now = Date.now();
    
    // 🛡️ 防重复触发 - 简化版防抖
    if (isLoading || 
        !hasMore || 
        (now - lastTriggerTimeRef.current < config.trigger.debounceDelay)) {
      return;
    }

    setIsLoading(true);
    lastTriggerTimeRef.current = now;

    try {
      const currentCount = visibleItems.length;
      const nextBatchSize = config.batchSize; // 统一6张
      const newItems = sortedItems.slice(currentCount, currentCount + nextBatchSize);
      
      if (newItems.length > 0) {
        // 🎯 关键修复：延迟更新visibleItems，等待图片队列处理完成
        // 给图片队列时间处理新添加的项目
        setTimeout(() => {
          setVisibleItems(prev => {
            const newVisibleItems = [...prev, ...newItems];
            
            // 💾 保存新的加载状态
            saveLoadingState({
              visibleItemsCount: newVisibleItems.length,
              hasMore: newVisibleItems.length < sortedItems.length,
              // 🆕 更新排序ID顺序
              sortedItemIds: sortedItems.slice(0, Math.min(100, sortedItems.length)).map(item => item.id)
            });
            
            return newVisibleItems;
          });
          

          
          // 检查是否还有更多
          const stillHasMore = (currentCount + newItems.length) < sortedItems.length;
          setHasMore(stillHasMore);
          
          // 调用外部回调
          if (onLoadMore) {
            onLoadMore(newItems, stillHasMore);
          }
        }, 100); // 100ms延迟，让图片队列有时间准备
      } else {
        setHasMore(false);

      }
    } catch (error) {
      console.error('加载更多图片失败:', error);
    } finally {
      // 🕐 延迟重置加载状态，确保整个流程完成
      setTimeout(() => {
        setIsLoading(false);
        loadingTriggeredRef.current = false;
      }, 150); // 150ms延迟，与队列处理时间对齐
    }
  }, [visibleItems, sortedItems, hasMore, isLoading, onLoadMore, config, saveLoadingState]);

  // 📏 简化的滚动触发检测
  const checkScrollTrigger = useCallback(() => {
    if (isLoading || !hasMore || loadingTriggeredRef.current) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;
    
    // 🎯 统一触发距离：距离底部1个屏幕高度
    const triggerDistance = clientHeight * config.trigger.scrollDistance; // 1屏
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    if (distanceFromBottom <= triggerDistance) {
      loadingTriggeredRef.current = true;
      loadMore('滚动');
    }
  }, [isLoading, hasMore, loadMore, config.trigger.scrollDistance]);

  // 🎛️ 优化的滚动监听器 - 统一防抖
  useEffect(() => {
    let timeoutId = null;
    
    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // 🕐 统一防抖延迟150ms
      timeoutId = setTimeout(() => {
        checkScrollTrigger();
      }, config.trigger.debounceDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [checkScrollTrigger, config.trigger.debounceDelay]);

  // 🔄 智能的数据变化处理 - 改进排序变化检测
  const previousSortedItemsRef = useRef();
  const previousDepsRef = useRef();
  
  useEffect(() => {
    const prevItems = previousSortedItemsRef.current;
    const prevDeps = previousDepsRef.current;
    
    // 首次初始化
    if (!isInitializedRef.current) {
      initializeItems();
      previousSortedItemsRef.current = sortedItems;
      previousDepsRef.current = deps;
      return;
    }
    
    // 🆕 智能检测排序变化 - 区分用户切换排序和热度微调
    const savedState = restoreLoadingState();
    const currentItemIds = sortedItems?.slice(0, Math.min(100, sortedItems?.length || 0)).map(item => item.id);
    const savedItemIds = savedState?.sortedItemIds;
    
    // 检查各种变化类型
    const itemsChanged = JSON.stringify(prevItems?.map(i => i.id)) !== JSON.stringify(sortedItems?.map(i => i.id));
    const depsChanged = JSON.stringify(prevDeps) !== JSON.stringify(deps);
    const sortOrderChanged = savedItemIds && JSON.stringify(savedItemIds) !== JSON.stringify(currentItemIds);
    
    // 🧠 智能排序变化检测：区分大幅重排和热度微调
    if (sortOrderChanged && !itemsChanged && savedItemIds && currentItemIds) {
      const savedSet = new Set(savedItemIds);
      const currentSet = new Set(currentItemIds);
      
      // 检查项目集合是否相同
      const sameDuplicateItems = savedSet.size === currentSet.size && 
        [...savedSet].every(id => currentSet.has(id));
      
      if (sameDuplicateItems) {
        // 🔍 分析排序变化程度：计算位置变化的程度
        let majorChanges = 0;
        let minorChanges = 0;
        const totalItems = Math.min(savedItemIds.length, currentItemIds.length, 20); // 只分析前20项
        
        for (let i = 0; i < totalItems; i++) {
          const savedId = savedItemIds[i];
          const currentIndex = currentItemIds.indexOf(savedId);
          
          if (currentIndex === -1) {
            majorChanges++; // 项目完全消失
          } else {
            const positionChange = Math.abs(currentIndex - i);
            if (positionChange > 5) {
              majorChanges++; // 位置变化超过5位认为是大变化
            } else if (positionChange > 0) {
              minorChanges++; // 小幅位置变化
            }
          }
        }
        
        // 🎯 决策逻辑：大幅重排才重置，热度微调保持状态
        const majorChangeRatio = majorChanges / totalItems;
        const isMinorAdjustment = majorChangeRatio < 0.3; // 少于30%的大变化
        
        if (isMinorAdjustment) {
          // 保持状态，只更新排序ID记录
          if (visibleItems.length > 0) {
            saveLoadingState({
              visibleItemsCount: visibleItems.length,
              hasMore: visibleItems.length < sortedItems.length,
              sortedItemIds: currentItemIds
            });
          }
        } else {
          clearLoadingState();
          isInitializedRef.current = false;
          initializeItems();
        }
      } else {
        clearLoadingState();
        isInitializedRef.current = false;
        initializeItems();
      }
    } 
    // 🔄 如果是数据内容变化，正常重新初始化
    else if (itemsChanged || depsChanged) {
      clearLoadingState(); // 清除可能过时的状态
      isInitializedRef.current = false; // 重置初始化标记
      initializeItems();
    }
    
    // 更新引用
    previousSortedItemsRef.current = sortedItems;
    previousDepsRef.current = deps;
  }, [initializeItems, sortedItems, clearLoadingState, restoreLoadingState, ...deps]);

  // 📊 简化的状态获取
  const getLoadingStatus = useCallback(() => {
    return {
      totalItems: sortedItems?.length || 0,
      visibleItems: visibleItems.length,
      remainingItems: Math.max(0, (sortedItems?.length || 0) - visibleItems.length),
      isLoading,
      hasMore,
      progress: sortedItems?.length > 0 ? (visibleItems.length / sortedItems.length * 100).toFixed(1) + '%' : '0%'
    };
  }, [sortedItems, visibleItems, isLoading, hasMore]);

  // 🎯 手动触发加载更多
  const manualLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMore('手动');
    }
  }, [isLoading, hasMore, loadMore]);

  // 🔄 重置加载状态
  const reset = useCallback(() => {
    setVisibleItems([]);
    setIsLoading(false);
    setHasMore(true);
    loadingTriggeredRef.current = false;
    lastTriggerTimeRef.current = 0;
    isInitializedRef.current = false;
    clearLoadingState(); // 清除持久化状态
  }, [clearLoadingState]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    loadMore: manualLoadMore,
    getLoadingStatus,
    reset
  };
};

/**
 * 瀑布流列分配Hook - 智能分配到最短列
 */
export const useMasonryLayout = (items = [], columnCount = 4) => {
  const [columns, setColumns] = useState([]);
  const [columnHeights, setColumnHeights] = useState([]);

  // 智能分配：总是添加到最短的列
  const addItemToShortest = useCallback((item) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      // 如果还没有初始化列，创建空列
      if (newColumns.length === 0) {
        for (let i = 0; i < columnCount; i++) {
          newColumns[i] = [];
        }
      }
      
      // 找到项目数量最少的列
      let shortestIndex = 0;
      let minLength = newColumns[0]?.length || 0;
      
      for (let i = 1; i < columnCount; i++) {
        const currentLength = newColumns[i]?.length || 0;
        if (currentLength < minLength) {
          minLength = currentLength;
          shortestIndex = i;
        }
      }
      
      // 添加到最短的列
      if (!newColumns[shortestIndex]) {
        newColumns[shortestIndex] = [];
      }
      newColumns[shortestIndex] = [...newColumns[shortestIndex], item];
      
      return newColumns;
    });
  }, [columnCount]);

  // 重新分配所有项目 - 保持视觉平衡的智能分配
  const redistributeItems = useCallback((allItems) => {
    // 重置所有列
    const newColumns = Array(columnCount).fill().map(() => []);
    
    // 🎯 智能分配到最短列，保持视觉平衡
    allItems.forEach(item => {
      let shortestIndex = 0;
      let minLength = newColumns[0].length;
      
      for (let i = 1; i < columnCount; i++) {
        if (newColumns[i].length < minLength) {
          minLength = newColumns[i].length;
          shortestIndex = i;
        }
      }
      
      newColumns[shortestIndex].push(item);
    });
    
    setColumns(newColumns);
  }, [columnCount]);

  // 当items或columnCount变化时重新分配
  useEffect(() => {
    redistributeItems(items);
  }, [items, redistributeItems]);

  return {
    columns,
    addItemToShortest,
    redistributeItems
  };
};

export default useSequentialLoad; 