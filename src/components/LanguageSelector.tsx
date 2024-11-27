import React from 'react';
import { IoLanguage } from 'react-icons/io5';
import { useTranslation } from '../contexts/TranslationContext';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh-CN', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, isTranslationLoaded } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;
    changeLanguage(selectedLanguage);
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="relative inline-flex items-center group">
        <IoLanguage className="w-5 h-5 text-green-100 group-hover:text-white mr-2 transition-colors duration-200" />
        
        {!isTranslationLoaded ? (
          <div className="animate-pulse bg-green-700 rounded-md h-8 w-24" />
        ) : (
          <select
            onChange={handleLanguageChange}
            value={currentLanguage}
            className="appearance-none bg-green-700 text-green-100 hover:text-white border border-green-500 
                     rounded-md px-3 py-1.5 pr-8 text-sm font-medium transition-all duration-200
                     hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 
                     focus:border-transparent cursor-pointer"
          >
            {LANGUAGES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        )}
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-green-100 group-hover:text-white transition-colors duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;