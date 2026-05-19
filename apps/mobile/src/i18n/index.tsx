import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

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
    statusPlanning: string;
    statusReadingPdf: string;
    statusSearchingWeb: string;
    statusGeneratingAnswer: string;
    retry: string;
    inputPlaceholder: string;
    today: string;
    yesterday: string;
    send: string;
    attachFile: string;
    removeAttachment: string;
    pickFileFailed: string;
    composeMessageFailed: string;
    chatActionFailed: string;
    attachMenuTitle: string;
    attachMenuPhoto: string;
    attachMenuDocument: string;
    pickImageFailed: string;
    pickImagePermissionDenied: string;
    imageAttachDefaultNote: string;
    binaryDocumentFallback: string;
    pickedKindImage: string;
    pickedKindDocument: string;
    clear: string;
    scrollToLatest: string;
    newChatA11y: string;
    moreMenuA11y: string;
    temporaryChatTitle: string;
    temporaryChatBody: string;
    temporaryChatA11y: string;
    menuDelete: string;
    menuReport: string;
    menuShare: string;
    moreMenuTitle: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    deleteServerConfirmMessage: string;
    recentsTitle: string;
    newChatButton: string;
    noConversations: string;
    refreshHistoryA11y: string;
    deleteConversationA11y: string;
    reportAckTitle: string;
    reportAckMessage: string;
    shareFailed: string;
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
    settingsPrivacySection: string;
    helpSupportSection: string;
    developerSection: string;
    appLanguage: string;
    logout: string;
    devSettings: string;
    logoutConfirmTitle: string;
    logoutConfirmMessage: string;
    logoutSuccess: string;
  };
  devSettings: {
    title: string;
    showSampleToast: string;
    toastSampleTitle: string;
    toastSampleDescription: string;
    appInfo: string;
    labelName: string;
    labelSlug: string;
    labelVersion: string;
    labelNativeVersion: string;
    labelNativeBuild: string;
    labelExecutionEnv: string;
    valueUnavailable: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    forgotPassword: string;
    signInCta: string;
    orSignInWith: string;
    noAccount: string;
    signUp: string;
    socialComingSoon: string;
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'vn' ? 'en' : 'vn'));
  }, []);

  const value = useMemo(
    function buildLanguageContextValue(): LanguageContextValue {
      return {
        language,
        dictionary: dictionaries[language],
        toggleLanguage,
      };
    },
    [language, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
