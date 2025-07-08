import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Download } from 'lucide-react';
import { useClickStatsContext } from '../contexts/ClickStatsProvider';
import { useTagTranslation } from '../hooks/useTagTranslation';
import { useTitleTranslation } from '../hooks/useTitleTranslation';
import LikeButton from './LikeButton';
import { useLanguage } from '../contexts/LanguageContext';

const HoverInfoOverlay = ({ item, isVisible }) => {
  const { t } = useLanguage();
  const { getStats } = useClickStatsContext();
  const { translateTag } = useTagTranslation();
  const { translateTitle } = useTitleTranslation();
  
  if (!isVisible) return null;
  
  const stats = getStats(item.id);
  const viewCount = stats.totalClicks || 0;
  const likeCount = stats.likeStats?.totalLikes || 0;
  const downloadCount = stats.actions?.download || 0;

  // 检测是否为横屏图片
  const isLandscape = item.width && item.height && (item.width / item.height) > 1.5;
  
  // 为横屏图片使用更紧凑的布局
  const compactLayout = isLandscape;

  return (
    <motion.div
      className={`absolute inset-0 ${
        compactLayout 
          ? 'bg-gradient-to-b from-transparent via-black/40 to-black/90' 
          : 'bg-gradient-to-b from-transparent via-black/30 to-black/80'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className={`absolute inset-0 flex flex-col justify-end ${compactLayout ? 'p-2' : 'p-4'}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      >
        {/* 标题区域 - 紧凑布局使用更小的间距和字体 */}
        <div className={compactLayout ? "mb-1" : "mb-3"}>
          <h3 className={`text-white font-medium ${compactLayout ? 'text-xs' : 'text-sm'} line-clamp-1 mb-1`}>
            {translateTitle(item.title) || t('untitledWallpaper')}
          </h3>
          {item.author && !compactLayout && (
            <p className="text-white/80 text-xs">
              {item.author}
            </p>
          )}
        </div>

        {/* 标签区域 - 紧凑布局显示更少标签 */}
        {item.tags && item.tags.length > 0 && !compactLayout && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm"
              >
                {translateTag(tag)}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 紧凑布局的简化标签显示 */}
        {item.tags && item.tags.length > 0 && compactLayout && (
          <div className="flex flex-wrap gap-1 mb-1">
            {item.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-1 py-0.5 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm"
              >
                {translateTag(tag)}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="px-1 py-0.5 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 统计信息和操作区域 - 紧凑布局使用更小的间距 */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${compactLayout ? 'gap-1.5' : 'gap-3'} text-white/90 ${compactLayout ? 'text-xs' : 'text-xs'}`}>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {downloadCount}
            </span>
          </div>

          {/* 快速操作按钮 - 确保完全一致的尺寸 */}
          <div className={`flex items-center ${compactLayout ? 'gap-1' : 'gap-2'}`}>
            <LikeButton 
              wallpaperId={item.id}
              size="small"
              showCount={false}
              square={true}
              className="!bg-white/20 !text-white !border-white/30 hover:!bg-white/30 backdrop-blur-sm !rounded-md"
            />
            <motion.button
              className="bg-white/20 text-white border border-white/30 rounded-md hover:bg-white/30 transition-colors backdrop-blur-sm flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                padding: '0'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                // 触发下载逻辑
                const event = new CustomEvent('quickDownload', { 
                  detail: { item } 
                });
                window.dispatchEvent(event);
              }}
            >
              <Download className="w-3 h-3" />
            </motion.button>
          </div>
        </div>

        {/* 尺寸信息 - 紧凑布局不显示 */}
        {(item.width && item.height) && !compactLayout && (
          <div className="mt-2 text-white/70 text-xs">
            {item.width} × {item.height}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HoverInfoOverlay;
