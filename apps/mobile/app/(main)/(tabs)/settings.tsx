import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Appearance,
  Image,
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';

import { BottomSheet } from '@/components/bottom-sheet';
import { useToast } from '@/components/toast';
import { isDevMode } from '@/src/config/dev-mode';
import { useAuth } from '@/src/features/auth';
import { getDefaultAvatarUri, loadProfile } from '@/src/features/profile';
import { href } from '@/src/navigation/href';
import { useLanguage } from '@/src/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROFILE_AVATAR_SIZE = 52;

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { language, dictionary, toggleLanguage } = useLanguage();
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(isDark);
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  const c = {
    screen: isDark ? '#000000' : '#F5F5F5',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#AEAEB2' : '#7D7D7D',
    divider: isDark ? '#38383A' : '#EBEBEB',
    chevron: isDark ? '#636366' : '#C7C7CC',
    backBg: isDark ? '#2C2C2E' : '#E8E8E8',
    danger: '#D9534F',
  };

  const goBack = () => {
    void Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate(href.mainChat);
    }
  };

  const comingSoon = () => {
    void Haptics.selectionAsync();
    Alert.alert('', dictionary.settings.comingSoon);
  };

  const onDeactivate = () => {
    void Haptics.selectionAsync();
    Alert.alert(dictionary.settings.deactivateConfirmTitle, dictionary.settings.deactivateConfirmMessage, [
      { text: dictionary.settings.confirm, style: 'default' },
    ]);
  };

  const onDarkToggle = (value: boolean) => {
    setDarkMode(value);
    Appearance.setColorScheme(value ? 'dark' : 'light');
  };

  const onLanguageRowPress = useCallback(() => {
    void Haptics.selectionAsync();
    toggleLanguage();
  }, [toggleLanguage]);

  const displayName = useMemo(() => {
    const trimmed = profileName.trim();
    if (trimmed) {
      return trimmed;
    }
    const emailPrefix = user?.email?.split('@')[0]?.trim();
    if (emailPrefix) {
      return emailPrefix;
    }
    return dictionary.settings.profileName;
  }, [dictionary.settings.profileName, profileName, user?.email]);

  const profileHandle = useMemo(() => {
    const trimmed = profileName.trim();
    if (trimmed) {
      const handle = trimmed.replace(/\s+/g, '').toLowerCase();
      return `@${handle}`;
    }
    const emailPrefix = user?.email?.split('@')[0]?.trim();
    if (emailPrefix) {
      return `@${emailPrefix}`;
    }
    return dictionary.settings.profileRole;
  }, [dictionary.settings.profileRole, profileName, user?.email]);

  const displayAvatarUri = useMemo(() => {
    if (avatarUri) {
      return avatarUri;
    }
    const seed = user?.id ?? user?.email ?? displayName;
    return getDefaultAvatarUri(seed, PROFILE_AVATAR_SIZE * 2);
  }, [avatarUri, displayName, user?.email, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setAvatarUri(null);
        setProfileName('');
        return;
      }
      let cancelled = false;
      void loadProfile(user.id).then((profile) => {
        if (cancelled) {
          return;
        }
        setAvatarUri(profile.avatarUri);
        setProfileName(profile.username);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const onOpenProfile = useCallback(() => {
    void Haptics.selectionAsync();
    router.push(href.mainProfile);
  }, [router]);

  const onOpenDevSettings = useCallback(() => {
    void Haptics.selectionAsync();
    router.push(href.mainDevSettings);
  }, [router]);

  const onLogout = useCallback(() => {
    void Haptics.selectionAsync();
    setLogoutSheetOpen(true);
  }, []);

  const confirmLogout = useCallback(() => {
    void (async () => {
      try {
        await signOut();
      } finally {
        router.replace(href.authSignIn);
      }
    })();
  }, [router, signOut]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: c.backBg }]}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>{dictionary.settings.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={onOpenProfile}
          style={({ pressed }) => [
            styles.profileCard,
            { backgroundColor: c.card, opacity: pressed ? 0.92 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={dictionary.settings.profileDetails}>
          {displayAvatarUri ? (
            <Image source={{ uri: displayAvatarUri }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder, { backgroundColor: c.backBg }]}>
              <Ionicons name="person" size={28} color={c.textSecondary} />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: c.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileHandle, { color: c.textSecondary }]} numberOfLines={1}>
              {profileHandle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.chevron} />
        </Pressable>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <SettingsRow
            icon="notifications-outline"
            label={dictionary.settings.notifications}
            onPress={comingSoon}
            dividerColor={c.divider}
            textColor={c.text}
            chevronColor={c.chevron}
          />
          <SettingsRow
            icon="language-outline"
            label={dictionary.settings.appLanguage}
            onPress={onLanguageRowPress}
            dividerColor={c.divider}
            textColor={c.text}
            chevronColor={c.chevron}
            trailing={
              <Text style={[styles.trailingBadge, { color: c.textSecondary }]}>
                {language === 'vn' ? dictionary.settings.vietnamese : dictionary.settings.english}
              </Text>
            }
          />
          <SettingsRow
            icon="moon-outline"
            label={dictionary.settings.darkMode}
            dividerColor={c.divider}
            textColor={c.text}
            chevronColor={c.chevron}
            isLast
            trailing={
              <Switch
                value={darkMode}
                onValueChange={onDarkToggle}
                trackColor={{ false: '#78788055', true: '#34C759' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#78788055"
              />
            }
          />
        </View>

        <View style={styles.sectionBlock}>
          <View style={[styles.card, { backgroundColor: c.card }]}>
            <SettingsRow
              icon="information-circle-outline"
              label={dictionary.settings.aboutApp}
              onPress={comingSoon}
              dividerColor={c.divider}
              textColor={c.text}
              chevronColor={c.chevron}
            />
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              label={dictionary.settings.helpFaq}
              onPress={comingSoon}
              dividerColor={c.divider}
              textColor={c.text}
              chevronColor={c.chevron}
            />
            <Pressable onPress={onDeactivate} android_ripple={{ color: '#ff000022' }}>
              <View style={styles.rowInner}>
                <Ionicons name="trash-outline" size={22} color={c.danger} />
                <Text style={[styles.rowLabel, { color: c.danger }]}>{dictionary.settings.deactivateAccount}</Text>
                <Ionicons name="chevron-forward" size={20} color={c.chevron} style={styles.rowChevron} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, styles.logoutCard, { backgroundColor: c.card }]}>
          {isDevMode ? (
            <SettingsRow
              icon="code-slash-outline"
              label={dictionary.settings.devSettings}
              onPress={onOpenDevSettings}
              dividerColor={c.divider}
              textColor={c.text}
              chevronColor={c.chevron}
            />
          ) : null}
          <Pressable onPress={onLogout} android_ripple={{ color: '#ff000022' }}>
            <View style={styles.rowInner}>
              <Ionicons name="log-out-outline" size={22} color={c.danger} />
              <Text style={[styles.rowLabel, { color: c.danger }]}>{dictionary.settings.logout}</Text>
              <Ionicons name="chevron-forward" size={20} color={c.chevron} style={styles.rowChevron} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet
        open={logoutSheetOpen}
        onOpenChange={setLogoutSheetOpen}
        title={dictionary.settings.logoutConfirmTitle}
        message={dictionary.settings.logoutConfirmMessage}
        actions={[
          {
            label: dictionary.settings.logout,
            variant: 'destructive',
            onPress: confirmLogout,
          },
        ]}
      />
    </SafeAreaView>
  );
}

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function SettingsRow({
  icon,
  label,
  onPress,
  dividerColor,
  textColor,
  chevronColor,
  trailing,
  isLast,
}: {
  icon: IoniconName;
  label: string;
  onPress?: () => void;
  dividerColor: string;
  textColor: string;
  chevronColor: string;
  trailing?: ReactNode;
  isLast?: boolean;
}) {
  const borderStyle = !isLast
    ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor }
    : undefined;

  function rowPressableStyle(state: PressableStateCallbackType) {
    return state.pressed ? styles.rowPressed : undefined;
  }

  const inner = (
    <View style={[styles.rowInner, borderStyle]}>
      <Ionicons name={icon} size={22} color={textColor} />
      <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.rowTrailing}>
        {trailing}
        {onPress ? <Ionicons name="chevron-forward" size={20} color={chevronColor} style={styles.rowChevron} /> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={rowPressableStyle}>
        {inner}
      </Pressable>
    );
  }

  return <View>{inner}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionBlock: {
    marginTop: 12,
  },
  card: {
    borderRadius: 15,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profileAvatar: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: PROFILE_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  profileHandle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 0,
  },
  logoutCard: {
    marginTop: 12,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.72,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowChevron: {
    marginLeft: 4,
  },
  trailingBadge: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 120,
  },
});
