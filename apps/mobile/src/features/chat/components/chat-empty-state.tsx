import { Animated, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import type { ChatThemeColors } from "@/src/theme/chat-colors";

export type ChatEmptyStateProps = {
  temporaryMode: boolean;
  colors: ChatThemeColors;
  heroOpacityRegular: Animated.AnimatedInterpolation<number>;
  heroOpacityTemporary: Animated.AnimatedInterpolation<number>;
  heroTranslateRegular: Animated.AnimatedInterpolation<number>;
  heroTranslateTemporary: Animated.AnimatedInterpolation<number>;
  copy: {
    emptyTitle: string;
    emptyBody: string;
    temporaryChatTitle: string;
    temporaryChatBody: string;
  };
};

/** Hero copy crossfade when there are no messages yet. */
export function ChatEmptyState({
  temporaryMode,
  colors: c,
  heroOpacityRegular,
  heroOpacityTemporary,
  heroTranslateRegular,
  heroTranslateTemporary,
  copy,
}: ChatEmptyStateProps) {
  return (
    <View
      style={[
        styles.emptyStateBody,
        temporaryMode && styles.emptyStateBodyTemporary,
      ]}
    >
      <View
        style={[
          styles.heroTextCrossfade,
          temporaryMode && styles.heroTextCrossfadeCentered,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            opacity: heroOpacityRegular,
            transform: [{ translateY: heroTranslateRegular }],
          }}
        >
          <ThemedText
            style={[
              styles.heroTitle,
              { color: c.heroTitle },
              temporaryMode && styles.heroTitleCentered,
            ]}
          >
            {copy.emptyTitle}
          </ThemedText>
          <ThemedText
            style={[
              styles.heroBody,
              { color: c.heroBody },
              temporaryMode && styles.heroBodyCentered,
            ]}
          >
            {copy.emptyBody}
          </ThemedText>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.heroTextCrossfadeOverlay,
            temporaryMode && styles.heroTextCrossfadeOverlayCentered,
            {
              opacity: heroOpacityTemporary,
              transform: [{ translateY: heroTranslateTemporary }],
            },
          ]}
        >
          <ThemedText
            style={[
              styles.heroTitle,
              { color: c.heroTitle },
              temporaryMode && styles.heroTitleCentered,
            ]}
          >
            {copy.temporaryChatTitle}
          </ThemedText>
          <ThemedText
            style={[
              styles.heroBody,
              { color: c.heroBody },
              temporaryMode && styles.heroBodyCentered,
            ]}
          >
            {copy.temporaryChatBody}
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}
