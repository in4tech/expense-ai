import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COUNTRY_CODES, type CountryCodeOption } from '@/src/features/profile/country-codes';

function matchesCountry(country: CountryCodeOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const qDigits = q.replace(/\D/g, '');
  const dialDigits = country.dial.replace(/\D/g, '');
  return (
    country.label.toLowerCase().includes(q) ||
    country.iso.toLowerCase().includes(q) ||
    country.dial.toLowerCase().includes(q) ||
    (qDigits.length > 0 && dialDigits.includes(qDigits))
  );
}

function countryNameFromLabel(label: string): string {
  const idx = label.lastIndexOf(' (');
  return idx > 0 ? label.slice(0, idx) : label;
}

type CountryCodePickerProps = {
  label: string;
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  onChange: (iso: string) => void;
  compact?: boolean;
};

export function CountryCodePicker({
  label,
  value,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  onChange,
  compact,
}: CountryCodePickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const c = useMemo(
    () => ({
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      muted: isDark ? '#AEAEB2' : '#7D7D7D',
      inputBg: isDark ? '#2C2C2E' : '#F2F2F2',
      border: isDark ? '#38383A' : '#E8E8EA',
      backdrop: 'rgba(0,0,0,0.5)',
      sheet: isDark ? '#1C1C1E' : '#FFFFFF',
      sheetMuted: isDark ? '#2C2C2E' : '#F5F5F7',
      accent: isDark ? '#0A84FF' : '#007AFF',
      selectedBg: isDark ? 'rgba(10, 132, 255, 0.18)' : 'rgba(0, 122, 255, 0.1)',
      badgeBg: isDark ? '#3A3A3C' : '#E8E8ED',
      badgeText: isDark ? '#E5E5EA' : '#3C3C43',
    }),
    [isDark],
  );

  const selected = COUNTRY_CODES.find((cc) => cc.iso === value);

  const filtered = useMemo(
    () => COUNTRY_CODES.filter((cc) => matchesCountry(cc, query)),
    [query],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const openPicker = useCallback(() => {
    setQuery('');
    setOpen(true);
  }, []);

  const onSelect = useCallback(
    (iso: string) => {
      onChange(iso);
      close();
    },
    [close, onChange],
  );

  const showClear = query.length > 0;

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: c.inputBg, borderColor: c.border, opacity: pressed ? 0.88 : 1 },
        ]}>
        <Text
          style={[styles.value, { color: selected ? c.text : c.muted }]}
          numberOfLines={1}>
          {selected ? countryNameFromLabel(selected.iso) : placeholder}
        </Text>
        {selected ? (
          <Text style={[styles.fieldDial, { color: c.muted }]}>{selected.dial}</Text>
        ) : null}
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={[styles.backdrop, { backgroundColor: c.backdrop }]} onPress={close} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: c.sheet,
                paddingBottom: Math.max(insets.bottom, 16),
                maxHeight: '85%',
              },
            ]}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
            </View>

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={close}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: c.sheetMuted, opacity: pressed ? 0.75 : 1 },
                ]}>
                <Ionicons name="close" size={20} color={c.muted} />
              </Pressable>
            </View>

            <View style={[styles.searchBar, { backgroundColor: c.sheetMuted }]}>
              <Ionicons name="search" size={18} color={c.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={c.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                style={[styles.searchInput, { color: c.text }]}
              />
              {showClear ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery('')}
                  hitSlop={6}
                  style={[styles.clearButton, { backgroundColor: c.border }]}>
                  <Ionicons name="close" size={14} color={c.muted} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item, index) => item.iso + index}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIcon, { backgroundColor: c.sheetMuted }]}>
                    <Ionicons name="globe-outline" size={28} color={c.muted} />
                  </View>
                  <Text style={[styles.emptyText, { color: c.muted }]}>{emptyLabel}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.iso === value;
                const name = countryNameFromLabel(item.label);
                return (
                  <Pressable
                    onPress={() => onSelect(item.iso)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? c.selectedBg
                          : pressed
                            ? c.sheetMuted
                            : 'transparent',
                      },
                    ]}>
                    <View style={[styles.isoBadge, { backgroundColor: c.badgeBg }]}>
                      <Text style={[styles.isoBadgeText, { color: c.badgeText }]}>{item.iso}</Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text
                        style={[
                          styles.optionName,
                          { color: c.text, fontWeight: isSelected ? '600' : '400' },
                        ]}
                        numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={[styles.optionDial, { color: c.muted }]}>{item.dial}</Text>
                    </View>
                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: c.accent }]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.checkPlaceholder} />
                    )}
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
  wrap: { gap: 6, flex: 1 },
  wrapCompact: { minWidth: 0 },
  label: { fontSize: 13, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  fieldBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  fieldBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  fieldDial: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: { flex: 1, fontSize: 15 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flexGrow: 0 },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  isoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  optionBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  optionName: {
    fontSize: 16,
  },
  optionDial: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPlaceholder: {
    width: 24,
    height: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
