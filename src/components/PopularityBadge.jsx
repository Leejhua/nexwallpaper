import React from 'react';
import { Heart, TrendingUp } from 'lucide-react';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';

const PopularityBadge = ({ 
  wallpaperId, 
  position = 'top-right', 
  variant = 'fire',
  className = '' 
}) => {
  const { getStats, getPopularityScore, getLikeCount } = useClickStatsContext();
  const stats = getStats(wallpaperId);
  const likeCount = getLikeCount(wallpaperId);
  
  if (stats.totalClicks === 0 && likeCount === 0) return null;

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2'
  };

  const renderContent = () => {
    switch (variant) {
      case 'fire':
        return (
          <span className="flex items-center gap-1 text-xs">
            <TrendingUp size={12} className="text-orange-500" />
            {stats.totalClicks}
          </span>
        );
      case 'number':
        return (
          <span className="text-xs">
            {stats.totalClicks} 次浏览
          </span>
        );
      case 'score':
        return (
          <span className="text-xs">
            热度 {getPopularityScore(wallpaperId)}
          </span>
        );
      case 'likes':
        return likeCount > 0 ? (
          <span className="flex items-center gap-1 text-xs">
            <Heart size={12} className="text-red-500" />
            {likeCount}
          </span>
        ) : null;
      default:
        return (
          <span className="text-xs">
            {stats.totalClicks}
          </span>
        );
    }
  };

  const content = renderContent();
  
  // 如果没有内容要显示，直接返回null
  if (!content) return null;

  return (
    <div 
      className={`
        absolute ${positionClasses[position]} 
        bg-black/70 text-white px-2 py-1 rounded-full
        backdrop-blur-sm border border-white/20
        ${className}
      `}
    >
      {content}
    </div>
  );
};

export default PopularityBadge;
