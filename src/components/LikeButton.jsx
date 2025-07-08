import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useLanguage } from '../contexts/LanguageContext';

const LikeButton = ({ 
  wallpaperId, 
  size = 'medium',
  showCount = true,
  square = false, // 新增正方形属性
  className = '' 
}) => {
  const { t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 安全获取Context
  let toggleLike, isLiked, getLikeCount;
  try {
    const context = useClickStatsContext();
    toggleLike = context.toggleLike;
    isLiked = context.isLiked;
    getLikeCount = context.getLikeCount;
  } catch (error) {
    console.error('LikeButton Context Error:', error);
    return <div>{t('errorLoadingLikeButton')}</div>;
  }
  
  // 安全获取状态
  let isLikedState = false;
  let likeCount = 0;
  
  try {
    isLikedState = isLiked ? isLiked(wallpaperId) : false;
    likeCount = getLikeCount ? getLikeCount(wallpaperId) : 0;
  } catch (error) {
    console.error('LikeButton State Error:', error);
  }

  const handleLikeClick = useCallback(async (e) => {
    e.stopPropagation();
    
    try {
      setIsAnimating(true);
      if (toggleLike) {
        const newLikeState = await toggleLike(wallpaperId);
      } else {
        console.error('toggleLike function not available');
      }
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error) {
      console.error('LikeButton Click Error:', error);
      setIsAnimating(false);
    }
  }, [wallpaperId, toggleLike]);

  const sizeClasses = {
    small: 'w-3 h-3', // 移动端尺寸，与分享按钮一致
    medium: 'w-4 h-4', // 桌面端尺寸，与分享按钮一致
    large: 'w-5 h-5'
  };

  return (
    <motion.button
      onClick={handleLikeClick}
      title={square ? (isLikedState ? t('buttons.unlike') : t('buttons.like')) : undefined} // 正方形时添加title
      className={`
        like-btn no-focus-outline
        flex items-center ${square ? 'justify-center' : 'gap-2'} rounded-md
        transition-all duration-200 border
        ${isLikedState 
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
        ${className}
      `}
      style={{ 
        height: size === 'small' ? '32px' : '40px',
        width: square ? (size === 'small' ? '32px' : '40px') : 'auto',
        padding: square ? '0' : (size === 'small' ? '0 8px' : '0 12px')
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-center" // 确保图标居中
        animate={isAnimating ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`${sizeClasses[size]} ${isLikedState ? 'fill-current' : ''}`}
        />
      </motion.div>
      
      {showCount && !square && likeCount > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-medium"
        >
          {likeCount}
        </motion.span>
      )}
    </motion.button>
  );
};

export default LikeButton;
