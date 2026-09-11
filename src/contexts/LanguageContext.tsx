import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
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

export function LanguageProvider({
  children,
  initialLanguage = 'de',
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    writeLangCookie(lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string, vars?: MessageVars) => lookupMessage(messages, language, key, vars),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
