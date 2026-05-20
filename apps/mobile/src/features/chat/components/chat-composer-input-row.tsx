import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatComposerInputRowProps = {
  colors: ChatThemeColors;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  attachFileA11y: string;
  isSending: boolean;
  canSend: boolean;
  onOpenAttachmentMenu: () => void;
  onSend: () => void;
};

/** Switch input pill to a rounded rect once content grows past one visual line. */
const EXPANDED_CONTENT_HEIGHT_PX = 44;

export function ChatComposerInputRow({
  colors: c,
  value,
  onChangeText,
  placeholder,
  attachFileA11y,
  isSending,
  canSend,
  onOpenAttachmentMenu,
  onSend,
}: ChatComposerInputRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const next =
        e.nativeEvent.contentSize.height > EXPANDED_CONTENT_HEIGHT_PX;
      setIsExpanded((prev) => (prev === next ? prev : next));
    },
    [],
  );

  function handleSendPress() {
    void onSend();
  }

  return (
    <View style={styles.inputRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={attachFileA11y}
        onPress={onOpenAttachmentMenu}
        disabled={isSending}
        hitSlop={10}
        style={[styles.attachButton, isSending && styles.buttonDisabled]}
      >
        <Ionicons name="add-circle-outline" size={26} color={c.topIcon} />
      </Pressable>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        style={[
          styles.composerInput,
          isExpanded
            ? styles.composerInputExpanded
            : styles.composerInputSingleLine,
          {
            color: c.composerText,
            backgroundColor: c.inputRowBg,
            borderColor: c.inputRowBorder,
          },
        ]}
        multiline
        blurOnSubmit={false}
        scrollEnabled
        textAlignVertical={Platform.OS === "android" ? "top" : undefined}
        onContentSizeChange={handleContentSizeChange}
        maxLength={1000}
        editable={!isSending}
      />

      <Pressable
        style={[styles.primaryButton, !canSend && styles.buttonDisabled]}
        disabled={!canSend}
        onPress={handleSendPress}
      >
        <Ionicons name="send" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
