import React, { useState } from 'react';

const SortControls = ({ onSortChange, currentSort = 'default' }) => {
  const [activeSort, setActiveSort] = useState(currentSort);

  const sortOptions = [
    { key: 'default', label: '默认', icon: '📋' },
    { key: 'popularity', label: '热度', icon: '🔥' },
    { key: 'recent', label: '最新点击', icon: '🕒' },
    { key: 'downloads', label: '下载量', icon: '⬇️' },
    { key: 'likes', label: '最受喜欢', icon: '❤️' },
    { key: 'likeRate', label: '喜欢率', icon: '💖' }
  ];

  const handleSortChange = (sortKey) => {
    setActiveSort(sortKey);
    onSortChange?.(sortKey);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center mr-2">
        排序方式:
      </span>
      {sortOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => handleSortChange(option.key)}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
            transition-all duration-200 border
            ${activeSort === option.key
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
              : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
            }
          `}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SortControls;
