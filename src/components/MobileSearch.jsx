import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTagTranslation } from '../hooks/useTagTranslation';
import SortControls from './SortControls';

/**
 * 移动端搜索组件 - 位于页面顶部，包含搜索栏和排序按钮
 */
const MobileSearch = ({ searchTerm, onSearchChange, onClearSearch, onSortChange, currentSort = 'default' }) => {
  const { t } = useLanguage();
  const { translateTag } = useTagTranslation();
  // 获取显示用的搜索词（翻译后的）
  const displaySearchTerm = React.useMemo(() => {
    if (!searchTerm) return '';
    // 尝试翻译搜索词，如果是已知标签则显示翻译，否则显示原文
    const translated = translateTag(searchTerm);
    return translated;
  }, [searchTerm, translateTag]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ 
        opacity: 1,
        y: 0
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut" 
      }}
      className="w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden mt-4 relative z-[9999]"
    >
      {/* 搜索栏和排序按钮在同一行 */}
      <div className="flex gap-3 items-center">
        {/* 搜索栏容器 - 占据剩余空间 */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={displaySearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 pl-12 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-sm"
          />
          
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        
        {/* 排序按钮 - 固定宽度，样式与搜索栏一致 */}
        <div className="flex-shrink-0">
          <SortControls 
            onSortChange={onSortChange}
            currentSort={currentSort}
            isMobile={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MobileSearch;