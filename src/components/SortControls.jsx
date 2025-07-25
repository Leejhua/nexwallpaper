import React, { useState, useRef, useEffect } from 'react';
import { List, TrendingUp, Clock, Download, Heart, Star, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SortControls = ({ onSortChange, currentSort = 'default', isMobile = false }) => {
  const { t } = useLanguage();
  const [activeSort, setActiveSort] = useState(currentSort);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { key: 'default', label: t('sortModes.default'), icon: List },
    { key: 'popularity', label: t('sortModes.popularity'), icon: TrendingUp },
    { key: 'recent', label: t('sortModes.recent'), icon: Clock },
    { key: 'downloads', label: t('sortModes.downloads'), icon: Download },
    { key: 'likes', label: t('sortModes.likes'), icon: Heart },
    { key: 'likeRate', label: t('sortModes.likeRate'), icon: Star }
  ];

  const currentOption = sortOptions.find(option => option.key === activeSort) || sortOptions[0];

  const handleSortChange = (sortKey) => {
    setActiveSort(sortKey);
    onSortChange?.(sortKey);
    setIsDropdownOpen(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex justify-center items-center">
      <div className="relative" ref={dropdownRef}>
        {/* 切换按钮 - Pixiv风格 */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            pixiv-btn pixiv-btn-secondary flex items-center gap-2 px-4 h-12
            justify-between focus:outline-none transition-all duration-200
            ${isMobile ? 'min-w-[120px]' : 'min-w-[140px]'}
            hover:shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
            text-gray-600 dark:text-gray-300
          `}
          style={{
            borderRadius: isMobile ? '12px' : '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <div className="flex items-center gap-2">
            <currentOption.icon 
              size={18} 
              className="text-gray-600 dark:text-gray-300"
            />
            <span className="font-medium">{currentOption.label}</span>
          </div>
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 text-gray-400 dark:text-gray-500 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 下拉菜单 - Pixiv风格 */}
        {isDropdownOpen && (
          <div 
            className={`
              absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-600 shadow-lg dark:shadow-gray-900/20
              z-[9999] overflow-hidden
              ${isMobile ? 'rounded-xl' : 'rounded-lg'}
            `}
            style={{
              borderRadius: isMobile ? '12px' : '8px'
            }}
          >
            {sortOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => handleSortChange(option.key)}
                className={`
                  w-full flex items-center gap-2 px-4 h-10 text-sm text-left
                  transition-colors duration-150 border-b border-gray-100 dark:border-gray-700
                  ${
                    activeSort === option.key 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                style={{
                  fontSize: '14px'
                }}
              >
                <option.icon 
                  size={16} 
                  className={`${
                    activeSort === option.key 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SortControls;
