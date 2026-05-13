import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

export type UseChatScreenAnimationsOptions = {
  hasMessages: boolean;
  temporaryMode: boolean;
};

export type UseChatScreenAnimationsResult = {
  pulseAnim: Animated.Value;
  iconPulseAnim: Animated.Value;
  heroOpacityRegular: Animated.AnimatedInterpolation<number>;
  heroOpacityTemporary: Animated.AnimatedInterpolation<number>;
  heroTranslateRegular: Animated.AnimatedInterpolation<number>;
  heroTranslateTemporary: Animated.AnimatedInterpolation<number>;
  isDrawerMounted: boolean;
  drawerTranslateX: Animated.AnimatedInterpolation<number>;
  backdropOpacity: Animated.AnimatedInterpolation<number>;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
};

/**
 * Hero crossfade, empty-state orb pulse, and history drawer slide for the chat screen.
 */
export function useChatScreenAnimations({
  hasMessages,
  temporaryMode,
}: UseChatScreenAnimationsOptions): UseChatScreenAnimationsResult {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const heroBlendRef = useRef<Animated.Value | null>(null);
  if (heroBlendRef.current === null) {
    heroBlendRef.current = new Animated.Value(temporaryMode ? 1 : 0);
  }
  const heroBlend = heroBlendRef.current;

  const isFirstHeroBlendMount = useRef(true);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);

  const openHistoryDrawer = useCallback(() => {
    setIsDrawerMounted(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drawerAnim]);

  const closeHistoryDrawer = useCallback(() => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDrawerMounted(false);
      }
    });
  }, [drawerAnim]);

  useEffect(() => {
    if (isFirstHeroBlendMount.current) {
      isFirstHeroBlendMount.current = false;
      heroBlend.setValue(temporaryMode ? 1 : 0);
      return;
    }
    heroBlend.stopAnimation();
    Animated.timing(heroBlend, {
      toValue: temporaryMode ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.33, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [temporaryMode, heroBlend]);

  useEffect(() => {
    if (hasMessages) {
      pulseAnim.stopAnimation();
      iconPulseAnim.stopAnimation();
      return undefined;
    }

    pulseAnim.setValue(1);
    iconPulseAnim.setValue(1);

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulseAnim, {
          toValue: 1.12,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulseAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    orbLoop.start();
    iconLoop.start();
    return () => {
      orbLoop.stop();
      iconLoop.stop();
      pulseAnim.stopAnimation();
      iconPulseAnim.stopAnimation();
    };
  }, [hasMessages, pulseAnim, iconPulseAnim]);

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-340, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const heroOpacityRegular = heroBlend.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const heroOpacityTemporary = heroBlend.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const heroTranslateRegular = heroBlend.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const heroTranslateTemporary = heroBlend.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return {
    pulseAnim,
    iconPulseAnim,
    heroOpacityRegular,
    heroOpacityTemporary,
    heroTranslateRegular,
    heroTranslateTemporary,
    isDrawerMounted,
    drawerTranslateX,
    backdropOpacity,
    openHistoryDrawer,
    closeHistoryDrawer,
  };
}
