import { useCallback, useMemo, useState } from 'react';
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
import { PredictLoadingOverlay } from '@/src/features/housings/components/predict-loading-overlay';
import { buildMockPredictResultSnapshot } from '@/src/features/housings/predict-dev-mock';
import { PREDICT_LOADING_WAIT_MS } from '@/src/features/housings/predict-form-constants';
import { href } from '@/src/navigation/href';
import { setHousingPredictResult } from '@/src/navigation/housing-predict-result-bridge';
import { useLanguage } from '@/src/i18n';

export default function DevSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const d = dictionary.devSettings;
  const hp = dictionary.housingPredict;
  const [isMockPredicting, setIsMockPredicting] = useState(false);

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
      router.replace(href.mainSettings);
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

  const onTestPredictFlow = useCallback(async () => {
    if (isMockPredicting) return;
    void Haptics.selectionAsync();
    const hd = dictionary.houseDetail;
    setIsMockPredicting(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, PREDICT_LOADING_WAIT_MS));
      const snapshot = buildMockPredictResultSnapshot(
        {
          feeFields: hp.fields,
          addressLabel: hp.fields.address.label,
          wifiLabel: hp.wifiLabel,
          yes: hd.yes,
          no: hd.no,
          dash: hd.unknown,
          roomBool: hd.roomBool,
          roomStrings: hd.roomStrings,
        },
        hp.otherOption,
      );
      setHousingPredictResult(snapshot);
      router.push(href.mainHousingPredictResult);
    } finally {
      setIsMockPredicting(false);
    }
  }, [dictionary.houseDetail, hp, isMockPredicting, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={['top']}>
      <PredictLoadingOverlay visible={isMockPredicting} message={hp.predicting} />
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
        <View style={styles.devActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onShowToast}
            style={({ pressed }) => [
              styles.devButton,
              { backgroundColor: c.buttonBg, opacity: pressed ? 0.88 : 1 },
            ]}>
            <Text style={[styles.devButtonLabel, { color: c.buttonText }]}>{d.showSampleToast}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isMockPredicting}
            onPress={() => void onTestPredictFlow()}
            style={({ pressed }) => [
              styles.devButton,
              styles.devButtonSpaced,
              {
                backgroundColor: c.buttonBg,
                opacity: isMockPredicting ? 0.6 : pressed ? 0.88 : 1,
              },
            ]}>
            <Text style={[styles.devButtonLabel, { color: c.buttonText }]}>
              {isMockPredicting ? hp.predicting : d.testPredictFlow}
            </Text>
          </Pressable>
        </View>

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
  devButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonSpaced: { marginTop: 10 },
  devButtonLabel: { fontSize: 16, fontWeight: '600' },
  devActions: { marginBottom: 22 },
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
