import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
};

type ProfileDropdownProps<T extends string | number> = {
  label: string;
  value: T | null;
  placeholder: string;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
};

export function ProfileDropdown<T extends string | number>({
  label,
  value,
  placeholder,
  options,
  onChange,
  compact,
}: ProfileDropdownProps<T>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const c = useMemo(
    () => ({
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      muted: isDark ? '#AEAEB2' : '#7D7D7D',
      card: isDark ? '#1C1C1E' : '#FFFFFF',
      inputBg: isDark ? '#2C2C2E' : '#F2F2F2',
      border: isDark ? '#38383A' : '#E8E8EA',
      backdrop: 'rgba(0,0,0,0.45)',
      sheet: isDark ? '#1C1C1E' : '#FFFFFF',
      divider: isDark ? '#38383A' : '#EBEBEB',
    }),
    [isDark],
  );

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const close = useCallback(() => setOpen(false), []);

  const onSelect = useCallback(
    (next: T) => {
      onChange(next);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: c.inputBg, borderColor: c.border, opacity: pressed ? 0.88 : 1 },
        ]}>
        <Text
          style={[styles.value, { color: selectedLabel ? c.text : c.muted }]}
          numberOfLines={1}>
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={[styles.backdrop, { backgroundColor: c.backdrop }]} onPress={close} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: c.sheet,
                paddingBottom: Math.max(insets.bottom, 12),
                maxHeight: '70%',
              },
            ]}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, index) => String(item.value) + index}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    onPress={() => onSelect(item.value)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderBottomColor: c.divider,
                        backgroundColor: pressed ? c.inputBg : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionLabel, { color: c.text }]}>{item.label}</Text>
                    {selected ? <Ionicons name="checkmark" size={20} color="#34C759" /> : null}
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
  wrap: {
    gap: 6,
    flex: 1,
  },
  wrapCompact: {
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 15,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
});
