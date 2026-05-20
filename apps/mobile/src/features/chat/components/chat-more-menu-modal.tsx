import { useCallback } from "react";
import { Alert, Modal, Pressable, Share, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatMoreMenuModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  colors: ChatThemeColors;
  cancelLabel: string;
  onDeleteActiveConversation: () => void;
  chat: {
    moreMenuTitle: string;
    deleteConfirmTitle: string;
    deleteServerConfirmMessage: string;
    menuDelete: string;
    reportAckTitle: string;
    reportAckMessage: string;
    menuReport: string;
    menuShare: string;
    shareFailed: string;
  };
  shareConversationText: () => string;
};

export function ChatMoreMenuModal({
  visible,
  onRequestClose,
  colors: c,
  cancelLabel,
  onDeleteActiveConversation,
  chat,
  shareConversationText,
}: ChatMoreMenuModalProps) {
  const confirmDeleteActiveConversation = useCallback(() => {
    void onDeleteActiveConversation();
  }, [onDeleteActiveConversation]);

  const handleDeleteRowPress = useCallback(() => {
    onRequestClose();
    Alert.alert(chat.deleteConfirmTitle, chat.deleteServerConfirmMessage, [
      { text: cancelLabel, style: "cancel" },
      {
        text: chat.menuDelete,
        style: "destructive",
        onPress: confirmDeleteActiveConversation,
      },
    ]);
  }, [
    onRequestClose,
    chat.deleteConfirmTitle,
    chat.deleteServerConfirmMessage,
    chat.menuDelete,
    cancelLabel,
    confirmDeleteActiveConversation,
  ]);

  const handleReportRowPress = useCallback(() => {
    onRequestClose();
    Alert.alert(chat.reportAckTitle, chat.reportAckMessage);
  }, [onRequestClose, chat.reportAckTitle, chat.reportAckMessage]);

  const shareConversationFromMenu = useCallback(async () => {
    try {
      const message = shareConversationText();
      if (!message.trim()) {
        return;
      }
      await Share.share({ message });
    } catch {
      Alert.alert("", chat.shareFailed);
    }
  }, [shareConversationText, chat.shareFailed]);

  const handleShareRowPress = useCallback(() => {
    onRequestClose();
    void shareConversationFromMenu();
  }, [onRequestClose, shareConversationFromMenu]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.moreMenuRoot}>
        <Pressable style={styles.moreMenuDismiss} onPress={onRequestClose} />
        <View
          style={[
            styles.moreMenuPanel,
            {
              backgroundColor: c.inputRowBg,
              borderColor: c.inputRowBorder,
            },
          ]}
        >
          <Pressable style={styles.moreMenuRow} onPress={handleDeleteRowPress}>
            <View style={styles.moreMenuRowInner}>
              <Ionicons name="trash-outline" size={17} color={c.errorText} />
              <ThemedText
                style={[styles.moreMenuRowText, { color: c.errorText }]}
              >
                {chat.menuDelete}
              </ThemedText>
            </View>
          </Pressable>
          <View
            style={[
              styles.moreMenuDivider,
              { backgroundColor: c.inputRowBorder },
            ]}
          />
          <Pressable style={styles.moreMenuRow} onPress={handleReportRowPress}>
            <View style={styles.moreMenuRowInner}>
              <Ionicons name="flag-outline" size={17} color={c.composerText} />
              <ThemedText
                style={[styles.moreMenuRowText, { color: c.composerText }]}
              >
                {chat.menuReport}
              </ThemedText>
            </View>
          </Pressable>
          <View
            style={[
              styles.moreMenuDivider,
              { backgroundColor: c.inputRowBorder },
            ]}
          />
          <Pressable style={styles.moreMenuRow} onPress={handleShareRowPress}>
            <View style={styles.moreMenuRowInner}>
              <Ionicons
                name="share-social-outline"
                size={17}
                color={c.composerText}
              />
              <ThemedText
                style={[styles.moreMenuRowText, { color: c.composerText }]}
              >
                {chat.menuShare}
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
