import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import type { ChatThemeColors } from '@/src/theme/chat-colors';

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
  function handleSendPress() {
    void onSend();
  }

  return (
    <View
      style={[
        styles.inputRow,
        { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={attachFileA11y}
        onPress={onOpenAttachmentMenu}
        disabled={isSending}
        hitSlop={10}
        style={[styles.attachButton, isSending && styles.buttonDisabled]}>
        <Ionicons name="add-circle-outline" size={24} color={c.topIcon} />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        style={[styles.composerInput, { color: c.composerText }]}
        multiline={false}
        maxLength={1000}
        editable={!isSending}
      />
      <Pressable
        style={[styles.primaryButton, !canSend && styles.buttonDisabled]}
        disabled={!canSend}
        onPress={handleSendPress}>
        <Ionicons name="send" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
