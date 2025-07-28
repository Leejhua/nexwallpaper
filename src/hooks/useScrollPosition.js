import { useEffect, useRef, useCallback } from 'react';

/**
 * 滚动位置记忆Hook
 * 自动保存和恢复滚动位置，支持详情页返回和刷新保持
 */
export const useScrollPosition = (key = 'gallery-scroll') => {
  const scrollPositionRef = useRef(0);
  const isRestoringRef = useRef(false);
  
  // 保存滚动位置到sessionStorage
  const saveScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollPositionRef.current = scrollTop;
    try {
      sessionStorage.setItem(key, scrollTop.toString());
    } catch (error) {
      console.warn('保存滚动位置失败:', error);
    }
  }, [key]);

  // 恢复滚动位置 - 增强版
  const restoreScrollPosition = useCallback(() => {
    if (isRestoringRef.current) return;
    
    try {
      const savedPosition = sessionStorage.getItem(key);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        if (!isNaN(position) && position > 0) {
          isRestoringRef.current = true;
          
          const attemptRestore = (attempts = 0) => {
            const maxAttempts = 10; // 最多尝试10次
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            // 检查页面内容是否足够支持滚动到目标位置
            if (scrollHeight > position + clientHeight || attempts >= maxAttempts) {
              // 页面内容足够，或达到最大尝试次数，立即恢复
              window.scrollTo({
                top: position,
                behavior: 'auto'
              });
              
              // 重置恢复标记
              setTimeout(() => {
                isRestoringRef.current = false;
              }, 100);
            } else {
              // 页面内容不够，等待更多内容加载
              setTimeout(() => {
                attemptRestore(attempts + 1);
              }, 100); // 100ms后重试
            }
          };
          
          // 等待DOM渲染完成后开始尝试恢复
          requestAnimationFrame(() => {
            attemptRestore();
          });
        }
      }
    } catch (error) {
      console.warn('恢复滚动位置失败:', error);
      isRestoringRef.current = false;
    }
  }, [key]);

  // 清除保存的滚动位置
  const clearScrollPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      scrollPositionRef.current = 0;
    } catch (error) {
      console.warn('清除滚动位置失败:', error);
    }
  }, [key]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    clearScrollPosition();
  }, [clearScrollPosition]);

  // 监听滚动事件并定期保存位置
  useEffect(() => {
    let saveTimeout;
    
    const handleScroll = () => {
      if (isRestoringRef.current) return;
      
      // 防抖保存，避免频繁写入
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      saveTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveScrollPosition]);

  // 页面加载时恢复位置
  useEffect(() => {
    // 延迟恢复，确保内容已加载
    const restoreTimeout = setTimeout(() => {
      restoreScrollPosition();
    }, 300);

    return () => clearTimeout(restoreTimeout);
  }, [restoreScrollPosition]);

  // 页面卸载前保存位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    scrollToTop,
    currentPosition: scrollPositionRef.current
  };
};

/**
 * 加载状态持久化Hook
 * 保存和恢复已加载的内容状态
 */
export const useLoadingStatePersistence = (key = 'gallery-loading-state') => {
  
  // 保存加载状态
  const saveLoadingState = useCallback((state) => {
    try {
      const stateToSave = {
        visibleItemsCount: state.visibleItemsCount || 0,
        hasMore: state.hasMore || false,
        sortedItemIds: state.sortedItemIds || [], // 🆕 支持排序ID顺序
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(key, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('保存加载状态失败:', error);
    }
  }, [key]);

  // 恢复加载状态
  const restoreLoadingState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem(key);
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // 检查状态是否过期（超过30分钟）
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - state.timestamp > thirtyMinutes) {
          clearLoadingState();
          return null;
        }
        
        return state;
      }
    } catch (error) {
      console.warn('恢复加载状态失败:', error);
    }
    return null;
  }, [key]);

  // 清除加载状态
  const clearLoadingState = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('清除加载状态失败:', error);
    }
  }, [key]);

  return {
    saveLoadingState,
    restoreLoadingState,
    clearLoadingState
  };
}; 