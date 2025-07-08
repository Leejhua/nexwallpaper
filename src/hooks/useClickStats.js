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

  // 优先从服务器加载统计数据，localStorage作为备份
  useEffect(() => {
    const loadInitialStats = async () => {
      let initialStats = {};
      
      // 1. 先尝试从localStorage加载本地缓存
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          initialStats = JSON.parse(saved) || {};
          setClickStats(initialStats);
          console.log('📦 已加载本地缓存统计数据');
        }
      } catch (error) {
        console.error('Failed to load local stats:', error);
      }
      
      // 2. 如果在线，尝试从服务器加载并合并数据
      if (isOnline) {
        try {
          const response = await statsAPI.healthCheck();
          if (response.success) {
            console.log('🌐 服务器连接正常，开始同步统计数据');
            // 服务器正常，后续会通过loadBatchStats加载具体数据
          }
        } catch (error) {
          console.warn('🔄 服务器暂时不可用，使用本地数据:', error.message);
        }
      } else {
        console.log('📴 离线模式，使用本地数据');
      }
    };
    
    loadInitialStats();
  }, [isOnline]);

  // 保存到localStorage
  const saveLocalStats = useCallback((stats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save local stats:', error);
    }
  }, []);

  // 记录点击操作
  const recordClick = useCallback(async (wallpaperId, action = 'view') => {
    
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
      
      // 直接保存到本地存储
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      } catch (error) {
        console.error('Failed to save stats:', error);
      }
      
      return newStats;
    });

    // 🌐 优先同步到服务器，实现跨浏览器实时同步
    if (isOnline) {
      try {
        console.log(`🔄 正在同步操作到服务器: ${action} -> ${wallpaperId}`);
        const response = await statsAPI.recordAction(wallpaperId, action);
        
        if (response.success && response.data) {
          console.log(`✅ 服务器同步成功: ${action}`);
          
          // 🎯 用服务器返回的权威数据更新本地状态
          setClickStats(prev => {
            const updated = {
              ...prev,
              [wallpaperId]: {
                ...prev[wallpaperId],
                totalClicks: response.data.view_count || 0,
                likeStats: {
                  totalLikes: response.data.like_count || 0
                },
                actions: {
                  ...prev[wallpaperId]?.actions,
                  download: response.data.download_count || 0
                },
                userInteractions: prev[wallpaperId]?.userInteractions || { isLiked: false },
                serverData: response.data,
                lastSyncTime: new Date().toISOString()
              }
            };
            
            // 同步保存到localStorage
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              console.log('💾 已更新本地缓存');
            } catch (error) {
              console.error('Failed to save to localStorage:', error);
            }
            
            return updated;
          });
        }
      } catch (error) {
        console.error('❌ 服务器同步失败:', error);
        console.log('🔄 操作已记录到本地，下次在线时会同步');
        // 失败时保持本地状态，不影响用户体验
      }
    } else {
      console.log('📴 离线模式，操作已记录到本地');
    }
  }, [isOnline]); // 只依赖isOnline

  // 批量加载统计数据 - 优先使用服务器数据实现跨浏览器同步
  const loadBatchStats = useCallback(async (wallpaperIds) => {
    if (!wallpaperIds.length) return;
    
    // 如果离线，只使用本地数据
    if (!isOnline) {
      console.log('📴 离线模式，跳过服务器同步');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`🔄 正在从服务器同步 ${wallpaperIds.length} 个项目的统计数据...`);
      
      const response = await statsAPI.getBatchStats(wallpaperIds);
      
      if (response.success && response.data) {
        console.log('✅ 服务器数据同步成功');
        
        setClickStats(prev => {
          const updated = { ...prev };
          let hasChanges = false;
          let syncedCount = 0;
          
          Object.entries(response.data).forEach(([id, serverData]) => {
            const current = updated[id] || {};
            
            // 🔄 优先使用服务器数据，确保跨浏览器一致性
            const serverClicks = serverData.view_count || 0;
            const serverLikes = serverData.like_count || 0;
            const serverDownloads = serverData.download_count || 0;
            
            // 合并本地用户交互状态和服务器统计数据
            const newStats = {
              totalClicks: serverClicks,
              likeStats: {
                totalLikes: serverLikes
              },
              actions: {
                ...current.actions,
                download: serverDownloads
              },
              userInteractions: current.userInteractions || { isLiked: false },
              serverData,
              lastSyncTime: new Date().toISOString()
            };
            
            // 检查是否需要更新
            if (
              (current.totalClicks || 0) !== serverClicks ||
              (current.likeStats?.totalLikes || 0) !== serverLikes ||
              (current.actions?.download || 0) !== serverDownloads ||
              !current.serverData ||
              !current.lastSyncTime
            ) {
              hasChanges = true;
              syncedCount++;
              updated[id] = newStats;
            }
          });
          
          if (hasChanges) {
            console.log(`📊 已同步 ${syncedCount} 个项目的统计数据`);
            
            // 保存到localStorage作为缓存
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              console.log('💾 统计数据已缓存到本地');
            } catch (error) {
              console.error('Failed to save stats to localStorage:', error);
            }
            
            return updated;
          } else {
            console.log('📊 统计数据已是最新，无需更新');
            return prev;
          }
        });
      }
    } catch (error) {
      console.error('❌ 服务器数据同步失败:', error);
      console.log('🔄 将继续使用本地缓存数据');
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

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
    const currentlyLiked = isLiked(wallpaperId);
    const action = currentlyLiked ? 'unlike' : 'like';
    
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
