import { memo } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import type { ChatListItem } from "@/src/features/chat/helpers";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatFlatListItemProps = {
  item: ChatListItem;
  isDark: boolean;
  colors: ChatThemeColors;
};

function ChatFlatListItemImpl({
  item,
  isDark,
  colors: c,
}: ChatFlatListItemProps) {
  if (item.type === "day") {
    return (
      <View style={styles.daySeparatorRow}>
        <ThemedText
          style={[styles.daySeparatorText, { color: c.textMuted }]}
          numberOfLines={2}
        >
          {item.label}
        </ThemedText>
      </View>
    );
  }

  const meta = (item.message.metadata ?? {}) as Record<string, unknown>;
  const pdfFilename =
    String(meta.filename ?? item.message.content ?? "").trim() || "PDF file";
  const isUserPdfMessage =
    item.message.role === "user" &&
    meta.type === "pdf" &&
    pdfFilename.trim().length > 0;

  if (isUserPdfMessage) {
    const rawMetaMessage = typeof meta.message === "string" ? meta.message : "";
    const fallbackContent =
      item.message.content && item.message.content !== pdfFilename
        ? item.message.content
        : "";
    const userText = (rawMetaMessage || fallbackContent).trim();

    const pdfCard = (
      <View
        style={[
          styles.pickedPreviewRow,
          {
            maxWidth: "92%",
            alignSelf: "flex-end",
            backgroundColor: isDark ? "rgba(140,122,248,0.16)" : "#F3EEFF",
            borderColor: isDark ? "rgba(140,122,248,0.36)" : "#D8CCFF",
          },
        ]}
      >
        <View
          style={[
            styles.pickedDocIcon,
            { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
          ]}
        >
          <Ionicons name="document-text-outline" size={22} color={c.topIcon} />
        </View>
        <View style={styles.pickedPreviewMeta}>
          <ThemedText
            numberOfLines={2}
            style={[styles.pickedFileName, { color: c.text }]}
          >
            {pdfFilename}
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[styles.pickedKindLabel, { color: c.textMuted }]}
          >
            PDF
          </ThemedText>
        </View>
      </View>
    );

    if (userText.length === 0) {
      return pdfCard;
    }

    return (
      <View style={{ alignSelf: "stretch", gap: 6 }}>
        {pdfCard}
        <View
          style={[
            styles.messageBubble,
            {
              alignSelf: "flex-end",
              borderColor: c.userBubbleBorder,
              backgroundColor: c.userBubbleBg,
            },
          ]}
        >
          <ThemedText
            style={[styles.messageContent, { color: c.bubbleUserText }]}
          >
            {userText}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageBubble,
        item.message.role === "user"
          ? {
              alignSelf: "flex-end",
              borderColor: c.userBubbleBorder,
              backgroundColor: c.userBubbleBg,
            }
          : {
              alignSelf: "flex-start",
              borderColor: c.assistantBubbleBorder,
              backgroundColor: c.assistantBubbleBg,
            },
      ]}
    >
      <ThemedText
        style={[
          styles.messageContent,
          {
            color:
              item.message.role === "user"
                ? c.bubbleUserText
                : c.bubbleAssistantText,
          },
        ]}
      >
        {item.message.content}
      </ThemedText>
    </View>
  );
}

/**
 * Custom equality so streaming SSE deltas only re-render the assistant bubble
 * whose `content` changed, not every other row in the FlatList.
 */
export const ChatFlatListItem = memo(ChatFlatListItemImpl, (prev, next) => {
  if (prev.isDark !== next.isDark) return false;
  if (prev.colors !== next.colors) return false;
  const a = prev.item;
  const b = next.item;
  if (a.type !== b.type) return false;
  if (a.type === "day" && b.type === "day") {
    return a.id === b.id && a.label === b.label;
  }
  if (a.type === "message" && b.type === "message") {
    return (
      a.message.id === b.message.id &&
      a.message.role === b.message.role &&
      a.message.content === b.message.content &&
      a.message.metadata === b.message.metadata
    );
  }
  return false;
});
