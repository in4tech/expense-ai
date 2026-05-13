import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/i18n';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { dictionary } = useLanguage();

  const goBack = () => {
    void Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#E8E8E8' }]}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{dictionary.auth.signUp}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.bodyText, { color: theme.icon }]}>{dictionary.settings.comingSoon}</Text>
      </View>
    </SafeAreaView>
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
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  bodyText: { fontSize: 16, textAlign: 'center' },
});
