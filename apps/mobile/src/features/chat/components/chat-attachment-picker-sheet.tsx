import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatAttachmentPickerSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  colors: ChatThemeColors;
  title: string;
  photoLabel: string;
  documentLabel: string;
  cancelLabel: string;
  onPickPhoto: () => void;
  onPickDocument: () => void;
};

/** Bottom-sheet style picker for photo vs document (Modal + safe-area inset). */
export function ChatAttachmentPickerSheet({
  visible,
  onRequestClose,
  colors: c,
  title,
  photoLabel,
  documentLabel,
  cancelLabel,
  onPickPhoto,
  onPickDocument,
}: ChatAttachmentPickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.attachmentSheetRoot}>
        <Pressable
          style={styles.attachmentSheetBackdropPressable}
          onPress={onRequestClose}
        >
          <View style={styles.attachmentSheetBackdrop} />
        </Pressable>
        <View
          style={[
            styles.attachmentSheetPanel,
            {
              backgroundColor: c.inputRowBg,
              borderTopColor: c.inputRowBorder,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View
            style={[
              styles.attachmentSheetHandle,
              { backgroundColor: c.textMuted },
            ]}
          />
          <ThemedText
            style={[styles.attachmentSheetTitle, { color: c.textSecondary }]}
          >
            {title}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            style={styles.attachmentSheetRow}
            onPress={onPickPhoto}
          >
            <View
              style={[
                styles.attachmentSheetRowIconWrap,
                { backgroundColor: c.quickChipBg },
              ]}
            >
              <Ionicons name="images-outline" size={22} color={c.topIcon} />
            </View>
            <ThemedText
              style={[styles.attachmentSheetRowLabel, { color: c.text }]}
            >
              {photoLabel}
            </ThemedText>
          </Pressable>

          <View
            style={[
              styles.attachmentSheetDivider,
              { backgroundColor: c.inputRowBorder },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            style={styles.attachmentSheetRow}
            onPress={onPickDocument}
          >
            <View
              style={[
                styles.attachmentSheetRowIconWrap,
                { backgroundColor: c.quickChipBg },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={c.topIcon}
              />
            </View>
            <ThemedText
              style={[styles.attachmentSheetRowLabel, { color: c.text }]}
            >
              {documentLabel}
            </ThemedText>
          </Pressable>

          <View
            style={[
              styles.attachmentSheetDivider,
              { backgroundColor: c.inputRowBorder },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            style={styles.attachmentSheetCancel}
            onPress={onRequestClose}
          >
            <ThemedText
              style={[
                styles.attachmentSheetCancelText,
                { color: c.textSecondary },
              ]}
            >
              {cancelLabel}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
