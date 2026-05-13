import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Appearance,
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
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useLanguage } from '@/src/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_URI = 'https://i.pravatar.cc/160?img=68';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { language, dictionary, toggleLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(isDark);

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
      router.navigate('/(tabs)/chat');
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
          style={[styles.card, styles.profileCard, { backgroundColor: c.card }]}
          onPress={comingSoon}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" transition={200} />
          <View style={styles.profileTextBlock}>
            <Text style={[styles.profileName, { color: c.text }]}>{dictionary.settings.profileName}</Text>
            <Text style={[styles.profileRole, { color: c.textSecondary }]}>{dictionary.settings.profileRole}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.chevron} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{dictionary.settings.otherSettings}</Text>
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <SettingsRow
            icon="person-outline"
            label={dictionary.settings.profileDetails}
            onPress={comingSoon}
            dividerColor={c.divider}
            textColor={c.text}
            chevronColor={c.chevron}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label={dictionary.settings.password}
            onPress={comingSoon}
            dividerColor={c.divider}
            textColor={c.text}
            chevronColor={c.chevron}
          />
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
            label={dictionary.settings.language}
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

        <View style={[styles.card, styles.bottomCard, { backgroundColor: c.card }]}>
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
      </ScrollView>
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  profileTextBlock: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  bottomCard: {
    marginTop: 18,
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
