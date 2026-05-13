import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import type { ChatThemeColors } from '@/src/theme/chat-colors';

export type ChatScreenHeaderProps = {
  colors: ChatThemeColors;
  hasMessages: boolean;
  temporaryMode: boolean;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onToggleMoreMenu: () => void;
  onToggleTemporaryChat: () => void;
  labels: {
    newChatA11y: string;
    moreMenuA11y: string;
    temporaryChatA11y: string;
  };
};

export function ChatScreenHeader({
  colors: c,
  hasMessages,
  temporaryMode,
  onOpenHistory,
  onNewChat,
  onToggleMoreMenu,
  onToggleTemporaryChat,
  labels,
}: ChatScreenHeaderProps) {
  function handleOpenHistoryPress() {
    onOpenHistory();
  }

  function handleNewChatPress() {
    onNewChat();
  }

  function handleToggleMoreMenuPress() {
    onToggleMoreMenu();
  }

  function handleTemporaryChatPress() {
    onToggleTemporaryChat();
  }

  return (
    <View style={[styles.topBar, styles.topBarOverlay]} pointerEvents="box-none">
      <Pressable style={[styles.topActionButton, { backgroundColor: c.topActionBg }]} onPress={handleOpenHistoryPress}>
        <Ionicons name="menu-outline" size={24} color={c.topIcon} />
      </Pressable>
      <View style={styles.topActions}>
        {hasMessages ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.newChatA11y}
              style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}
              onPress={handleNewChatPress}>
              <Ionicons name="add" size={26} color={c.topIcon} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.moreMenuA11y}
              style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}
              onPress={handleToggleMoreMenuPress}>
              <Ionicons name="ellipsis-horizontal" size={22} color={c.topIcon} />
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.temporaryChatA11y}
            style={[
              styles.topActionButton,
              { backgroundColor: c.topActionBg },
              temporaryMode && { borderWidth: 2, borderColor: c.historyItemActiveBorder },
            ]}
            onPress={handleTemporaryChatPress}>
            <Ionicons name="flash-outline" size={24} color={c.topIcon} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
