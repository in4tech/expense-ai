import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { useAuth } from '@/src/features/auth';
import {
  CountryCodePicker,
  emptyProfile,
  loadProfile,
  ProfileDropdown,
  saveProfile,
  type UserProfile,
} from '@/src/features/profile';
import { useLanguage } from '@/src/i18n';
import { href } from '@/src/navigation/href';

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return { value: day, label: String(day).padStart(2, '0') };
});

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  return { value: month, label: String(month).padStart(2, '0') };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => {
  const year = currentYear - i;
  return { value: year, label: String(year) };
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const p = dictionary.profile;

  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const c = useMemo(
    () => ({
      screen: isDark ? '#000000' : '#F5F5F5',
      card: isDark ? '#1C1C1E' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      muted: isDark ? '#AEAEB2' : '#7D7D7D',
      inputBg: isDark ? '#2C2C2E' : '#F2F2F2',
      inputBorder: isDark ? '#38383A' : '#E8E8EA',
      backBg: isDark ? '#2C2C2E' : '#E8E8E8',
      buttonBg: isDark ? '#0A84FF' : '#007AFF',
      avatarBg: isDark ? '#3A3A3C' : '#D1D1D6',
    }),
    [isDark],
  );

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const stored = await loadProfile(user.id);
      if (!cancelled) {
        setProfile(stored);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const goBack = useCallback(() => {
    void Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(href.mainSettings);
    }
  }, [router]);

  const patchProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const onPickAvatar = useCallback(async () => {
    void Haptics.selectionAsync();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast({ status: 'warning', title: p.avatarPermissionDenied, durationMs: 2800 });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      patchProfile({ avatarUri: result.assets[0].uri });
    }
  }, [p.avatarPermissionDenied, patchProfile, showToast]);

  const onSave = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await saveProfile(user.id, profile);
      showToast({ status: 'success', title: p.saveSuccess, durationMs: 2200 });
    } catch {
      showToast({ status: 'error', title: p.saveFailed, durationMs: 2800 });
    } finally {
      setSaving(false);
    }
  }, [p.saveFailed, p.saveSuccess, profile, showToast, user?.id]);

  if (!user) {
    return null;
  }

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
        <Text style={[styles.headerTitle, { color: c.text }]}>{p.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={p.changeAvatar}
                onPress={onPickAvatar}
                style={styles.avatarPressable}>
                {profile.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: c.avatarBg }]}>
                    <Ionicons name="person" size={48} color={c.muted} />
                  </View>
                )}
                <View style={[styles.avatarBadge, { backgroundColor: c.buttonBg }]}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            <View style={[styles.card, { backgroundColor: c.card }]}>
              <Field label={p.email} mutedColor={c.muted}>
                <Text style={[styles.readOnlyValue, { color: c.muted }]}>{user.email}</Text>
              </Field>

              <Field label={p.username} mutedColor={c.muted}>
                <TextInput
                  value={profile.username}
                  onChangeText={(username) => patchProfile({ username })}
                  placeholder={p.usernamePlaceholder}
                  placeholderTextColor={c.muted}
                  autoCapitalize="none"
                  style={[styles.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                />
              </Field>

              <Field label={p.bio} mutedColor={c.muted}>
                <TextInput
                  value={profile.bio}
                  onChangeText={(bio) => patchProfile({ bio })}
                  placeholder={p.bioPlaceholder}
                  placeholderTextColor={c.muted}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder },
                  ]}
                />
              </Field>

              <Field label={p.phone} mutedColor={c.muted}>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCodeWrap}>
                    <CountryCodePicker
                      label={p.countryCode}
                      value={profile.phoneCountryIso}
                      placeholder={p.selectCountryCode}
                      searchPlaceholder={p.searchCountry}
                      emptyLabel={p.noCountryResults}
                      onChange={(phoneCountryIso) => patchProfile({ phoneCountryIso })}
                      compact
                    />
                  </View>
                  <View style={styles.phoneNumberWrap}>
                    <Text style={[styles.inlineLabel, { color: c.muted }]}>{p.phoneNumber}</Text>
                    <TextInput
                      value={profile.phoneNumber}
                      onChangeText={(phoneNumber) => patchProfile({ phoneNumber })}
                      placeholder={p.phonePlaceholder}
                      placeholderTextColor={c.muted}
                      keyboardType="phone-pad"
                      style={[
                        styles.input,
                        { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder },
                      ]}
                    />
                  </View>
                </View>
              </Field>

              <Field label={p.address} mutedColor={c.muted}>
                <TextInput
                  value={profile.address}
                  onChangeText={(address) => patchProfile({ address })}
                  placeholder={p.addressPlaceholder}
                  placeholderTextColor={c.muted}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder },
                  ]}
                />
              </Field>

              <Field label={p.birthDate} mutedColor={c.muted}>
                <View style={styles.birthRow}>
                  <ProfileDropdown
                    label={p.day}
                    value={profile.birthDay}
                    placeholder={p.day}
                    options={DAYS}
                    onChange={(birthDay) => patchProfile({ birthDay })}
                    compact
                  />
                  <ProfileDropdown
                    label={p.month}
                    value={profile.birthMonth}
                    placeholder={p.month}
                    options={MONTHS}
                    onChange={(birthMonth) => patchProfile({ birthMonth })}
                    compact
                  />
                  <ProfileDropdown
                    label={p.year}
                    value={profile.birthYear}
                    placeholder={p.year}
                    options={YEARS}
                    onChange={(birthYear) => patchProfile({ birthYear })}
                    compact
                  />
                </View>
              </Field>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: c.screen,
                borderTopColor: c.inputBorder,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: c.buttonBg, opacity: pressed || saving ? 0.88 : 1 },
              ]}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveLabel}>{p.save}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Field({
  label,
  mutedColor,
  children,
}: {
  label: string;
  mutedColor: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: mutedColor }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatarSection: { alignItems: 'center', marginBottom: 20, gap: 8 },
  avatarPressable: { position: 'relative' },
  avatarImage: { width: 108, height: 108, borderRadius: 54 },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: { fontSize: 14 },
  card: {
    borderRadius: 15,
    padding: 16,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  readOnlyValue: { fontSize: 15, paddingVertical: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
  },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  countryCodeWrap: { width: 128 },
  phoneNumberWrap: { flex: 1, gap: 6 },
  inlineLabel: { fontSize: 13, fontWeight: '600' },
  birthRow: { flexDirection: 'row', gap: 8 },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
