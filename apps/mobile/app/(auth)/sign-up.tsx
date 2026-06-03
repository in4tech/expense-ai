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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { useAuth } from '@/src/features/auth';
import { useAppTheme } from '@/src/theme';
import { href } from '@/src/navigation/href';
import { useLanguage } from '@/src/i18n';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const { signUp } = useAuth();
  const a = dictionary.auth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.screen }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: colors.chipOff }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{a.signUp}</Text>
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
          <Text style={[styles.title, { color: colors.text }]}>{a.signUpTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.hint }]}>{a.signUpSubtitle}</Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.text }]}>{a.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={a.emailPlaceholder}
              placeholderTextColor={colors.hint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.text }]}>{a.passwordLabel}</Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.hint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                style={[styles.inputInner, { color: colors.text }]}
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
                  color={colors.hint}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.text }]}>{a.confirmPasswordLabel}</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.hint}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
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
                backgroundColor: colors.link,
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
            <Text style={[styles.footerText, { color: colors.hint }]}>{a.haveAccount} </Text>
            <Pressable onPress={onSignIn} hitSlop={8}>
              <Text style={[styles.footerLink, { color: colors.link }]}>{a.signIn}</Text>
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
