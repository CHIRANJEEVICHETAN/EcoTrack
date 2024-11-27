import React, { createContext, useContext, useEffect, useState } from 'react';

interface TranslationContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  isTranslationLoaded: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslationLoaded, setIsTranslationLoaded] = useState(false);

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }

    // Cleanup function to remove existing elements
    const cleanup = () => {
      const elements = document.querySelectorAll('.goog-te-combo, .skiptranslate, .goog-te-banner-frame');
      elements.forEach(el => el.remove());
      const scripts = document.querySelectorAll('script[src*="translate.google.com"]');
      scripts.forEach(el => el.remove());
    };

    // Initial cleanup
    cleanup();

    // Create and append the translate element
    const translateElement = document.createElement('div');
    translateElement.id = 'google_translate_element';
    translateElement.style.display = 'none'; // Hide the default widget
    document.body.appendChild(translateElement);

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,es,fr,de,hi,bn,pa,ta,te,kn,ml,ar,zh-CN,ja,ko',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
          setIsTranslationLoaded(true);

          // Apply the saved language if it exists
          if (savedLanguage && savedLanguage !== 'en') {
            setTimeout(() => {
              const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (selectBox) {
                selectBox.value = savedLanguage;
                selectBox.dispatchEvent(new Event('change'));
              }
            }, 1000);
          }

          // Add custom styles to hide Google elements and improve UI
          const style = document.createElement('style');
          style.textContent = `
            .goog-te-banner-frame,
            .goog-te-gadget-icon,
            .goog-te-gadget-simple img,
            .goog-te-menu-value span,
            #google_translate_element,
            .goog-te-balloon-frame {
              display: none !important;
            }
            .goog-te-gadget-simple {
              background-color: transparent !important;
              border: none !important;
            }
            body {
              top: 0 !important;
            }
            .goog-tooltip,
            .goog-tooltip:hover {
              display: none !important;
            }
            .goog-text-highlight {
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (error) {
        console.error('Translation initialization error:', error);
      }
    };

    // Load Google Translate script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);

    return cleanup;
  }, []);

  const changeLanguage = (lang: string) => {
    const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectBox) {
      selectBox.value = lang;
      selectBox.dispatchEvent(new Event('change'));
      setCurrentLanguage(lang);
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  return (
    <TranslationContext.Provider value={{ currentLanguage, changeLanguage, isTranslationLoaded }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
