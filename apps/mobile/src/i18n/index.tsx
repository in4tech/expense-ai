import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { en } from '@/src/i18n/en';
import { vn } from '@/src/i18n/vn';

type Language = 'en' | 'vn';

type Dictionary = {
  tabs: {
    chat: string;
    settings: string;
  };
  chat: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    typingHint: string;
    liveChat: string;
    assistantName: string;
    you: string;
    typing: string;
    retry: string;
    inputPlaceholder: string;
    send: string;
    clear: string;
    quickPrompts: readonly string[];
  };
  settings: {
    title: string;
    languageTitle: string;
    languageDescription: string;
    currentLanguage: string;
    vietnamese: string;
    english: string;
    changeLanguage: string;
    profileName: string;
    profileRole: string;
    otherSettings: string;
    profileDetails: string;
    password: string;
    notifications: string;
    language: string;
    darkMode: string;
    aboutApp: string;
    helpFaq: string;
    deactivateAccount: string;
    comingSoon: string;
    deactivateConfirmTitle: string;
    deactivateConfirmMessage: string;
    cancel: string;
    confirm: string;
  };
};

type LanguageContextValue = {
  language: Language;
  dictionary: Dictionary;
  toggleLanguage: () => void;
};

const dictionaries: Record<Language, Dictionary> = {
  en,
  vn,
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dictionary: dictionaries[language],
      toggleLanguage: () => setLanguage((current) => (current === 'vn' ? 'en' : 'vn')),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
