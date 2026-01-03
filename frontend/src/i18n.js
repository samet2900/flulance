import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import trTranslation from './locales/tr/translation.json';

const resources = {
  tr: {
    translation: trTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // Always Turkish
    fallbackLng: 'tr',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
