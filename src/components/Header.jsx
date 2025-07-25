import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeSwitcher from './ThemeSwitcher';
import MobileSearch from './MobileSearch';

/**
 * 头部组件 - 显示标题和移动端搜索
 */
const Header = ({ searchTerm, onSearchChange, onClearSearch, onSortChange, currentSort = 'default' }) => {
  const { t } = useLanguage();
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-4 relative pt-4"
    >
      <div className="text-center space-y-3 px-6">
        {/* 主标题 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-1">
            {t('title')}
          </h1>
        </motion.div>
        <div className="absolute top-4 right-4 hidden">
          <ThemeSwitcher />
        </div>
      </div>
      
      {/* 移动端搜索框 - 静态定位在标题下方 */}
      <MobileSearch 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        onSortChange={onSortChange}
        currentSort={currentSort}
      />
    </motion.header>
  );
};

export default Header;
