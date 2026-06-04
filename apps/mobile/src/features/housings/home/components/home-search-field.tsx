import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { StackIconButton } from "@/src/components/stack-icon-button";
import { useAppTheme } from "@/src/theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  hasActiveFilters?: boolean;
  onFilterPress?: () => void;
  filterAccessibilityLabel?: string;
};

export function HomeSearchField({
  value,
  onChangeText,
  placeholder,
  hasActiveFilters = false,
  onFilterPress,
  filterAccessibilityLabel,
}: Props) {
  const { colors: c, isDark } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View
          style={[
            styles.field,
            { borderColor: c.border, backgroundColor: isDark ? c.card : "#FFFFFF" },
          ]}
        >
          <Ionicons name="search" size={16} color={c.hint} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={c.hint}
            style={[styles.input, { color: c.title }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        {onFilterPress ? (
          <StackIconButton
            onPress={onFilterPress}
            active={hasActiveFilters}
            accessibilityRole="button"
            accessibilityLabel={filterAccessibilityLabel}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasActiveFilters ? c.primary : c.title}
            />
          </StackIconButton>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  field: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
