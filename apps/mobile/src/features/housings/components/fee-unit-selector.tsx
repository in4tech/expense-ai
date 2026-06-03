import { useCallback, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import type { FeeUnitOption } from "@/src/features/housings/predict-fee-units";
import { useAppTheme } from "@/src/theme";

type Props = {
  options: FeeUnitOption[];
  value: string;
  onChange: (value: string) => void;
};

export function FeeUnitSelector({ options, value, onChange }: Props) {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";
  const close = useCallback(() => setOpen(false), []);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: c.border, backgroundColor: c.cardMuted }]}
        hitSlop={4}
      >
        <ThemedText style={[styles.triggerText, { color: c.hint }]} numberOfLines={1}>
          {selectedLabel}
        </ThemedText>
        <Ionicons name="chevron-down" size={12} color={c.hint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={close} />
          <View
            style={[
              styles.sheet,
              { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    style={[
                      styles.option,
                      {
                        borderBottomColor: c.border,
                        backgroundColor: selected ? c.chipOn : "transparent",
                      },
                    ]}
                  >
                    <ThemedText style={[styles.optionLabel, { color: c.title }]}>
                      {item.label}
                    </ThemedText>
                    {selected ? <Ionicons name="checkmark" size={18} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: "stretch" },
  trigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    minHeight: 26,
  },
  triggerText: { fontSize: 11, fontWeight: "600", flexShrink: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontSize: 15 },
});
