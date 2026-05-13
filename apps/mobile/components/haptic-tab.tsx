import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { GestureResponderEvent } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  function handlePressIn(ev: GestureResponderEvent) {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    props.onPressIn?.(ev);
  }

  return (
    <PlatformPressable
      {...props}
      onPressIn={handlePressIn}
    />
  );
}
