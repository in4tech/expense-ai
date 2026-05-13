import { useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ChatHistoryDrawerRow } from '@/src/features/chat/components/chat-history-drawer-row';
import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import { ChatConversation } from '@/src/features/chat/types';
import type { ChatThemeColors } from '@/src/theme/chat-colors';

export type ChatHistoryDrawerModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  colors: ChatThemeColors;
  drawerTranslateX: Animated.AnimatedInterpolation<number>;
  backdropOpacity: Animated.AnimatedInterpolation<number>;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isRefreshingConversations: boolean;
  onRefreshHistory: () => void;
  onPickConversation: (conversationId: string) => void;
  onNewChat: () => void;
  chat: {
    recentsTitle: string;
    refreshHistoryA11y: string;
    newChatButton: string;
    noConversations: string;
  };
};

export function ChatHistoryDrawerModal({
  visible,
  onRequestClose,
  colors: c,
  drawerTranslateX,
  backdropOpacity,
  conversations,
  activeConversationId,
  isRefreshingConversations,
  onRefreshHistory,
  onPickConversation,
  onNewChat,
  chat,
}: ChatHistoryDrawerModalProps) {
  const handleRefreshPress = useCallback(() => {
    void onRefreshHistory();
  }, [onRefreshHistory]);

  const handleNewChatPress = useCallback(() => {
    onNewChat();
    onRequestClose();
  }, [onNewChat, onRequestClose]);

  const handleRefreshControl = useCallback(() => {
    void onRefreshHistory();
  }, [onRefreshHistory]);

  function renderConversationRow(conversation: ChatConversation) {
    return (
      <ChatHistoryDrawerRow
        key={conversation.id}
        conversation={conversation}
        isActive={activeConversationId === conversation.id}
        colors={c}
        onPickConversation={onPickConversation}
        onRequestClose={onRequestClose}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.drawerRoot}>
        <Animated.View
          style={[
            styles.drawerPanel,
            {
              backgroundColor: c.drawerPanel,
              borderRightColor: c.drawerPanelBorder,
              transform: [{ translateX: drawerTranslateX }],
            },
          ]}>
          <View style={styles.drawerHeader}>
            <ThemedText type="defaultSemiBold" style={[styles.drawerTitle, { color: c.text }]}>
              {chat.recentsTitle}
            </ThemedText>
            <View style={styles.drawerHeaderActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={chat.refreshHistoryA11y}
                style={[styles.drawerIconButton, { borderColor: c.historyItemBorder, backgroundColor: c.historyItemBg }]}
                disabled={isRefreshingConversations}
                onPress={handleRefreshPress}>
                {isRefreshingConversations ? (
                  <ActivityIndicator size="small" color={c.topIcon} />
                ) : (
                  <Ionicons name="refresh" size={18} color={c.topIcon} />
                )}
              </Pressable>
              <Pressable
                style={styles.newChatButton}
                onPress={handleNewChatPress}>
                <Ionicons name="add" size={14} color="#fff" />
                <ThemedText style={styles.newChatButtonText}>{chat.newChatButton}</ThemedText>
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingConversations}
                onRefresh={handleRefreshControl}
                tintColor={c.topIcon}
              />
            }>
            {conversations.length === 0 ? (
              <ThemedText style={[styles.emptyHistoryText, { color: c.textMuted }]}>{chat.noConversations}</ThemedText>
            ) : (
              conversations.map(renderConversationRow)
            )}
          </ScrollView>
        </Animated.View>
        <Pressable style={styles.drawerBackdropPressable} onPress={onRequestClose}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity, backgroundColor: c.drawerBackdrop }]} />
        </Pressable>
      </View>
    </Modal>
  );
}
