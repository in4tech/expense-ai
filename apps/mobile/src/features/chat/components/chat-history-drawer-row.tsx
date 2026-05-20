import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatConversation } from "@/src/features/chat/types";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatHistoryDrawerRowProps = {
  conversation: ChatConversation;
  isActive: boolean;
  colors: ChatThemeColors;
  onPickConversation: (conversationId: string) => void;
  onRequestClose: () => void;
};

export function ChatHistoryDrawerRow({
  conversation,
  isActive,
  colors: c,
  onPickConversation,
  onRequestClose,
}: ChatHistoryDrawerRowProps) {
  function handlePress() {
    onPickConversation(conversation.id);
    onRequestClose();
  }

  return (
    <View
      style={[
        styles.historyItem,
        {
          borderColor: c.historyItemBorder,
          backgroundColor: c.historyItemBg,
        },
        isActive && {
          borderColor: c.historyItemActiveBorder,
          backgroundColor: c.historyItemActiveBg,
        },
      ]}
    >
      <Pressable style={styles.historyItemMain} onPress={handlePress}>
        <ThemedText
          type="defaultSemiBold"
          numberOfLines={1}
          style={{ color: c.text }}
        >
          {conversation.title}
        </ThemedText>
        <ThemedText style={[styles.historyMeta, { color: c.historyMeta }]}>
          {new Date(conversation.updatedAt).toLocaleString()}
        </ThemedText>
      </Pressable>
    </View>
  );
}
