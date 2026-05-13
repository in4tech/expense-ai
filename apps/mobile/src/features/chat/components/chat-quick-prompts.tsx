import { Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import type { ChatThemeColors } from '@/src/theme/chat-colors';

export type ChatQuickPromptsProps = {
  prompts: readonly string[];
  colors: ChatThemeColors;
  onSelectPrompt: (prompt: string) => void;
};

type QuickPromptChipProps = {
  prompt: string;
  colors: ChatThemeColors;
  onSelectPrompt: (prompt: string) => void;
};

function QuickPromptChip({ prompt, colors: c, onSelectPrompt }: QuickPromptChipProps) {
  function handlePress() {
    void onSelectPrompt(prompt);
  }

  return (
    <Pressable
      style={[
        styles.quickPromptChip,
        { backgroundColor: c.quickChipBg, borderColor: c.quickChipBorder },
      ]}
      onPress={handlePress}>
      <ThemedText style={[styles.quickPromptText, { color: c.quickChipText }]}>{prompt}</ThemedText>
    </Pressable>
  );
}

/** Horizontal quick-reply chips when the thread is empty; isolate for future layout/theming changes. */
export function ChatQuickPrompts({ prompts, colors: c, onSelectPrompt }: ChatQuickPromptsProps) {
  function renderQuickPromptChip(prompt: string) {
    return <QuickPromptChip key={prompt} prompt={prompt} colors={c} onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <View style={styles.heroState}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptList}>
        {prompts.map(renderQuickPromptChip)}
      </ScrollView>
    </View>
  );
}
