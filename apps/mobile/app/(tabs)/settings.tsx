import { StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/src/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { language, dictionary, toggleLanguage } = useLanguage();

  return (
    <SafeAreaView style={styles.keyboardContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {dictionary.settings.title}
        </ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">{dictionary.settings.languageTitle}</ThemedText>
          <ThemedText style={styles.helperText}>{dictionary.settings.languageDescription}</ThemedText>
          <ThemedText style={styles.currentLanguage}>
            {dictionary.settings.currentLanguage}:{' '}
            <ThemedText type="defaultSemiBold">
              {language === 'vn' ? dictionary.settings.vietnamese : dictionary.settings.english}
            </ThemedText>
          </ThemedText>
          <ThemedView style={styles.switchRow}>
            <ThemedText>{dictionary.settings.vietnamese}</ThemedText>
            <Switch
              value={language === 'en'}
              onValueChange={toggleLanguage}
              trackColor={{ false: '#b3b3b3', true: '#0a7ea4' }}
              thumbColor="#ffffff"
            />
            <ThemedText>{dictionary.settings.english}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  helperText: {
    opacity: 0.8,
  },
  currentLanguage: {
    marginTop: 4,
  },
  switchRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
