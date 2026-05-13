import { Animated, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import type { ChatThemeColors } from '@/src/theme/chat-colors';

export type ChatEmptyStateProps = {
  temporaryMode: boolean;
  colors: ChatThemeColors;
  heroOpacityRegular: Animated.AnimatedInterpolation<number>;
  heroOpacityTemporary: Animated.AnimatedInterpolation<number>;
  heroTranslateRegular: Animated.AnimatedInterpolation<number>;
  heroTranslateTemporary: Animated.AnimatedInterpolation<number>;
  pulseAnim: Animated.Value;
  iconPulseAnim: Animated.Value;
  copy: {
    emptyTitle: string;
    emptyBody: string;
    temporaryChatTitle: string;
    temporaryChatBody: string;
  };
};

/** Hero copy crossfade + decorative orb when there are no messages yet. */
export function ChatEmptyState({
  temporaryMode,
  colors: c,
  heroOpacityRegular,
  heroOpacityTemporary,
  heroTranslateRegular,
  heroTranslateTemporary,
  pulseAnim,
  iconPulseAnim,
  copy,
}: ChatEmptyStateProps) {
  return (
    <View style={[styles.emptyStateBody, temporaryMode && styles.emptyStateBodyTemporary]}>
      <View style={[styles.heroTextCrossfade, temporaryMode && styles.heroTextCrossfadeCentered]}>
        <Animated.View
          pointerEvents="none"
          style={{
            opacity: heroOpacityRegular,
            transform: [{ translateY: heroTranslateRegular }],
          }}>
          <ThemedText
            style={[styles.heroTitle, { color: c.heroTitle }, temporaryMode && styles.heroTitleCentered]}>
            {copy.emptyTitle}
          </ThemedText>
          <ThemedText
            style={[styles.heroBody, { color: c.heroBody }, temporaryMode && styles.heroBodyCentered]}>
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
          ]}>
          <ThemedText
            style={[styles.heroTitle, { color: c.heroTitle }, temporaryMode && styles.heroTitleCentered]}>
            {copy.temporaryChatTitle}
          </ThemedText>
          <ThemedText
            style={[styles.heroBody, { color: c.heroBody }, temporaryMode && styles.heroBodyCentered]}>
            {copy.temporaryChatBody}
          </ThemedText>
        </Animated.View>
      </View>

      <View
        style={[styles.orbContainer, temporaryMode && styles.orbContainerHidden]}
        pointerEvents={temporaryMode ? 'none' : 'auto'}
        accessibilityElementsHidden={temporaryMode}
        importantForAccessibility={temporaryMode ? 'no-hide-descendants' : 'auto'}>
        <Animated.View style={[styles.orbOuter, { backgroundColor: c.orbOuter, transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.orbInner, { backgroundColor: c.orbInner, transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.orbIconCenter} pointerEvents="none">
          <Animated.View style={{ transform: [{ scale: iconPulseAnim }] }}>
            <MaterialCommunityIcons name="robot-outline" size={40} color={c.robotIcon} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
