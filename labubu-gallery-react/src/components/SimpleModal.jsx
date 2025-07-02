import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * 最简单的Modal测试组件
 */
const SimpleModal = ({ isOpen, item, onClose }) => {
  console.log('SimpleModal render:', { isOpen, item: !!item });

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-2xl w-full bg-white rounded-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-12">
              <h2 className="text-xl font-bold mb-4">{item.title}</h2>
              
              <div className="mb-4">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-auto rounded"
                  onLoad={() => console.log('Image loaded successfully')}
                  onError={() => console.log('Image failed to load')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>ID:</strong> {item.id}</div>
                <div><strong>类型:</strong> {item.type}</div>
                <div><strong>分类:</strong> {item.category}</div>
                <div><strong>格式:</strong> {item.format}</div>
                <div className="col-span-2">
                  <strong>标签:</strong> {item.tags?.join(', ') || '无'}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimpleModal;
