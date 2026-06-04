import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { en } from '@/src/i18n/en';
import { vn } from '@/src/i18n/vn';

type Language = 'en' | 'vn';

export type Dictionary = {
  tabs: {
    home: string;
    chat: string;
    settings: string;
  };
  home: {
    title: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingNight: string;
    guestName: string;
    notificationsA11y: string;
    loading: string;
    loadFailed: string;
    retry: string;
    empty: string;
    untitledHousing: string;
    roomCodeLabel: string;
    noAddress: string;
    electricityFee: string;
    waterFee: string;
    parkingFee: string;
    garbageFee: string;
    wifiAvailable: string;
    wifiUnknown: string;
    viewDetails: string;
    cardNewBadge: string;
    listingsTabAll: string;
    popularTitle: string;
    recommendationTitle: string;
    allListingsTitle: string;
    viewAll: string;
    viewAllBackA11y: string;
    searchPlaceholder: string;
    searchNoResults: string;
    filterTitle: string;
    filterHint: string;
    filterActive: string;
    filterClearAll: string;
    filterDone: string;
    filterNoResults: string;
    filterPriceSection: string;
    filterAmenitySection: string;
    filterPriceRanges: {
      under3m: string;
      '3to5m': string;
      '5to7m': string;
      '7to10m': string;
      above10m: string;
    };
    filterAmenities: {
      hasWifi: string;
      hasParking: string;
      hasPhotos: string;
    };
  };
  housingPredict: {
    title: string;
    heroTitle: string;
    heroDesc: string;
    inputTitle: string;
    inputSubtitle: string;
    requiredHint: string;
    resultTitle: string;
    resultEmpty: string;
    resultHint: string;
    insightTitle: string;
    insightPrefix: string;
    insightSegmentBudget: string;
    insightSegmentMidHigh: string;
    predictButton: string;
    predicting: string;
    addressTapHint: string;
    wifiLabel: string;
    selectPlaceholder: string;
    otherOption: string;
    otherInputPlaceholder: string;
    currencySuffix: string;
    sectionFees: string;
    sectionRoom: string;
    fields: {
      electricity_fee: { label: string };
      water_fee: { label: string };
      card_fee: { label: string };
      washing_machine_fee: { label: string };
      parking_fee: { label: string };
      garbage_fee: { label: string };
      otherfee: { label: string };
      address: { label: string; unit: string };
    };
  };
  housingPredictResult: {
    title: string;
    summaryTitle: string;
    coordinatesLabel: string;
    roomAmenitiesTitle: string;
    roomDetailsTitle: string;
    noAmenities: string;
    editAgain: string;
  };
  mapPickLocation: {
    title: string;
    searchPlaceholder: string;
    webFallback: string;
    selectedLabel: string;
    noSelection: string;
    hintTapMap: string;
    confirm: string;
  };
  houseDetail: {
    title: string;
    loading: string;
    loadFailed: string;
    retry: string;
    sectionOverview: string;
    sectionImages: string;
    sectionLocation: string;
    noImages: string;
    sectionProperty: string;
    sectionRoom: string;
    descriptionLabel: string;
    openInMaps: string;
    noRoom: string;
    noRoomFeatures: string;
    rentLabel: string;
    contactForPrice: string;
    yes: string;
    no: string;
    unknown: string;
    uploadImages: string;
    favoriteListing: string;
    uploadScreenTitle: string;
    uploadEmptyHint: string;
    uploadReviewHint: string;
    uploadAddPhotos: string;
    uploadSubmit: string;
    uploadSubmitting: string;
    uploadRemoveImage: string;
    uploadViewImage: string;
    uploadClosePreview: string;
    uploadNoImages: string;
    uploadPermissionDenied: string;
    uploadSuccess: string;
    uploadFailed: string;
    meta: {
      otherFee: string;
      cardFee: string;
      washingFee: string;
      electricityUnit: string;
      waterUnit: string;
      parkingUnit: string;
      cardUnit: string;
      garbageUnit: string;
      evCharging: string;
      lastUpdate: string;
      createdAt: string;
      updatedAt: string;
      roomLink: string;
    };
    roomStrings: {
      cooling_type: string;
      parking_space: string;
      toilet: string;
      time: string;
      gatelock: string;
      room_area: string;
      drying_yard: string;
      floor: string;
    };
    roomBool: {
      kitchen: string;
      desk: string;
      bed: string;
      elevator: string;
      tivi: string;
      mattress: string;
      pet: string;
      bancony: string;
      fridge: string;
      washer: string;
      hotwater: string;
      air_conditioner: string;
      kitchent_sink: string;
      window: string;
      wardrobe: string;
      skylight: string;
      attic: string;
    };
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
    loadingMore: string;
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
    quickPromptsTitle: string;
    quickPrompts: readonly string[];
  };
  notifications: {
    title: string;
    backA11y: string;
    empty: string;
    markAllRead: string;
    mockItems: readonly {
      id: string;
      kind: 'listing' | 'price_drop' | 'system' | 'reminder';
      title: string;
      body: string;
      timeLabel: string;
      read: boolean;
    }[];
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
  profile: {
    title: string;
    email: string;
    username: string;
    usernamePlaceholder: string;
    bio: string;
    bioPlaceholder: string;
    phone: string;
    countryCode: string;
    phoneNumber: string;
    selectCountryCode: string;
    searchCountry: string;
    noCountryResults: string;
    phonePlaceholder: string;
    address: string;
    addressPlaceholder: string;
    birthDate: string;
    day: string;
    month: string;
    year: string;
    changeAvatar: string;
    save: string;
    saveSuccess: string;
    saveFailed: string;
    avatarPermissionDenied: string;
  };
  devSettings: {
    title: string;
    showSampleToast: string;
    testPredictFlow: string;
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
    signUpTitle: string;
    signUpSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    forgotPassword: string;
    signInCta: string;
    signUpCta: string;
    orSignInWith: string;
    noAccount: string;
    haveAccount: string;
    signUp: string;
    signIn: string;
    socialComingSoon: string;
    fillEmailPassword: string;
    passwordMismatch: string;
    signInFailed: string;
    signUpFailed: string;
    registerSuccess: string;
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
