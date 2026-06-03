import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { RoomFeatureBox } from "@/src/features/housings/house-detail/components/room-feature-box";
import {
  ROOM_BOOL_KEYS,
  ROOM_STRING_KEYS,
  type RoomBoolKey,
  type RoomStringKey,
} from "@/src/features/housings/house-detail/constants";
import { ROOM_BOOL_ICONS, ROOM_STRING_ICONS } from "@/src/features/housings/house-detail/room-feature-icons";
import type { RoomDetail } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type Props = {
  room: RoomDetail | null;
  labels: Dictionary["houseDetail"];
};

export function HouseDetailRoomSection({ room, labels: d }: Props) {
  const { colors: c } = useAppTheme();

  const boolItems = useMemo(() => {
    if (!room) return [];
    return ROOM_BOOL_KEYS.filter((key) => room[key as keyof RoomDetail] === true).map((key) => ({
      key,
      label: d.roomBool[key as RoomBoolKey],
      icon: ROOM_BOOL_ICONS[key as RoomBoolKey],
    }));
  }, [room, d.roomBool]);

  const textItems = useMemo(() => {
    if (!room) return [];
    return ROOM_STRING_KEYS.flatMap((key) => {
      const val = room[key as RoomStringKey];
      const text = val == null ? "" : String(val).trim();
      if (!text) return [];
      return [
        {
          key,
          label: d.roomStrings[key as RoomStringKey],
          detail: text,
          icon: ROOM_STRING_ICONS[key as RoomStringKey],
        },
      ];
    });
  }, [room, d.roomStrings]);

  if (!room) {
    return <ThemedText style={[styles.noRoom, { color: c.hint }]}>{d.noRoom}</ThemedText>;
  }

  if (boolItems.length === 0 && textItems.length === 0) {
    return <ThemedText style={[styles.noRoom, { color: c.hint }]}>{d.noRoomFeatures}</ThemedText>;
  }

  return (
    <View style={styles.sections}>
      {boolItems.length > 0 ? (
        <View style={styles.boolGrid}>
          {boolItems.map((item) => (
            <RoomFeatureBox
              key={item.key}
              variant="boolean"
              icon={item.icon}
              label={item.label}
            />
          ))}
        </View>
      ) : null}

      {textItems.length > 0 ? (
        <View style={styles.textList}>
          {textItems.map((item) => (
            <RoomFeatureBox
              key={item.key}
              variant="text"
              icon={item.icon}
              label={item.label}
              detail={item.detail}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 10 },
  boolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  textList: { gap: 6 },
  noRoom: { fontSize: 14, lineHeight: 20 },
});
