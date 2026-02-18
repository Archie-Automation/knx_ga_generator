import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { Language, getTranslation, getLanguageFromStorage, saveLanguageToStorage } from './translations';
import i18n from './i18n';

// Create a context for language state
const LanguageContext = createContext<{
  lang: Language;
  setLanguage: (lang: Language) => void;
}>({
  lang: 'nl',
  setLanguage: () => {}
});

// Provider component that manages language state globally
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>(getLanguageFromStorage());
  
  useEffect(() => {
    // Sync with localStorage on mount
    const storedLang = getLanguageFromStorage();
    setLangState(storedLang);
    
    // Sync i18n with stored language
    if (i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }
    
    // Listen for i18n language changes (when changed via i18n.changeLanguage)
    const handleI18nLanguageChange = (lng: string) => {
      const newLang = lng as Language;
      console.log(`[LanguageProvider] i18n language changed event: "${lng}" -> "${newLang}"`);
      if (['nl', 'en', 'es', 'fr', 'de'].includes(newLang)) {
        setLangState((currentLang) => {
          console.log(`[LanguageProvider] Updating lang state: "${currentLang}" -> "${newLang}"`);
          if (currentLang !== newLang) {
            saveLanguageToStorage(newLang);
            return newLang;
          }
          return currentLang;
        });
      }
    };
    
    // Listen for storage changes (in case language is changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'knx-language' && e.newValue) {
        const newLang = e.newValue as Language;
        if (['nl', 'en', 'es', 'fr', 'de'].includes(newLang)) {
          setLangState(newLang);
          i18n.changeLanguage(newLang);
        }
      }
    };
    
    i18n.on('languageChanged', handleI18nLanguageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      i18n.off('languageChanged', handleI18nLanguageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only run once on mount
  
  const setLanguage = (newLang: Language) => {
    console.log(`[LanguageProvider] setLanguage called: "${newLang}"`);
    saveLanguageToStorage(newLang);
    setLangState(newLang);
    // Also update i18n
    i18n.changeLanguage(newLang);
  };
  
  return (
    <LanguageContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context;
};

export const useTranslation = () => {
  const { lang } = useLanguage();
  const t = useMemo(() => getTranslation(lang), [lang]);
  return t;
};

