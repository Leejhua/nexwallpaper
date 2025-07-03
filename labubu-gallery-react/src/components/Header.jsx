import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Github, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 头部组件 - 显示标题和统计信息
 */
const Header = ({ totalItems, filteredItems, currentFilter }) => {
  const { t } = useLanguage();
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 mb-8"
    >
      <div className="text-center space-y-4">
        {/* 主标题 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            🐰 {t('title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* 统计信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 flex-wrap"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">{totalItems}</span>
            <span className="text-sm opacity-90">{t('stats.total')}</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full">
            <Heart className="w-4 h-4" />
            <span className="font-semibold">{filteredItems}</span>
            <span className="text-sm opacity-90">{t('stats.showing')}</span>
          </div>

          {!currentFilter.includes('all') && currentFilter.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 text-gray-700 rounded-full border border-gray-200">
              <span className="text-sm">{t('filter')}:</span>
              <div className="flex flex-wrap gap-1">
                {currentFilter.map((filter, index) => (
                  <span key={filter} className="font-semibold">
                    {t(`categories.${filter}`)}
                    {index < currentFilter.length - 1 && <span className="text-gray-400 mx-1">+</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 随机排列提示 - 仅在全部作品时显示 */}
          {currentFilter.includes('all') && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full border border-green-200">
              <span className="text-xs">🎲</span>
              <span className="text-xs font-medium">随机排列</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
