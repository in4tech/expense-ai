import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import type { PickedAttachment } from "@/src/features/chat/compose-attachment-message";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatComposerAttachmentPreviewProps = {
  attachment: PickedAttachment | null;
  isDark: boolean;
  colors: ChatThemeColors;
  pickedKindImageLabel: string;
  pickedKindDocumentLabel: string;
  removeAttachmentA11y: string;
  onRemove: () => void;
};

/**
 * Preview row above the composer for the current pick.
 * Central place to extend previews for more file kinds or richer thumbnails later.
 */
export function ChatComposerAttachmentPreview({
  attachment,
  isDark,
  colors: c,
  pickedKindImageLabel,
  pickedKindDocumentLabel,
  removeAttachmentA11y,
  onRemove,
}: ChatComposerAttachmentPreviewProps) {
  if (!attachment) {
    return null;
  }

  function handleRemovePress() {
    onRemove();
  }

  return (
    <View
      style={[
        styles.pickedPreviewRow,
        {
          backgroundColor: isDark ? "rgba(140,122,248,0.16)" : "#F3EEFF",
          borderColor: isDark ? "rgba(140,122,248,0.36)" : "#D8CCFF",
        },
      ]}
    >
      {attachment.kind === "image" ? (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.pickedThumb}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.pickedDocIcon,
            { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
          ]}
        >
          <Ionicons name="document-text-outline" size={22} color={c.topIcon} />
        </View>
      )}
      <View style={styles.pickedPreviewMeta}>
        <ThemedText
          numberOfLines={1}
          style={[styles.pickedFileName, { color: c.textSecondary }]}
        >
          {attachment.name}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={[styles.pickedKindLabel, { color: c.textMuted }]}
        >
          {attachment.kind === "image"
            ? pickedKindImageLabel
            : pickedKindDocumentLabel}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeAttachmentA11y}
        onPress={handleRemovePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={c.textMuted} />
      </Pressable>
    </View>
  );
}
