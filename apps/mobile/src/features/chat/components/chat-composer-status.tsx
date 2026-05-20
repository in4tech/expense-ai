import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatComposerStatusProps = {
  isSending: boolean;
  typingStatusText: string;
  error: string | null;
  colors: ChatThemeColors;
  retryLabel: string;
  onRetry: () => void;
};

/** Typing/streaming indicator and inline error + retry above the composer input row. */
export function ChatComposerStatus({
  isSending,
  typingStatusText,
  error,
  colors: c,
  retryLabel,
  onRetry,
}: ChatComposerStatusProps) {
  return (
    <>
      {isSending ? (
        <View style={styles.typingState}>
          <ActivityIndicator size="small" color={c.typing} />
          <ThemedText style={[styles.typingText, { color: c.typing }]}>
            {typingStatusText}
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <View
          style={[
            styles.errorBox,
            { borderColor: c.errorBorder, backgroundColor: c.errorBg },
          ]}
        >
          <ThemedText style={[styles.errorText, { color: c.errorText }]}>
            {error}
          </ThemedText>
          <Pressable
            style={[styles.secondaryButton, { borderColor: c.secondaryBorder }]}
            onPress={onRetry}
          >
            <ThemedText type="defaultSemiBold">{retryLabel}</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
