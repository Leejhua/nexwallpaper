import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * 简化的Modal调试组件
 */
const ModalDebug = ({ isOpen, item, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (item) {
      console.log('🔍 Modal Debug - Item received:', item);
      setImageLoaded(false);
      setImageError(false);
      
      // 收集调试信息
      setDebugInfo({
        hasItem: !!item,
        itemId: item?.id,
        itemUrl: item?.url,
        itemType: item?.type,
        itemTitle: item?.title,
        tagsCount: item?.tags?.length || 0,
        timestamp: new Date().toISOString()
      });
    }
  }, [item]);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully');
    setImageLoaded(true);
  };

  const handleImageError = (error) => {
    console.error('❌ Image load error:', error);
    setImageError(true);
  };

  if (!item) {
    console.log('⚠️ Modal Debug - No item provided');
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* 调试信息 */}
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">🔍 调试信息</h3>
                <pre className="text-xs text-gray-600">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>

              {/* 图片区域 */}
              <div className="relative">
                <h2 className="text-xl font-bold mb-4">{item.title}</h2>
                
                {/* 加载状态 */}
                {!imageLoaded && !imageError && (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div>加载中...</div>
                    </div>
                  </div>
                )}

                {/* 错误状态 */}
                {imageError && (
                  <div className="flex items-center justify-center h-64 bg-red-50 rounded">
                    <div className="text-center text-red-600">
                      <div>图片加载失败</div>
                      <div className="text-sm mt-2">URL: {item.url}</div>
                    </div>
                  </div>
                )}

                {/* 图片 */}
                <img
                  src={item.url}
                  alt={item.title}
                  className={`max-w-full h-auto rounded ${imageLoaded ? 'block' : 'hidden'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />

                {/* 基本信息 */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID:</strong> {item.id}
                  </div>
                  <div>
                    <strong>类型:</strong> {item.type}
                  </div>
                  <div>
                    <strong>分类:</strong> {item.category}
                  </div>
                  <div>
                    <strong>格式:</strong> {item.format}
                  </div>
                  <div className="col-span-2">
                    <strong>标签数量:</strong> {item.tags?.length || 0}
                  </div>
                </div>

                {/* 状态信息 */}
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                  <div><strong>图片已加载:</strong> {imageLoaded ? '✅' : '❌'}</div>
                  <div><strong>加载错误:</strong> {imageError ? '❌' : '✅'}</div>
                  <div><strong>URL长度:</strong> {item.url?.length || 0}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalDebug;
