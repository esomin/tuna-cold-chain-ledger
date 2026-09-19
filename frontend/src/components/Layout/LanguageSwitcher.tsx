import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ko') ? 'ko' : 'en';

  const handleLanguageChange = (lang: 'ko' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold select-none">
      <button
        type="button"
        onClick={() => handleLanguageChange('ko')}
        className={`transition-colors duration-200 cursor-pointer p-1 ${
          currentLang === 'ko'
            ? 'text-sky-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        한국어
      </button>
      <span className="text-slate-600 font-light">|</span>
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`transition-colors duration-200 cursor-pointer p-1 ${
          currentLang === 'en'
            ? 'text-sky-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        ENG
      </button>
    </div>
  );
};
