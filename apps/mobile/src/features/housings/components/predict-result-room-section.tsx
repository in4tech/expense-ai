import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { RoomFeatureBox } from "@/src/features/housings/house-detail/components/room-feature-box";
import type { RoomBoolKey, RoomStringKey } from "@/src/features/housings/house-detail/constants";
import { ROOM_BOOL_ICONS, ROOM_STRING_ICONS } from "@/src/features/housings/house-detail/room-feature-icons";
import { useAppTheme } from "@/src/theme";

export type PredictResultRoomBoolItem = {
  key: RoomBoolKey;
  label: string;
};

export type PredictResultRoomFieldItem = {
  key: RoomStringKey;
  label: string;
  detail: string;
};

type Props = {
  amenitiesTitle: string;
  detailsTitle: string;
  noAmenitiesText: string;
  boolItems: PredictResultRoomBoolItem[];
  fieldItems: PredictResultRoomFieldItem[];
};

export function PredictResultRoomSection({
  amenitiesTitle,
  detailsTitle,
  noAmenitiesText,
  boolItems,
  fieldItems,
}: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.sections}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <ThemedText style={[styles.cardTitle, { color: c.title }]}>{amenitiesTitle}</ThemedText>
        {boolItems.length > 0 ? (
          <View style={styles.boolGrid}>
            {boolItems.map((item) => (
              <RoomFeatureBox
                key={item.key}
                variant="boolean"
                icon={ROOM_BOOL_ICONS[item.key]}
                label={item.label}
              />
            ))}
          </View>
        ) : (
          <ThemedText style={[styles.emptyHint, { color: c.hint }]}>{noAmenitiesText}</ThemedText>
        )}
      </View>

      {fieldItems.length > 0 ? (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <ThemedText style={[styles.cardTitle, { color: c.title }]}>{detailsTitle}</ThemedText>
          <View style={styles.textList}>
            {fieldItems.map((item) => (
              <RoomFeatureBox
                key={item.key}
                variant="text"
                icon={ROOM_STRING_ICONS[item.key]}
                label={item.label}
                detail={item.detail}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  boolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  textList: { gap: 6 },
  emptyHint: { fontSize: 14, lineHeight: 20 },
});
