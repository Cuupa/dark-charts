import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react';
import { useKV } from '@/hooks/useKV';
import { writeLangCookie } from '@/i18n/cookie';
import { messages } from '@/i18n/messages';
import { lookupMessage, type Language, type MessageVars } from '@/i18n/translate';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: MessageVars) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useKV<Language>('app-language', 'de');
  const current = language || 'de';

  const setLanguage = useCallback(
    (lang: Language) => {
      writeLangCookie(lang);
      void setLanguageState(lang);
    },
    [setLanguageState]
  );

  useEffect(() => {
    writeLangCookie(current);
  }, [current]);

  const t = useCallback(
    (key: string, vars?: MessageVars) => lookupMessage(messages, current, key, vars),
    [current]
  );

  return (
    <LanguageContext.Provider value={{ language: current, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(lookupMessage(messages, 'de', 'error.useLanguage'));
  }
  return context;
}
