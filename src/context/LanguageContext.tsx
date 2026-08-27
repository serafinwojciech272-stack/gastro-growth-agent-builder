import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language } from '../i18n/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;

  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

import { translations } from '../i18n/translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('de-lang') as Language | null;
    if (saved && ['de', 'en', 'pl'].includes(saved)) return saved;
    return 'de';
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('de-lang', l);
    document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string) => {
      const parts = key.split('.');

      let value: any = translations[lang];
      for (const part of parts) {
        value = value?.[part];
      }
      return value ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}


export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

