import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/providers';
import { LanguageProvider } from '@/src/i18n';
import { QueryProvider } from '@/src/query/query-provider';

export const unstable_settings = {
  anchor: '(main)/(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <QueryProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(main)" />
                  <Stack.Screen name="(auth)" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryProvider>
    </LanguageProvider>
  );
}
