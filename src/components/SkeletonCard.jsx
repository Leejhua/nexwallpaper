import React from 'react';
import { motion } from 'framer-motion';

/**
 * 骨架屏卡片组件 - 在图片加载时显示
 */
const SkeletonCard = ({ aspectRatio = 1, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`bg-white rounded-lg overflow-hidden shadow-sm ${className}`}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* 主要图片区域骨架 */}
      <div 
        className="relative bg-gray-100 overflow-hidden"
        style={{ 
          aspectRatio: aspectRatio,
          minHeight: '200px'
        }}
      >
        {/* 渐变动画效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide"></div>
        </div>
        
        {/* 模拟播放按钮（for video cards） */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SkeletonCard; 