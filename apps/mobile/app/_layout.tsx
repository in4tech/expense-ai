import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/src/providers';
import { LanguageProvider } from '@/src/i18n';
import { QueryProvider } from '@/src/query/query-provider';
import { AppThemeProvider } from '@/src/theme';

export const unstable_settings = {
  anchor: '(main)/(tabs)',
};

export default function RootLayout() {
  return (
    <LanguageProvider>
      <QueryProvider>
        <AuthProvider>
          <AppThemeProvider>
            <SafeAreaProvider>
              <ToastProvider>
                <ThemeProvider value={DarkTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(main)" />
                  <Stack.Screen name="(auth)" />
                </Stack>
                <StatusBar style="light" />
                </ThemeProvider>
              </ToastProvider>
            </SafeAreaProvider>
          </AppThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </LanguageProvider>
  );
}
