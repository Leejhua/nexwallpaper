import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VideoGenerator from './VideoGenerator';
import { useLanguage } from '../contexts/LanguageContext';

const TemplateCard = ({ title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 cursor-pointer"
  >
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

function CustomTemplates() {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState('templates'); // 'templates' or 'video-generator'
  
  const handleTemplateClick = (templateType) => {
    setCurrentView(templateType);
  };
  
  const handleBackToTemplates = () => {
    setCurrentView('templates');
  };
  
  if (currentView === 'video-generator') {
    return (
      <div>
        {/* 返回按钮 */}
        <div className="mb-4 mt-8">
          <button
            onClick={handleBackToTemplates}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← {t('customTemplates.backToTemplates')}
          </button>
        </div>
        <VideoGenerator />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
      className="p-4 bg-transparent dark:bg-gray-900"
    >
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">{t('customTemplates.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <TemplateCard 
          title={t('customTemplates.twoStepEditor.title')}
          description={t('customTemplates.twoStepEditor.description')}
          onClick={() => handleTemplateClick('video-generator')}
        />
        {/* 未来可以添加更多模板 */}
      </div>
    </motion.div>
  );
}

export default CustomTemplates;