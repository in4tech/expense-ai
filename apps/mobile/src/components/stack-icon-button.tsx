import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/src/theme";

export const STACK_ICON_BUTTON_SIZE = 34;

type Props = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
};

/** Circular bordered icon control used on main stack screens (back, filter, etc.). */
export function StackIconButton({ children, style, active = false, ...pressableProps }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.button,
        {
          borderColor: c.border,
          backgroundColor: active ? c.chipBg : c.card,
        },
        style,
      ]}
      {...pressableProps}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: STACK_ICON_BUTTON_SIZE,
    height: STACK_ICON_BUTTON_SIZE,
    borderRadius: STACK_ICON_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
