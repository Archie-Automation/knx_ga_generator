import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { useLanguage } from '../i18n/useTranslation';

type Language = 'nl' | 'en' | 'es' | 'fr' | 'de';

const languages: { code: Language; flag: string; name: string }[] = [
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' }
];

export const LanguageSelector = () => {
  const { i18n: i18nInstance } = useTranslation();
  const { lang, setLanguage: setLanguageFromContext } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // Use the language from context (useLanguage hook) instead of i18n directly
  const currentLang = lang;
  const current = languages.find((l) => l.code === currentLang) || languages[0];
  
  const setLanguage = (lang: Language) => {
    console.log(`[LanguageSelector] Setting language to: "${lang}"`);
    // Update i18n, which will trigger LanguageProvider to update via the 'languageChanged' event
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="button ghost language-selector"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}
      >
        <span>{current.flag}</span>
        <span>{current.name}</span>
      </button>
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card language-selector-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              padding: 4,
              zIndex: 1000,
              minWidth: '150px'
            }}
          >
            {languages.map((l) => (
              <button
                key={l.code}
                className="button ghost"
                  onClick={() => {
                    setLanguage(l.code as Language);
                    setIsOpen(false);
                  }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: currentLang === l.code ? 'var(--color-selected)' : 'transparent'
                }}
              >
                <span>{l.flag}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

