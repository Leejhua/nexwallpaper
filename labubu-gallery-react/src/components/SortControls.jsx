import React, { useState } from 'react';
import { List, TrendingUp, Clock, Download, Heart, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SortControls = ({ onSortChange, currentSort = 'default' }) => {
  const { t } = useLanguage();
  const [activeSort, setActiveSort] = useState(currentSort);

  const sortOptions = [
    { key: 'default', label: t('sortModes.default'), icon: List },
    { key: 'popularity', label: t('sortModes.popularity'), icon: TrendingUp },
    { key: 'recent', label: t('sortModes.recent'), icon: Clock },
    { key: 'downloads', label: t('sortModes.downloads'), icon: Download },
    { key: 'likes', label: t('sortModes.likes'), icon: Heart },
    { key: 'likeRate', label: t('sortModes.likeRate'), icon: Star }
  ];

  const handleSortChange = (sortKey) => {
    setActiveSort(sortKey);
    onSortChange?.(sortKey);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center mr-2">
        {t('sortBy')}:
      </span>
      {sortOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => handleSortChange(option.key)}
          className={`
            sort-control-btn no-focus-outline
            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
            transition-all duration-200 border
            ${activeSort === option.key
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
              : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
            }
          `}
        >
          <option.icon size={16} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SortControls;
