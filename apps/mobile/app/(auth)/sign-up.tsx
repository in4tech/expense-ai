import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/src/features/auth';
import { href } from '@/src/navigation/href';
import { useLanguage } from '@/src/i18n';

const BRAND_TINT = Colors.light.tint;

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const { signUp } = useAuth();
  const a = dictionary.auth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const palette = useMemo(
    () => ({
      screen: theme.background,
      text: theme.text,
      muted: theme.icon,
      inputBg: isDark ? '#1E1E1E' : '#F2F2F2',
      inputBorder: isDark ? '#38383A' : '#E8E8EA',
      link: BRAND_TINT,
      backBg: isDark ? '#2C2C2E' : '#E8E8E8',
    }),
    [isDark, theme.background, theme.icon, theme.text],
  );

  const goBack = useCallback(() => {
    void Haptics.selectionAsync();
    router.back();
  }, [router]);

  const onSignUp = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast({ status: 'warning', title: a.fillEmailPassword, durationMs: 2400 });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ status: 'warning', title: a.passwordMismatch, durationMs: 2400 });
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp({ email: trimmedEmail, password });
      showToast({ status: 'success', title: a.registerSuccess, durationMs: 2200 });
      router.replace(href.mainChat);
    } catch (error) {
      const message = error instanceof Error ? error.message : a.signUpFailed;
      showToast({ status: 'error', title: message || a.signUpFailed, durationMs: 3200 });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    a.fillEmailPassword,
    a.passwordMismatch,
    a.registerSuccess,
    a.signUpFailed,
    confirmPassword,
    email,
    password,
    router,
    showToast,
    signUp,
  ]);

  const onSignIn = useCallback(() => {
    void Haptics.selectionAsync();
    router.replace(href.authSignIn);
  }, [router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.screen }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: palette.backBg }]}>
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>{a.signUp}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: palette.text }]}>{a.signUpTitle}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>{a.signUpSubtitle}</Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: palette.text }]}>{a.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={a.emailPlaceholder}
              placeholderTextColor={palette.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.text,
                },
              ]}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: palette.text }]}>{a.passwordLabel}</Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                },
              ]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={palette.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                style={[styles.inputInner, { color: palette.text }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={12}
                style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={palette.muted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: palette.text }]}>{a.confirmPasswordLabel}</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.text,
                },
              ]}
            />
          </View>

          <Pressable
            onPress={() => void onSignUp()}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: BRAND_TINT,
                opacity: isSubmitting ? 0.65 : pressed ? 0.9 : 1,
              },
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{a.signUpCta}</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: palette.muted }]}>{a.haveAccount} </Text>
            <Pressable onPress={onSignIn} hitSlop={8}>
              <Text style={[styles.footerLink, { color: palette.link }]}>{a.signIn}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 20,
    paddingRight: 8,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  primaryButton: {
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
  },
});
