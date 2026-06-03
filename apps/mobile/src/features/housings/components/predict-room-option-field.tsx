import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { PredictFieldLabel } from "@/src/features/housings/components/predict-field-label";
import {
  OTHER_OPTION_VALUE,
  type PredictOption,
  type RoomOptionFieldState,
} from "@/src/features/housings/predict-room-field-options";
import { useAppTheme } from "@/src/theme";

type Props = {
  label: string;
  required?: boolean;
  placeholder: string;
  otherPlaceholder: string;
  options: PredictOption[];
  state: RoomOptionFieldState;
  onChange: (state: RoomOptionFieldState) => void;
};

export function PredictRoomOptionField({
  label,
  required,
  placeholder,
  otherPlaceholder,
  options,
  state,
  onChange,
}: Props) {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!state.selected) return null;
    return options.find((o) => o.value === state.selected)?.label ?? null;
  }, [options, state.selected]);

  const close = useCallback(() => setOpen(false), []);

  const onSelect = useCallback(
    (value: string) => {
      onChange({
        selected: value,
        custom: value === OTHER_OPTION_VALUE ? state.custom : "",
      });
      setOpen(false);
    },
    [onChange, state.custom],
  );

  return (
    <View style={styles.wrap}>
      <PredictFieldLabel label={label} required={required} />
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: c.cardMuted, borderColor: c.border }]}
      >
        <ThemedText
          style={[styles.value, { color: selectedLabel ? c.title : c.hint }]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color={c.hint} />
      </Pressable>

      {state.selected === OTHER_OPTION_VALUE ? (
        <TextInput
          value={state.custom}
          onChangeText={(custom) => onChange({ ...state, custom })}
          style={[
            styles.input,
            { borderColor: c.border, color: c.title, backgroundColor: c.cardMuted },
          ]}
          placeholder={otherPlaceholder}
          placeholderTextColor={c.hint}
        />
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={[styles.backdrop, { backgroundColor: c.hint }]} onPress={close} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: c.card,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <ThemedText style={[styles.sheetTitle, { color: c.title }]}>{label}</ThemedText>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.value === state.selected;
                return (
                  <Pressable
                    onPress={() => onSelect(item.value)}
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
                    {selected ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
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
  wrap: { gap: 6, width: "100%" },
  label: { fontSize: 12, fontWeight: "500" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  value: { flex: 1, fontSize: 14, textAlignVertical: "center" },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, opacity: 0.45 },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontSize: 15, flex: 1 },
});
