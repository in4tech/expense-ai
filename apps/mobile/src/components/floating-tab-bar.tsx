import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isAndroid } from "../config/dev-mode";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const BAR_BG = "#1C1C1E";
const ACTIVE_ICON = "#1C1C1E";
const INACTIVE_ICON = "#FFFFFF";

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  home: { active: "home-outline", inactive: "home-outline" },
  chat: { active: "chatbubbles-outline", inactive: "chatbubbles-outline" },
  caption: { active: "image-outline", inactive: "image-outline" },
  settings: { active: "settings-outline", inactive: "settings-outline" },
};

const DEFAULT_ICONS: (typeof TAB_ICONS)[string] = {
  active: "ellipse-outline",
  inactive: "ellipse-outline",
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom - 10, 22) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? DEFAULT_ICONS;
          const iconName = isFocused ? icons.active : icons.inactive;
          const label = options.title ?? route.name;

          function onPress() {
            if (process.env.EXPO_OS === "ios") {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          function onLongPress() {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <View style={[styles.iconSlot, isFocused && styles.iconSlotActive]}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? ACTIVE_ICON : INACTIVE_ICON}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: isAndroid ? 20 : 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BAR_BG,
    borderRadius: 999,
    paddingVertical: 8,
    width: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  iconSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSlotActive: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
  },
});
