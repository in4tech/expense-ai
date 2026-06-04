import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import {
  countActiveHomeFilters,
  type HomeHousingFilters,
} from "@/src/features/housings/home/types/home-filters";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type FilterKey = keyof HomeHousingFilters;

const FILTER_KEYS: FilterKey[] = [
  "hasPhotos",
  "hasWifi",
  "hasPrice",
  "hasAddress",
  "hasParking",
];

const FILTER_ICONS: Record<FilterKey, keyof typeof Ionicons.glyphMap> = {
  hasPhotos: "images-outline",
  hasWifi: "wifi-outline",
  hasPrice: "pricetag-outline",
  hasAddress: "location-outline",
  hasParking: "car-outline",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: HomeHousingFilters;
  onChange: (filters: HomeHousingFilters) => void;
  labels: Dictionary["home"];
};

export function HomeFilterSheet({ open, onOpenChange, filters, onChange, labels: l }: Props) {
  const { colors: c } = useAppTheme();
  const activeCount = countActiveHomeFilters(filters);

  const toggle = (key: FilterKey) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const clearAll = () => {
    onChange({
      hasPhotos: false,
      hasWifi: false,
      hasPrice: false,
      hasAddress: false,
      hasParking: false,
    });
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={l.filterTitle}
      message={
        activeCount > 0
          ? l.filterActive.replace("{{count}}", String(activeCount))
          : l.filterHint
      }
      actions={[
        ...(activeCount > 0
          ? [{ label: l.filterClearAll, variant: "cancel" as const, onPress: clearAll }]
          : []),
        { label: l.filterDone, variant: "default" as const },
      ]}
    >
      <View style={styles.list}>
        {FILTER_KEYS.map((key) => {
          const label = l.filterOptions[key];
          const icon = FILTER_ICONS[key];
          return (
            <Pressable
              key={key}
              onPress={() => toggle(key)}
              style={[styles.row, { borderBottomColor: c.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.chipBg }]}>
                <Ionicons name={icon} size={18} color={c.primary} />
              </View>
              <ThemedText style={[styles.rowLabel, { color: c.title }]}>{label}</ThemedText>
              <Switch
                value={filters[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ false: c.inputBorder, true: c.primary }}
                thumbColor="#FFFFFF"
              />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
});
