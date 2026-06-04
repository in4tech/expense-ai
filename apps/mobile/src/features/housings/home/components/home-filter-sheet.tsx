import { useEffect } from "react";
import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import {
  countActiveHomeFilters,
  HOME_AMENITY_FILTERS,
  HOME_PRICE_RANGES,
  type HomeAmenityFilter,
  type HomeHousingFilters,
  type HomePriceRange,
} from "@/src/features/housings/home/types/home-filters";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

const AMENITY_ICONS: Record<
  HomeAmenityFilter,
  keyof typeof Ionicons.glyphMap
> = {
  hasWifi: "wifi-outline",
  hasParking: "car-outline",
  hasPhotos: "images-outline",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: HomeHousingFilters;
  onChange: (filters: HomeHousingFilters) => void;
  labels: Dictionary["home"];
};

export function HomeFilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  labels: l,
}: Props) {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const activeCount = countActiveHomeFilters(filters);

  useEffect(() => {
    if (!open) {
      return;
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onOpenChange(false);
      return true;
    });
    return () => sub.remove();
  }, [open, onOpenChange]);

  const togglePriceRange = (range: HomePriceRange) => {
    const next = filters.priceRanges.includes(range)
      ? filters.priceRanges.filter((item) => item !== range)
      : [...filters.priceRanges, range];
    onChange({ ...filters, priceRanges: next });
  };

  const toggleAmenity = (key: HomeAmenityFilter) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const clearAll = () => {
    onChange({
      priceRanges: [],
      hasWifi: false,
      hasParking: false,
      hasPhotos: false,
    });
  };

  const subtitle =
    activeCount > 0
      ? l.filterActive.replace("{{count}}", String(activeCount))
      : l.filterHint;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdropPressable}
          onPress={() => onOpenChange(false)}
        >
          <View style={styles.backdrop} />
        </Pressable>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: c.card,
              borderTopColor: c.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.hint }]} />

          <ThemedText style={[styles.title, { color: c.hint }]}>
            {l.filterTitle}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: c.text }]}>
            {subtitle}
          </ThemedText>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedText style={[styles.sectionLabel, { color: c.hint }]}>
              {l.filterPriceSection}
            </ThemedText>
            <View style={styles.chipWrap}>
              {HOME_PRICE_RANGES.map((range) => {
                const selected = filters.priceRanges.includes(range);
                return (
                  <Pressable
                    key={range}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => togglePriceRange(range)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? c.primary : c.border,
                        backgroundColor: selected ? c.chipBg : c.cardMuted,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipLabel,
                        {
                          color: selected ? c.primary : c.title,
                          fontWeight: selected ? "700" : "500",
                        },
                      ]}
                    >
                      {l.filterPriceRanges[range]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText
              style={[styles.sectionLabel, styles.amenitySectionLabel, { color: c.hint }]}
            >
              {l.filterAmenitySection}
            </ThemedText>

            {HOME_AMENITY_FILTERS.map((key, index) => {
              const label = l.filterAmenities[key];
              const icon = AMENITY_ICONS[key];
              const isActive = filters[key];
              const isLast = index === HOME_AMENITY_FILTERS.length - 1;

              return (
                <View key={key}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={styles.row}
                    onPress={() => toggleAmenity(key)}
                  >
                    <View
                      style={[
                        styles.rowIconWrap,
                        {
                          backgroundColor: isActive ? c.chipBg : c.cardMuted,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={22}
                        color={isActive ? c.primary : c.title}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.rowLabel,
                        { color: c.title, fontWeight: isActive ? "700" : "500" },
                      ]}
                    >
                      {label}
                    </ThemedText>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={c.primary}
                      />
                    ) : (
                      <View
                        style={[
                          styles.rowCheckPlaceholder,
                          { borderColor: c.border },
                        ]}
                      />
                    )}
                  </Pressable>
                  {!isLast ? (
                    <View
                      style={[styles.divider, { backgroundColor: c.border }]}
                    />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          {activeCount > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Pressable
                accessibilityRole="button"
                style={styles.actionButton}
                onPress={clearAll}
              >
                <ThemedText style={[styles.clearText, { color: c.danger }]}>
                  {l.filterClearAll}
                </ThemedText>
              </Pressable>
            </>
          ) : null}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <Pressable
            accessibilityRole="button"
            style={styles.actionButton}
            onPress={() => onOpenChange(false)}
          >
            <ThemedText style={[styles.doneText, { color: c.primary }]}>
              {l.filterDone}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  amenitySectionLabel: {
    marginTop: 18,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 17,
  },
  rowCheckPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  clearText: {
    fontSize: 17,
    fontWeight: "600",
  },
  doneText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
