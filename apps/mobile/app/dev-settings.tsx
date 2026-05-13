import { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { useLanguage } from '@/src/i18n';

export default function DevSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const d = dictionary.devSettings;

  const c = useMemo(
    () => ({
      screen: isDark ? '#000000' : '#F5F5F5',
      card: isDark ? '#1C1C1E' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      textSecondary: isDark ? '#AEAEB2' : '#7D7D7D',
      backBg: isDark ? '#2C2C2E' : '#E8E8E8',
      buttonBg: isDark ? '#0A84FF' : '#007AFF',
      buttonText: '#FFFFFF',
    }),
    [isDark],
  );

  const na = d.valueUnavailable;
  const appName = Constants.expoConfig?.name ?? na;
  const slug = Constants.expoConfig?.slug ?? na;
  const expoVersion = Constants.expoConfig?.version ?? na;
  const nativeVersion = Constants.nativeAppVersion ?? na;
  const nativeBuild = Constants.nativeBuildVersion ?? na;
  const executionEnv = Constants.executionEnvironment ?? na;

  const goBack = useCallback(() => {
    void Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  }, [router]);

  const onShowToast = useCallback(() => {
    void Haptics.selectionAsync();
    showToast({
      status: 'success',
      title: d.toastSampleTitle,
      description: d.toastSampleDescription,
      durationMs: 2800,
    });
  }, [d.toastSampleDescription, d.toastSampleTitle, showToast]);

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
        <Text style={[styles.headerTitle, { color: c.text }]}>{d.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={onShowToast}
          style={({ pressed }) => [
            styles.toastButton,
            { backgroundColor: c.buttonBg, opacity: pressed ? 0.88 : 1 },
          ]}>
          <Text style={[styles.toastButtonLabel, { color: c.buttonText }]}>{d.showSampleToast}</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{d.appInfo}</Text>
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <InfoRow label={d.labelName} value={appName} valueColor={c.text} mutedColor={c.textSecondary} />
          <InfoRow label={d.labelSlug} value={slug} valueColor={c.text} mutedColor={c.textSecondary} />
          <InfoRow label={d.labelVersion} value={expoVersion} valueColor={c.text} mutedColor={c.textSecondary} />
          <InfoRow
            label={d.labelNativeVersion}
            value={nativeVersion}
            valueColor={c.text}
            mutedColor={c.textSecondary}
          />
          <InfoRow
            label={d.labelNativeBuild}
            value={nativeBuild}
            valueColor={c.text}
            mutedColor={c.textSecondary}
          />
          <InfoRow
            label={d.labelExecutionEnv}
            value={executionEnv}
            valueColor={c.text}
            mutedColor={c.textSecondary}
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
  mutedColor,
  isLast,
}: {
  label: string;
  value: string;
  valueColor: string;
  mutedColor: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: mutedColor + '44' } : null,
      ]}>
      <Text style={[styles.infoLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  toastButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  toastButtonLabel: { fontSize: 16, fontWeight: '600' },
  sectionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  card: {
    borderRadius: 15,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: { paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 15, lineHeight: 20 },
});
