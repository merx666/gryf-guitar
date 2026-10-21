import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SupportedLang, LanguageInfo, SUPPORTED_LANGUAGES } from './types';
import { translations, TranslationKey } from './translations';
import { detectInitialLanguage, detectLanguageFromIp, setStoredLanguage } from './detector';

interface LanguageContextType {
  language: SupportedLang;
  setLanguage: (lang: SupportedLang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  currentLanguageInfo: LanguageInfo;
  isAutoDetected: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLang>(() => detectInitialLanguage());
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gryf_lang_manual') !== 'true';
    } catch {
      return true;
    }
  });

  // Zmiana języka
  const setLanguage = useCallback((newLang: SupportedLang) => {
    setLanguageState(newLang);
    setIsAutoDetected(false);
    setStoredLanguage(newLang, true);
    // Ustawienie atrybutu lang w tagu <html>
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  }, []);

  // W tle: asynchroniczne sprawdzenie geolokalizacji IP (tylko gdy język nie został wykryty lokalnie)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    // Jeśli język został już precyzyjnie rozpoznany z przeglądarki lub strefy czasowej, pomijamy zewnętrzne API
    if (language !== 'en' || !isAutoDetected) {
      return;
    }

    let isMounted = true;
    detectLanguageFromIp()
      .then((ipLang) => {
        if (isMounted && ipLang && ipLang !== language) {
          setLanguageState(ipLang);
          setStoredLanguage(ipLang, false);
          if (typeof document !== 'undefined') {
            document.documentElement.lang = ipLang;
          }
        }
      })
      .catch(() => {
        // Cichy fallback przy blokadzie przez AdBlock / brak sieci
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Funkcja translacyjna t('key', { param: val })
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = translations[language] || translations.en;
      let text = (dict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }

      return text;
    },
    [language]
  );

  const currentLanguageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      currentLanguageInfo,
      isAutoDetected,
    }),
    [language, setLanguage, t, currentLanguageInfo, isAutoDetected]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
