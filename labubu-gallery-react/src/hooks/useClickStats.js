import { useState, useEffect, useCallback } from 'react';
import statsAPI from '../services/statsApi';

const STORAGE_KEY = 'labubu_click_stats';

export const useClickStats = () => {
  const [clickStats, setClickStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 从localStorage加载本地缓存数据
  useEffect(() => {
    const loadLocalStats = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setClickStats(parsed || {});
          console.log('Loaded local stats:', Object.keys(parsed || {}).length, 'items');
        }
      } catch (error) {
        console.error('Failed to load local stats:', error);
      }
    };
    loadLocalStats();
  }, []);

  // 保存到localStorage
  const saveLocalStats = useCallback((stats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      console.log('Saved local stats:', Object.keys(stats).length, 'items');
    } catch (error) {
      console.error('Failed to save local stats:', error);
    }
  }, []);

  // 记录点击操作
  const recordClick = useCallback(async (wallpaperId, action = 'view') => {
    console.log('🎯 recordClick:', { wallpaperId, action, isOnline });
    
    // 立即更新本地状态
    setClickStats(prev => {
      const current = prev[wallpaperId] || {
        totalClicks: 0,
        actions: {},
        userInteractions: { isLiked: false },
        likeStats: { totalLikes: 0 }
      };

      const updated = {
        ...current,
        totalClicks: action === 'view' ? current.totalClicks + 1 : current.totalClicks,
        actions: {
          ...current.actions,
          [action]: (current.actions[action] || 0) + 1
        }
      };

      // 处理喜欢/取消喜欢
      if (action === 'like') {
        updated.userInteractions = { ...updated.userInteractions, isLiked: true };
        updated.likeStats = { ...updated.likeStats, totalLikes: updated.likeStats.totalLikes + 1 };
      } else if (action === 'unlike') {
        updated.userInteractions = { ...updated.userInteractions, isLiked: false };
        updated.likeStats = { ...updated.likeStats, totalLikes: Math.max(0, updated.likeStats.totalLikes - 1) };
      }

      const newStats = { ...prev, [wallpaperId]: updated };
      console.log('📊 Updated local stats:', updated);
      
      // 直接保存到本地存储
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      } catch (error) {
        console.error('Failed to save stats:', error);
      }
      
      return newStats;
    });

    // 如果在线，同步到服务器
    if (isOnline) {
      try {
        console.log('🌐 Syncing to server...');
        const response = await statsAPI.recordAction(wallpaperId, action);
        console.log('✅ Server sync success:', response);
        
        // 可选：用服务器数据更新本地状态
        if (response.success && response.data) {
          setClickStats(prev => ({
            ...prev,
            [wallpaperId]: {
              ...prev[wallpaperId],
              serverData: response.data
            }
          }));
        }
      } catch (error) {
        console.error('❌ Server sync failed:', error);
        // 失败时保持本地状态，不影响用户体验
      }
    }
  }, [isOnline]); // 只依赖isOnline

  // 批量加载统计数据
  const loadBatchStats = useCallback(async (wallpaperIds) => {
    if (!wallpaperIds.length || !isOnline) return;
    
    try {
      console.log('📥 Loading batch stats for:', wallpaperIds.length, 'items');
      setIsLoading(true);
      const response = await statsAPI.getBatchStats(wallpaperIds);
      
      if (response.success && response.data) {
        console.log('📊 Received server stats:', Object.keys(response.data).length, 'items');
        
        setClickStats(prev => {
          const updated = { ...prev };
          let hasChanges = false;
          
          Object.entries(response.data).forEach(([id, serverData]) => {
            const current = updated[id] || {};
            const newTotalClicks = Math.max(current.totalClicks || 0, serverData.view_count || 0);
            const newLikeCount = Math.max(current.likeStats?.totalLikes || 0, serverData.like_count || 0);
            const newDownloadCount = Math.max(current.actions?.download || 0, serverData.download_count || 0);
            
            // 只在数据真正变化时才更新
            if (
              (current.totalClicks || 0) !== newTotalClicks ||
              (current.likeStats?.totalLikes || 0) !== newLikeCount ||
              (current.actions?.download || 0) !== newDownloadCount ||
              !current.serverData
            ) {
              hasChanges = true;
              updated[id] = {
                ...current,
                totalClicks: newTotalClicks,
                likeStats: {
                  ...current.likeStats,
                  totalLikes: newLikeCount
                },
                actions: {
                  ...current.actions,
                  download: newDownloadCount
                },
                serverData
              };
            }
          });
          
          if (hasChanges) {
            console.log('📊 Stats updated with server data');
            // 直接保存，不依赖外部函数
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (error) {
              console.error('Failed to save stats:', error);
            }
            return updated;
          } else {
            console.log('📊 No changes needed');
            return prev; // 返回原状态，避免不必要的重渲染
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to load batch stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]); // 只依赖isOnline

  // 获取统计数据
  const getStats = useCallback((wallpaperId) => {
    return clickStats[wallpaperId] || {
      totalClicks: 0,
      actions: {},
      userInteractions: { isLiked: false },
      likeStats: { totalLikes: 0 }
    };
  }, [clickStats]);

  // 获取喜欢数
  const getLikeCount = useCallback((wallpaperId) => {
    const stats = getStats(wallpaperId);
    return stats.likeStats?.totalLikes || 0;
  }, [getStats]);

  // 获取热度分数
  const getPopularityScore = useCallback((wallpaperId) => {
    const stats = getStats(wallpaperId);
    const views = stats.totalClicks || 0;
    const likes = stats.likeStats?.totalLikes || 0;
    const downloads = stats.actions?.download || 0;
    
    return views * 1 + likes * 3 + downloads * 2;
  }, [getStats]);

  // 检查是否已喜欢
  const isLiked = useCallback((wallpaperId) => {
    const stats = getStats(wallpaperId);
    return stats.userInteractions?.isLiked || false;
  }, [getStats]);

  // 切换喜欢状态
  const toggleLike = useCallback(async (wallpaperId) => {
    console.log('💖 toggleLike called for:', wallpaperId);
    const currentlyLiked = isLiked(wallpaperId);
    const action = currentlyLiked ? 'unlike' : 'like';
    console.log('💖 Current state:', currentlyLiked, '-> Action:', action);
    
    await recordClick(wallpaperId, action);
    return !currentlyLiked;
  }, [isLiked, recordClick]);

  return {
    clickStats,
    isLoading,
    isOnline,
    recordClick,
    getStats,
    getLikeCount,
    getPopularityScore,
    isLiked,
    toggleLike,
    loadBatchStats
  };
};
