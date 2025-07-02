import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, Filter, Search, RotateCcw } from 'lucide-react';
import { categories } from '../data/galleryData';

/**
 * 侧边栏组件 - 筛选和搜索控制
 */
const Sidebar = ({
  isOpen,
  onToggle,
  currentFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onClearSearch,
  onResetFilters,
  filteredItems,
  totalItems
}) => {
  return (
    <>
      {/* Pixiv风格侧边栏切换按钮 */}
      <motion.button
        onClick={onToggle}
        className={`fixed top-6 z-50 pixiv-btn-icon transition-all duration-300 focus:outline-none focus:ring-0 ${
          isOpen ? 'left-[260px]' : 'left-6'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'white',
          border: '1px solid #e0e0e0',
          color: '#0096fa',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          outline: 'none'
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </motion.button>

      {/* 侧边栏主体 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Pixiv风格移动端遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
              onClick={onToggle}
            />

            {/* Pixiv风格侧边栏内容 */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-40 overflow-y-auto pixiv-sidebar flex flex-col"
              style={{
                background: 'white',
                borderRight: '1px solid #e0e0e0',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
              }}
            >
              {/* 顶部区域 */}
              <div style={{ padding: '24px 24px 0 24px', flexShrink: 0 }}>
                {/* Pixiv风格标题 */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 
                    className="gradient-text"
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      background: 'linear-gradient(135deg, #0096fa, #0084d6)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    🐰 Labubu Gallery
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666666' }}>
                    {filteredItems} / {totalItems} 作品
                  </p>
                </div>

                {/* Pixiv风格搜索框 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: '#333333',
                    marginBottom: '12px'
                  }}>
                    <Search className="w-4 h-4" />
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>搜索</span>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="搜索标题、标签..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pixiv-input"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white',
                        color: '#333333',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={onClearSearch}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#999999',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 中间区域 - 分类列表居中 */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                padding: '0 24px'
              }}>
                {/* 分类筛选 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">分类筛选</span>
                  </div>
                  
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <motion.button
                        key={category.key}
                        onClick={() => onFilterChange(category.key)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          currentFilter === category.key
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium">{category.label}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          currentFilter === category.key
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {category.count}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部区域 */}
              <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
                {/* 重置按钮 */}
                {(currentFilter !== 'all' || searchTerm) && (
                  <motion.button
                    onClick={onResetFilters}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all mb-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="font-medium">重置筛选</span>
                  </motion.button>
                )}

                {/* 懒加载说明 */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-medium text-blue-800 mb-2">💡 浏览提示</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 向下滚动自动加载更多</li>
                    <li>• 瀑布流布局优化展示</li>
                    <li>• 视频悬停自动播放</li>
                    <li>• 点击卡片查看详情</li>
                  </ul>
                </div>

                {/* 版本信息 */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <p>React版 v2.0</p>
                  <p>懒加载 + 瀑布流</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
