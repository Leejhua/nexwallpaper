import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Menu, Filter, Search, RotateCcw, Globe,
  FolderOpen, Sparkles, Monitor, Smartphone, Flower2, Video, Play
} from 'lucide-react';
import { categories } from '../data/galleryData';
import { useLanguage } from '../contexts/LanguageContext';
import { useTagTranslation } from '../hooks/useTagTranslation';
import LanguageSelector from './LanguageSelector';

// 图标映射
const iconMap = {
  FolderOpen,
  Sparkles,
  Monitor,
  Smartphone,
  Flower2,
  Video,
  Play
};

/**
 * 侧边栏组件 - 筛选和搜索控制
 */
const Sidebar = ({
  isOpen,
  onToggle,
  currentFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onClearSearch,
  onResetFilters,
  filteredItems,
  totalItems
}) => {
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
    <>
      {/* Pixiv风格侧边栏切换按钮 */}
      <motion.button
        onClick={onToggle}
        className={`fixed top-6 z-50 pixiv-btn-icon transition-all duration-300 no-focus-outline ${
          isOpen ? 'left-[260px]' : 'left-6'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '40px',
          height: '40px', // 40px = 8 * 5
          borderRadius: '8px',
          background: 'white',
          border: '1px solid #e0e0e0',
          color: '#0096fa',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          outline: 'none'
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </motion.button>

      {/* 侧边栏主体 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Pixiv风格移动端遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
              onClick={onToggle}
            />

            {/* Pixiv风格侧边栏内容 */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-40 overflow-y-auto pixiv-sidebar flex flex-col"
              style={{
                background: 'white',
                borderRight: '1px solid #e0e0e0',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
              }}
            >
              {/* 顶部区域 */}
              <div style={{ padding: '24px', flexShrink: 0 }}>
                {/* Pixiv风格标题 */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 
                    className="gradient-text"
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      background: 'linear-gradient(135deg, #0096fa, #0084d6)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    <span>NexWallpaper</span>
                  </h2>
                </div>

                {/* Pixiv风格搜索框 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: '#333333',
                    marginBottom: '12px'
                  }}>
                    <Search className="w-4 h-4" />
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{t('search')}</span>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={displaySearchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pixiv-input"
                      style={{
                        width: '100%',
                        height: '40px', // 40px = 8 * 5
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white',
                        color: '#333333',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={onClearSearch}
                        className="search-clear-btn no-focus-outline"
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#999999',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 语言选择器 */}
                <div style={{ marginBottom: '24px' }}>
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium text-sm">{t('language')}</span>
                  </div>
                  <LanguageSelector />
                </div>

                {/* 分类筛选 - 多选 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">{t('categoryFilter')}</span>
                    <span className="text-xs text-gray-500">({t('multiSelect')})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const isSelected = currentFilter.includes(category.key);
                      const isAllSelected = currentFilter.includes('all');
                      
                      return (
                        <motion.button
                          key={category.key}
                          onClick={() => onFilterChange(category.key)}
                          className={`category-filter-btn no-focus-outline w-full flex items-center justify-between rounded-xl transition-all ${
                            isSelected || (isAllSelected && category.key === 'all')
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                          style={{ height: '48px', padding: '0 12px' }} // 48px = 8 * 6
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            {React.createElement(iconMap[category.icon], { size: 18 })}
                            <span className="font-medium">{t(`categories.${category.key}`)}</span>
                          </div>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            isSelected || (isAllSelected && category.key === 'all')
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {category.count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 中间区域 - 空白区域 */}
              <div style={{ 
                flex: 1
              }}>
              </div>

              {/* 底部区域 */}
              <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
                {/* 重置按钮 */}
                {(!currentFilter.includes('all') || searchTerm) && (
                  <motion.button
                    onClick={onResetFilters}
                    className="reset-btn no-focus-outline w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all mb-4"
                    style={{ height: '48px' }} // 48px = 8 * 6
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="font-medium">{t('buttons.reset')}</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
