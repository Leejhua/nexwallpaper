import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Tag, X } from 'lucide-react';

/**
 * 标签搜索组件 - 提供智能标签搜索和筛选功能
 */
const TagSearch = ({ items, onFilteredItemsChange, className = '' }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 提取所有唯一标签并按频率排序
  const allTags = useMemo(() => {
    const tagCount = {};
    
    items.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [items]);

  // 标签分类
  const tagCategories = useMemo(() => {
    const categories = t('tagCategories');

    const result = {};
    Object.entries(categories).forEach(([category, categoryTags]) => {
      result[category] = allTags.filter(({ tag }) => categoryTags.includes(tag));
    });

    return result;
  }, [allTags, t]);

  // 过滤标签（基于搜索词）
  const filteredTags = useMemo(() => {
    if (!searchTerm) return allTags.slice(0, 50); // 显示前50个热门标签
    
    return allTags.filter(({ tag }) => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [allTags, searchTerm]);

  // 根据选中标签过滤项目
  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) return items;
    
    return items.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false;
      
      // 所有选中的标签都必须存在（AND逻辑）
      return selectedTags.every(selectedTag => 
        item.tags.some(itemTag => itemTag.includes(selectedTag) || selectedTag.includes(itemTag))
      );
    });
  }, [items, selectedTags]);

  // 通知父组件过滤结果变化
  React.useEffect(() => {
    onFilteredItemsChange?.(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  // 添加标签
  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 移除标签
  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // 清除所有标签
  const clearAllTags = () => {
    setSelectedTags([]);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">智能标签搜索</h3>
        </div>
        <div className="text-sm text-gray-500">
          {filteredItems.length} / {items.length} 项目
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索标签..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg no-focus-outline transition-all duration-200"
        />
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">已选标签:</span>
            <button
              onClick={clearAllTags}
              className="clear-tags-btn no-focus-outline text-xs text-red-500 hover:text-red-700"
            >
              清除全部
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mb-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        {isExpanded ? '收起标签分类' : '展开标签分类'}
      </button>

      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* 分类标签 */}
            <div className="space-y-4">
              {Object.entries(tagCategories).map(([category, tags]) => (
                tags.length > 0 && (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 10).map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          disabled={selectedTags.includes(tag)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag} ({count})
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 热门标签 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">热门标签</h4>
              <div className="flex flex-wrap gap-2">
                {filteredTags.slice(0, 20).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={selectedTags.includes(tag)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag} ({count})
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TagSearch;
