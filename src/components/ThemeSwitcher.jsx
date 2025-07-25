import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ThemeSwitcher = () => {
  const { t } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      onClick={handleThemeChange} 
      className="flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-md"
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        color: '#666666'
      }}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 mr-2" style={{ color: '#ff9500' }} />
          <span className="text-sm font-medium">{t('lightMode')}</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" style={{ color: '#666666' }} />
          <span className="text-sm font-medium">{t('darkMode')}</span>
        </>
      )}
    </button>
  );
};

export default ThemeSwitcher;