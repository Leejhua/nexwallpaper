import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Gallery from './components/Gallery';
import Modal from './components/Modal';
import SortControls from './components/SortControls';
import { useGallery } from './hooks/useGallery';
import { useModal } from './hooks/useModal';
import { ClickStatsProvider } from './contexts/ClickStatsProvider';
import { stats } from './data/galleryData.js'; // 添加.js扩展名
import './styles/lazy-loading.css';

/**
 * 主应用组件 - 优化懒加载版本，避免闪屏白屏
 */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortMode, setSortMode] = useState('default');
  
  // 画廊数据管理
  const {
    items,
    totalItems,
    filteredItems,
    loading,
    isTransitioning,
    currentFilter,
    searchTerm,
    handleFilterChange,
    handleSearch,
    clearSearch,
    resetFilters,
    stats: galleryStats,
    randomSeed
  } = useGallery();

  // 模态框管理
  const {
    isModalOpen,
    selectedItem,
    openModal,
    closeModal
  } = useModal();

  // 响应式侧边栏控制
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理分享链接 - 检查URL参数中的wallpaper ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const wallpaperIdStr = urlParams.get('wallpaper');
    
    if (wallpaperIdStr && items.length > 0) {
      // 将字符串ID转换为数字进行匹配
      const wallpaperId = parseInt(wallpaperIdStr, 10);
      
      // 查找对应的壁纸
      const targetWallpaper = items.find(item => item.id === wallpaperId);
      
      if (targetWallpaper) {
        // 自动打开对应壁纸的详情页
        setTimeout(() => {
          openModal(targetWallpaper);
          // 清除URL参数，保持URL干净
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000); // 延迟1秒，确保页面完全加载
      }
    }
  }, [items, openModal]); // 依赖items和openModal

  return (
    <ClickStatsProvider>
      <div className="min-h-screen custom-scrollbar">
      {/* Pixiv风格侧边栏 */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onClearSearch={clearSearch}
        onResetFilters={resetFilters}
        filteredItems={filteredItems}
        totalItems={totalItems}
      />

      {/* Pixiv风格主内容区域 */}
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* Pixiv风格容器 - 在剩余空间中居中 */}
        <div className="pixiv-container flex justify-center min-h-screen" style={{ padding: '0 16px' }}>
          <div style={{ maxWidth: '1200px', width: '100%' }}>
            {/* Pixiv风格头部 */}
            <div className="pixiv-header" style={{ 
              marginBottom: '24px'
            }}>
              <Header
                totalItems={stats.total}
                filteredItems={filteredItems}
                currentFilter={currentFilter}
              />
              
              {/* 排序控制 */}
              <SortControls 
                onSortChange={setSortMode}
                currentSort={sortMode}
              />
            </div>

            {/* Pixiv风格画廊内容 - 添加过渡效果 */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isTransitioning ? 0.7 : 1, 
                y: 0 
              }}
              transition={{ 
                delay: 0.1, 
                duration: isTransitioning ? 0.2 : 0.4, 
                ease: "easeOut" 
              }}
              className="gallery-container"
            >
              <Gallery
                items={items}
                loading={loading}
                onPreview={openModal}
                currentFilter={currentFilter}
                filteredItems={filteredItems}
                sortMode={sortMode}
                randomSeed={randomSeed}
              />
            </motion.main>
          </div>
        </div>
      </div>

      {/* Pixiv风格详情模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        item={selectedItem}
      />

      {/* Pixiv风格全局样式注入 - 优化版本 */}
      <style>{`
        /* Pixiv风格瀑布流布局 - 优化版本 */
        .masonry-container {
          column-count: 1;
          column-gap: 16px;
          column-fill: balance;
        }
        
        @media (min-width: 640px) {
          .masonry-container {
            column-count: 2;
          }
        }
        
        @media (min-width: 1024px) {
          .masonry-container {
            column-count: 3;
          }
        }
        
        @media (min-width: 1280px) {
          .masonry-container {
            column-count: 4;
          }
        }
        
        @media (min-width: 1536px) {
          .masonry-container {
            column-count: 5;
          }
        }
        
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 16px;
          display: inline-block;
          width: 100%;
          contain: layout style paint; /* 优化渲染性能 */
        }

        /* 优化的滚动条样式 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #bdbdbd;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #9e9e9e;
        }

        /* 平滑滚动 */
        html {
          scroll-behavior: smooth;
        }

        /* 优化的懒加载动画 */
        @keyframes pixivFadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lazy-load-item {
          animation: pixivFadeInUp 0.4s ease-out;
        }

        /* 防止累积布局偏移 (CLS) */
        .gallery-container {
          min-height: 400px;
        }

        /* 优化选择样式 */
        ::selection {
          background: rgba(0, 150, 250, 0.2);
          color: #333333;
        }

        /* 优化焦点样式 */
        *:focus {
          outline: 2px solid #0096fa;
          outline-offset: 2px;
        }

        /* 优化链接样式 */
        a {
          color: #0096fa;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        a:hover {
          color: #0084d6;
          text-decoration: underline;
        }

        /* 减少动画对性能的影响 */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          html {
            scroll-behavior: auto;
          }
        }

        /* 优化加载状态 */
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        /* 骨架屏优化 */
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
      `}</style>
      </div>
    </ClickStatsProvider>
  );
}

export default App;
