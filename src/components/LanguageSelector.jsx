import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, languages, currentLangData, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // ESC键关闭下拉菜单
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event, code) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageSelect(code);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="language-selector-btn no-focus-outline w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200"
        style={{ height: '40px', padding: '0 12px' }} // 40px = 8 * 5
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={`${currentLangData.name} flag`}>
            {currentLangData.flag}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {currentLangData.name}
          </span>
        </div>
        <motion.svg 
          className="w-4 h-4 text-gray-600"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
            role="listbox"
            aria-label={t('languageOptions')}
          >
            {Object.entries(languages).map(([code, lang], index) => (
              <motion.button
                key={code}
                onClick={() => handleLanguageSelect(code)}
                onKeyDown={(e) => handleKeyDown(e, code)}
                className={`language-option-btn no-focus-outline w-full flex items-center gap-3 text-left transition-colors duration-200 ${
                  currentLanguage === code 
                    ? 'bg-blue-100 text-blue-800 font-medium border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                style={{ height: '40px', padding: '0 12px' }} // 40px = 8 * 5
                whileHover={{ backgroundColor: currentLanguage === code ? undefined : 'rgba(59, 130, 246, 0.08)' }}
                role="option"
                aria-selected={currentLanguage === code}
                tabIndex={isOpen ? 0 : -1}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-lg" role="img" aria-label={`${lang.name} flag`}>
                  {lang.flag}
                </span>
                <span className="font-medium text-sm">
                  {lang.name}
                </span>
                {currentLanguage === code && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto text-blue-700 font-bold"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
