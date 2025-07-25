import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Gallery from './components/Gallery';
import CustomTemplates from './components/CustomTemplates';
import Modal from './components/Modal';
import SortControls from './components/SortControls';
import BottomNavigation from './components/BottomNavigation';
import Sidebar from './components/Sidebar';
import { useGallery } from './hooks/useGallery';
import { useModal } from './hooks/useModal';
import { ClickStatsProvider } from './contexts/ClickStatsProvider';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTagTranslation } from './hooks/useTagTranslation';
import './styles/lazy-loading.css';
import './styles/button-focus-fix.css';

/**
 * 主应用组件内容 - 优化懒加载版本，避免闪屏白屏
 */
function AppContent() {
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' or 'custom'
  const { translateTag } = useTagTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sortMode, setSortMode] = useState('default');
  
  // 画廊数据管理
  const {
    items,
    totalItems,
    filteredItems,
    loading,
    isTransitioning,
    selectedFilters,
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

  // 标签点击处理 - 传递原始标签，让搜索框自动翻译显示
  const handleTagClick = useCallback((tag) => {
    // 直接传递原始标签，搜索逻辑会自动匹配
    // 搜索框会通过translateTag显示翻译后的内容
    handleSearch(tag);
  }, [handleSearch]);



  // PC端侧边栏响应式处理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
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
      <div className="min-h-screen bg-white dark:bg-gray-900 custom-scrollbar">
        {/* PC端侧边栏 - 只在大屏幕显示 */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          stats={galleryStats}
          totalItems={totalItems}
          filteredCount={filteredItems.length}
          className="hidden lg:block"
        />
        
        {/* Pixiv风格主内容区域 */}
        <div className={`bg-white dark:bg-gray-900 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
          {/* Pixiv风格容器 - 在剩余空间中居中 */}
          <div className="pixiv-container flex justify-center min-h-screen" style={{ padding: '0 16px' }}>
            <div style={{ maxWidth: '1200px', width: '100%' }}>
              {/* Pixiv风格头部 */}
              <div className="pixiv-header w-full lg:pt-6 pt-0" style={{ 
                marginBottom: '24px'
              }}>
                {/* 搜索框 */}
                <Header 
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                  onClearSearch={clearSearch}
                  onSortChange={setSortMode}
                  currentSort={sortMode}
                />
              </div>

              {/* Pixiv风格画廊内容 - 添加过渡效果和底部间距 */}
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
                className="gallery-container pb-20 lg:pb-8"
              >
                                {activeTab === 'gallery' ? (
                  <Gallery
                    items={items}
                    loading={loading}
                    onPreview={openModal}
                    currentFilter={selectedFilters}
                    filteredItems={filteredItems}
                    sortMode={sortMode}
                    randomSeed={randomSeed}
                  />
                ) : (
                  <CustomTemplates />
                )}
              </motion.main>
            </div>
          </div>
        </div>

        {/* Pixiv风格详情模态框 */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          item={selectedItem}
          onTagClick={handleTagClick}
        />

        {/* 底部导航栏 - 仅在移动端显示 */}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

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
          
          .masonry-item {
            break-inside: avoid;
            margin-bottom: 16px;
            width: 100%;
          }
          
          /* Pixiv风格搜索和筛选 */
          .filter-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          /* Pixiv风格卡片悬停效果 */
          .gallery-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }
          
          .gallery-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          }
          
          /* Pixiv风格响应式优化 */
          @media (max-width: 1023px) {
            .pixiv-container {
              padding: 0 12px !important;
            }
            
            .masonry-container {
              column-gap: 12px;
            }
            
            .masonry-item {
              margin-bottom: 12px;
            }
          }
          
          /* 移动端优化 - Pixiv风格触摸友好 */
          @media (max-width: 767px) {
            .pixiv-container {
              padding: 0 8px !important;
            }
            
            .gallery-item:active {
              transform: scale(0.98);
            }
          }
          
          /* 底部导航栏样式优化 */
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* 确保内容不被底部导航栏遮挡 */
          @media (max-width: 1023px) {
            body {
              padding-bottom: env(safe-area-inset-bottom);
            }
          }
        `}</style>
      </div>
    </ClickStatsProvider>
  );
}

/**
 * 应用主组件 - 使用LanguageProvider包装
 */
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
