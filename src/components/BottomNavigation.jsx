import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Image, Palette, Settings, Globe, Moon, ChevronUp } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

/**
 * 底部导航栏组件 - 移动端专用
 */
const BottomNavigation = ({ activeTab, onTabChange }) => {
  const { t, currentLanguage, changeLanguage, languages: availableLanguages } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    {
      id: 'gallery',
      label: t('gallery'),
      icon: Image,
      color: 'text-blue-500'
    },
    {
      id: 'custom',
      label: t('custom'),
      icon: Palette,
      color: 'text-purple-500'
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      color: 'text-gray-500',
      isSettings: true
    }
  ];

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setShowSettings(false);
  };

  return (
    <>
      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 lg:hidden"
          >
            <div className="p-4 space-y-4">
              {/* 语言设置 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Globe size={16} className="mr-2" />
                  {t('language')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(availableLanguages).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 主题设置 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Moon size={16} className="mr-2" />
                  {t('theme')}
                </h3>
                <div className="flex justify-center">
                  <ThemeSwitcher />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg lg:hidden"
      >
        <div className="flex items-center justify-around px-4 py-2 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSettings = item.isSettings;
            
            return (
              <button
                key={item.id}
                onClick={() => isSettings ? handleSettingsClick() : onTabChange(item.id)}
                className="flex flex-col items-center justify-center px-4 py-2 transition-colors duration-300 min-w-0 flex-1 mx-1"
              >
                <motion.div
                  animate={{
                    scale: isActive || (isSettings && showSettings) ? [1, 1.2, 1] : 1,
                    rotate: isActive || (isSettings && showSettings) ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                    times: [0, 0.3, 0.7, 1]
                  }}
                  className="flex items-center justify-center"
                >
                  {isSettings && showSettings ? (
                    <ChevronUp 
                      className={`w-5 h-5 mb-1 transition-colors duration-300 ${
                        showSettings 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} 
                    />
                  ) : (
                    <Icon 
                      className={`w-5 h-5 mb-1 transition-colors duration-300 ${
                        isActive || (isSettings && showSettings)
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} 
                    />
                  )}
                </motion.div>
                <motion.span 
                  animate={{
                    y: isActive || (isSettings && showSettings) ? [0, -2, 0] : 0,
                    opacity: isActive || (isSettings && showSettings) ? [1, 0.8, 1] : 1
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut"
                  }}
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isActive || (isSettings && showSettings)
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default BottomNavigation;