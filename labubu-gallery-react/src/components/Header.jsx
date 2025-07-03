import React from 'react';
import { motion } from 'framer-motion';
import { Rabbit } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 头部组件 - 显示标题
 */
const Header = () => {
  const { t } = useLanguage();
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-8"
    >
      <div className="text-center space-y-4 px-6">
        {/* 主标题 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2 flex items-center gap-3">
            <Rabbit size={48} className="text-blue-500" />
            {t('title')}
          </h1>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
