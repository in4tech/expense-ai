import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';

import type { ChatThemeColors } from '@/src/theme/chat-colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** One theme per housing quick prompt (order matches i18n `chat.quickPrompts`). */
const PROMPT_THEMES: { icon: IoniconName; accent: string }[] = [
  { icon: 'home-outline', accent: '#34C759' },
  { icon: 'receipt-outline', accent: '#FF9500' },
  { icon: 'cash-outline', accent: '#5856D6' },
  { icon: 'school-outline', accent: '#32ADE6' },
];

export type ChatQuickPromptsProps = {
  prompts: readonly string[];
  sectionTitle: string;
  colors: ChatThemeColors;
  onSelectPrompt: (prompt: string) => void;
};

type QuickPromptCardProps = {
  prompt: string;
  index: number;
  colors: ChatThemeColors;
  isDark: boolean;
  onSelectPrompt: (prompt: string) => void;
};

function QuickPromptCard({ prompt, index, colors: c, isDark, onSelectPrompt }: QuickPromptCardProps) {
  const theme = PROMPT_THEMES[index % PROMPT_THEMES.length];

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectPrompt(prompt);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#E8E0F6',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.accent}22` }]}>
        <Ionicons name={theme.icon} size={20} color={theme.accent} />
      </View>
      <Text style={[styles.cardText, { color: c.quickChipText }]} numberOfLines={2}>
        {prompt}
      </Text>
      <Ionicons name="arrow-forward" size={16} color={c.textMuted} style={styles.cardChevron} />
    </Pressable>
  );
}

/** Suggestion cards above the composer when the thread is empty. */
export function ChatQuickPrompts({
  prompts,
  sectionTitle,
  colors: c,
  onSelectPrompt,
}: ChatQuickPromptsProps) {
  const isDark = useMemo(() => c.screen === '#000000', [c.screen]);

  return (
    <View style={styles.root}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: isDark ? '#3A3A3C' : '#EDE6FD' }]}>
          <Ionicons name="business-outline" size={14} color={isDark ? '#C4B5F8' : '#6B5CAE'} />
        </View>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{sectionTitle}</Text>
      </View>
      <View style={styles.cardList}>
        {prompts.map((prompt, index) => (
          <QuickPromptCard
            key={prompt}
            prompt={prompt}
            index={index}
            colors={c}
            isDark={isDark}
            onSelectPrompt={onSelectPrompt}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 4,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardList: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#1A1428',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardChevron: {
    flexShrink: 0,
    opacity: 0.7,
  },
});
