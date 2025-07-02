import { useState, useEffect, useMemo, useCallback } from 'react';
import { galleryData } from '../data/galleryData';

/**
 * 画廊数据管理Hook - 优化懒加载版本
 * 提供筛选、搜索等功能，优化加载体验，避免闪屏
 */
export const useGallery = () => {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // 过渡状态
  const [randomSeed, setRandomSeed] = useState(() => Math.random() * 1000000); // 随机种子
  const [isInitialized, setIsInitialized] = useState(false); // 初始化标记

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let filtered = galleryData;

    // 按分类筛选
    if (currentFilter !== 'all') {
      if (currentFilter === 'live') {
        // 动态壁纸筛选
        filtered = filtered.filter(item => item.type === 'video');
      } else {
        // 其他分类筛选
        filtered = filtered.filter(item => item.category === currentFilter);
      }
    }

    // 按搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        item.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [currentFilter, searchTerm]);

  // 初始化标记 - 避免首次加载时的双重刷新
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 筛选变化时的平滑过渡 - 避免闪屏
  useEffect(() => {
    if (currentFilter !== 'all' || searchTerm.trim()) {
      setIsTransitioning(true);
      setLoading(true);
      
      // 分阶段加载，提供平滑体验
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      
      const loadingTimer = setTimeout(() => {
        setLoading(false);
      }, 300);
      
      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(loadingTimer);
      };
    } else {
      // 重置到全部时，立即显示
      setLoading(false);
      setIsTransitioning(false);
    }
  }, [currentFilter, searchTerm]);

  // 切换筛选器 - 优化体验，避免首次加载双重刷新
  const handleFilterChange = (filter) => {
    // 如果是相同筛选器，不做处理
    if (filter === currentFilter) return;
    
    setCurrentFilter(filter);
    
    // 只有在已初始化且切换到"全部作品"时才刷新随机种子
    // 避免首次加载时的双重刷新
    if (filter === 'all' && isInitialized && currentFilter !== 'all') {
      setRandomSeed(Math.random() * 1000000);
    }
  };

  // 搜索处理 - 防抖优化
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchTerm('');
  };

  // 重置所有筛选 - 避免不必要的刷新
  const resetFilters = () => {
    setCurrentFilter('all');
    setSearchTerm('');
    // 只有在不是默认状态时才刷新随机种子
    if (isInitialized && (currentFilter !== 'all' || searchTerm.trim())) {
      setRandomSeed(Math.random() * 1000000);
    }
  };

  return {
    // 数据
    items: filteredData,
    totalItems: galleryData.length,
    filteredItems: filteredData.length,
    
    // 状态
    loading,
    isTransitioning,
    currentFilter,
    searchTerm,
    
    // 操作
    handleFilterChange,
    handleSearch,
    clearSearch,
    resetFilters,
    
    // 统计信息
    stats: {
      total: galleryData.length,
      images: galleryData.filter(item => item.type === 'image').length,
      videos: galleryData.filter(item => item.type === 'video').length,
      filtered: filteredData.length
    },
    randomSeed
  };
};
