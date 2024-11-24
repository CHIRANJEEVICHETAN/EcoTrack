import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// import React from 'react';
// import { useTranslation } from 'react-i18next';

// const languages = [
//   { code: 'en', name: 'English' },
//   { code: 'es', name: 'Español' },
//   { code: 'hi', name: 'हिंदी' },
//   { code: 'kn', name: 'ಕನ್ನಡ' },
//   { code: 'ru', name: 'Русский' }
// ];

// export default function LanguageSelector() {
//   const { i18n } = useTranslation();

//   const changeLanguage = async (languageCode: string) => {
//     try {
//       // Dynamically load the language file
//       const translations = await import(`../locales/${languageCode}.json`);
//       i18n.addResourceBundle(languageCode, 'translation', translations.default, true, true);
//       await i18n.changeLanguage(languageCode);
//     } catch (error) {
//       console.error(`Failed to load language: ${languageCode}`, error);
//     }
//   };

//   return (
//     <div className="relative inline-block text-left">
//       <select
//         value={i18n.language}
//         onChange={(e) => changeLanguage(e.target.value)}
//         className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
//       >
//         {languages.map((language) => (
//           <option key={language.code} value={language.code}>
//             {language.name}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }