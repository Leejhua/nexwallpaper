import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Gallery from './components/Gallery';
import Modal from './components/Modal';
import SortControls from './components/SortControls';
import { useGallery } from './hooks/useGallery';
import { useModal } from './hooks/useModal';
import { useScrollPosition } from './hooks/useScrollPosition';
import { ClickStatsProvider } from './contexts/ClickStatsProvider';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTagTranslation } from './hooks/useTagTranslation';
import './styles/lazy-loading.css';
import './styles/button-focus-fix.css';

/**
 * 主应用组件内容 - 优化懒加载版本，避免闪屏白屏
 */
function AppContent() {
  const { translateTag } = useTagTranslation();
  const { scrollToTop } = useScrollPosition(); // 滚动位置管理
  // 根据屏幕大小设置侧边栏初始状态
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // 如果是服务端渲染或者窗口对象不存在，默认为true
    if (typeof window === 'undefined') return true;
    // 桌面端默认展开，移动端默认收起
    return window.innerWidth >= 1024;
  });
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
    // 🔝 新搜索时滚动到顶部，提供清晰的浏览体验
    scrollToTop();
  }, [handleSearch, scrollToTop]);

  useEffect(() => {
    const handleResize = () => {
      // 在移动端（小于1024px）时自动关闭侧边栏
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        // 在桌面端（大于等于1024px）时保持侧边栏展开
        setSidebarOpen(true);
      }
    };

    // 初始化时根据屏幕大小设置侧边栏状态
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
      <div className="min-h-screen custom-scrollbar">
        {/* Pixiv风格侧边栏 */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentFilter={selectedFilters}
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
              <div className="pixiv-header w-full" style={{ 
                marginBottom: '24px',
                paddingTop: '24px'
              }}>
                {/* Header组件 - 保持居中 */}
                <div className="w-full flex justify-center mb-6">
                  <Header />
                </div>
                
                {/* 排序控制 - 居中显示 */}
                <div className="w-full flex justify-center">
                  <SortControls 
                    onSortChange={setSortMode}
                    currentSort={sortMode}
                  />
                </div>
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
                  currentFilter={selectedFilters}
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
          onTagClick={handleTagClick}
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
