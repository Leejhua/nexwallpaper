import { useState, useEffect, useMemo, useCallback } from 'react';
import { galleryData } from '../data/galleryData';
import { languages } from '../data/languages';

/**
 * 画廊数据管理Hook - 优化懒加载版本
 * 提供筛选、搜索等功能，优化加载体验，避免闪屏
 */
export const useGallery = () => {
  console.log('useGallery');
  console.log(galleryData);
  const [selectedFilters, setSelectedFilters] = useState(['all']); // 改为数组支持多选
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // 过渡状态
  const [randomSeed, setRandomSeed] = useState(() => Math.random() * 1000000); // 随机种子
  const [isInitialized, setIsInitialized] = useState(false); // 初始化标记

  // 创建反向翻译映射（一次性构建，提高性能）
  const reverseTranslationMap = useMemo(() => {
    const reverseMap = new Map(); // 翻译后的标签 -> 原始标签
    
    Object.values(languages).forEach(language => {
      const tagTranslations = language.translations?.tagTranslations;
      if (tagTranslations) {
        Object.entries(tagTranslations).forEach(([originalTag, translation]) => {
          if (translation && translation !== originalTag) {
            reverseMap.set(translation.toLowerCase(), originalTag);
          }
        });
      }
    });
    
    return reverseMap;
  }, []);

  // 智能标签匹配函数 - 简化版本
  const isTagMatch = useCallback((itemTag, searchTerm) => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const lowerItemTag = itemTag.toLowerCase();
    
    // 1. 直接匹配原始标签
    if (lowerItemTag.includes(lowerSearchTerm)) {
      return true;
    }
    
    // 2. 检查搜索词是否是某个翻译，如果是，匹配对应的原始标签
    const originalTag = reverseTranslationMap.get(lowerSearchTerm);
    if (originalTag && originalTag === itemTag) {
      return true;
    }
    
    // 3. 检查搜索词的部分匹配
    for (const [translatedTag, origTag] of reverseTranslationMap.entries()) {
      if (translatedTag.includes(lowerSearchTerm) && origTag === itemTag) {
        return true;
      }
    }
    
    return false;
  }, [reverseTranslationMap]);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let filtered = galleryData;

    // 按分类筛选 - 支持多选
    if (!selectedFilters.includes('all') && selectedFilters.length > 0) {
      filtered = filtered.filter(item => {
        return selectedFilters.some(filter => {
          if (filter === 'live') {
            return item.type === 'video';
          } else {
            return item.category === filter;
          }
        });
      });
    }

    // 按搜索词筛选 - 增强搜索功能，支持多语言匹配
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        // 标题匹配
        if (item.title.toLowerCase().includes(term)) return true;
        
        // 分类匹配
        if (item.category.toLowerCase().includes(term)) return true;
        
        // 智能标签匹配 - 支持多语言
        if (item.tags?.some(tag => isTagMatch(tag, term))) return true;
        
        return false;
      });
    }

    return filtered;
  }, [selectedFilters, searchTerm, isTagMatch]);

  // 初始化标记 - 避免首次加载时的双重刷新
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 筛选变化时的平滑过渡 - 避免闪屏
  useEffect(() => {
    if (!selectedFilters.includes('all') || searchTerm.trim()) {
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
  }, [selectedFilters, searchTerm]);

  // 切换筛选器 - 支持多选
  const handleFilterChange = (filter) => {
    setSelectedFilters(prevFilters => {
      // 如果点击"全部"，清空其他选择
      if (filter === 'all') {
        return ['all'];
      }
      
      // 如果当前包含"全部"，移除"全部"
      let newFilters = prevFilters.filter(f => f !== 'all');
      
      // 切换选中状态
      if (newFilters.includes(filter)) {
        newFilters = newFilters.filter(f => f !== filter);
        // 如果没有选择任何分类，回到"全部"
        if (newFilters.length === 0) {
          newFilters = ['all'];
        }
      } else {
        newFilters = [...newFilters, filter];
      }
      
      return newFilters;
    });
    
    // 只有在已初始化且切换到"全部作品"时才刷新随机种子
    if (filter === 'all' && isInitialized && !selectedFilters.includes('all')) {
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
    setSelectedFilters(['all']);
    setSearchTerm('');
    // 只有在不是默认状态时才刷新随机种子
    if (isInitialized && (!selectedFilters.includes('all') || searchTerm.trim())) {
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
    selectedFilters,
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
