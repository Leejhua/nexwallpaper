import React, { createContext, useContext, useState, useEffect } from 'react';
import { languages, defaultLanguage } from '../data/languages';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('labubu-gallery-language');
    return saved && languages[saved] ? saved : defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem('labubu-gallery-language', currentLanguage);
  }, [currentLanguage]);

  const changeLanguage = (langCode) => {
    if (languages[langCode]) {
      setCurrentLanguage(langCode);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = languages[currentLanguage].translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages,
    currentLangData: languages[currentLanguage]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
