import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation JSON files
import nl from '../locales/nl.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';

// Get saved language from localStorage or default to 'nl'
const getStoredLanguage = (): string => {
  try {
    const stored = localStorage.getItem('knx-language');
    if (stored && ['nl', 'en', 'de', 'fr', 'es'].includes(stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage not available, use default
  }
  return 'nl';
};

i18n
  // Load translation JSON files
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      nl: { translation: nl },
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es }
    },
    lng: getStoredLanguage(), // Default language
    fallbackLng: 'nl', // Fallback language
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Don't use suspense for better compatibility
    }
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('knx-language', lng);
  } catch (e) {
    // localStorage not available
  }
});

export default i18n;
