import React from 'react';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';

const LikeCounter = ({ 
  wallpaperId,
  variant = 'badge',
  showTrend = false,
  className = ''
}) => {
  // 安全获取Context
  let getLikeCount, getLikeRate;
  try {
    const context = useClickStatsContext();
    getLikeCount = context.getLikeCount;
    getLikeRate = context.getLikeRate;
  } catch (error) {
    console.error('LikeCounter Context Error:', error);
    return null;
  }
  
  // 安全获取数据
  let likeCount = 0;
  let likeRate = 0;
  
  try {
    likeCount = getLikeCount ? getLikeCount(wallpaperId) : 0;
    likeRate = getLikeRate ? getLikeRate(wallpaperId) : 0;
  } catch (error) {
    console.error('LikeCounter Data Error:', error);
  }
  
  if (likeCount === 0 && variant === 'badge') return null;

  const renderContent = () => {
    switch (variant) {
      case 'badge':
        return (
          <span className="flex items-center gap-1 text-xs">
            ❤️ {likeCount}
          </span>
        );
      
      case 'inline':
        return (
          <span className="text-sm text-gray-600">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        );
      
      case 'detailed':
        return (
          <div className="text-sm">
            <span className="font-medium">{likeCount} 人喜欢</span>
            {showTrend && likeRate > 0 && (
              <span className="text-gray-500 ml-2">
                ({likeRate}% 喜欢率)
              </span>
            )}
          </div>
        );
      
      default:
        return <span>{likeCount}</span>;
    }
  };

  if (variant === 'badge') {
    return (
      <div className={`
        bg-red-500/90 text-white px-2 py-1 rounded-full
        backdrop-blur-sm border border-red-400/20
        ${className}
      `}>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
};

export default LikeCounter;
