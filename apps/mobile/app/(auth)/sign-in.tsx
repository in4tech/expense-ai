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

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { dictionary } = useLanguage();
  const { showToast } = useToast();
  const a = dictionary.auth;

  const { signIn } = useAuth();
  const [email, setEmail] = useState(__DEV__ ? 'demo-pca@yopmail.com' : '');
  const [password, setPassword] = useState(__DEV__ ? '123456' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignIn = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast({ status: 'warning', title: a.fillEmailPassword, durationMs: 2400 });
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn({ email: trimmedEmail, password });
      router.replace(href.mainChat);
    } catch (error) {
      const message = error instanceof Error ? error.message : a.signInFailed;
      showToast({ status: 'error', title: message || a.signInFailed, durationMs: 3200 });
    } finally {
      setIsSubmitting(false);
    }
  }, [a.fillEmailPassword, a.signInFailed, email, password, router, showToast, signIn]);

  const onForgotPassword = useCallback(() => {
    void Haptics.selectionAsync();
    showToast({ status: 'warning', title: dictionary.settings.comingSoon, durationMs: 2200 });
  }, [dictionary.settings.comingSoon, showToast]);

  const onSocial = useCallback(() => {
    void Haptics.selectionAsync();
    showToast({ status: 'warning', title: a.socialComingSoon, durationMs: 2400 });
  }, [a.socialComingSoon, showToast]);

  const onSignUp = useCallback(() => {
    void Haptics.selectionAsync();
    router.push(href.authSignUp);
  }, [router]);

  const togglePassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.screen }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>{a.signInTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.hint }]}>{a.signInSubtitle}</Text>

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
                autoComplete="password"
                textContentType="password"
                style={[styles.inputInner, { color: colors.text }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={togglePassword}
                hitSlop={12}
                style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={colors.hint}
                />
              </Pressable>
            </View>
            <Pressable onPress={onForgotPassword} style={styles.forgotWrap}>
              <Text style={[styles.forgot, { color: colors.link }]}>{a.forgotPassword}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void onSignIn()}
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
              <Text style={styles.primaryButtonText}>{a.signInCta}</Text>
            )}
          </Pressable>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.divider }]} />
            <Text style={[styles.orText, { color: colors.hint }]}>{a.orSignInWith}</Text>
            <View style={[styles.orLine, { backgroundColor: colors.divider }]} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              onPress={onSocial}
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: colors.socialBg,
                  borderColor: colors.socialBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="logo-apple" size={26} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={onSocial}
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: colors.socialBg,
                  borderColor: colors.socialBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="logo-google" size={24} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={onSocial}
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: colors.socialBg,
                  borderColor: colors.socialBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="logo-facebook" size={24} color={colors.link} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.hint }]}>{a.noAccount} </Text>
            <Pressable onPress={onSignUp} hitSlop={8}>
              <Text style={[styles.footerLink, { color: colors.link }]}>{a.signUp}</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
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
    marginBottom: 32,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgot: {
    fontSize: 14,
    fontWeight: '600',
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
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orText: {
    fontSize: 13,
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginBottom: 36,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
