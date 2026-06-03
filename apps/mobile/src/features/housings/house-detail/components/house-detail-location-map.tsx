import { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  latitude: number;
  longitude: number;
  address: string | null;
  openInMapsLabel: string;
  webFallback: string;
};

export function HouseDetailLocationMap({
  latitude,
  longitude,
  address,
  openInMapsLabel,
  webFallback,
}: Props) {
  const { colors: c } = useAppTheme();
  const region: Region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }),
    [latitude, longitude],
  );
  const mapUsable = Platform.OS !== "web";

  const openExternalMaps = () => {
    const query = address?.trim()
      ? encodeURIComponent(address.trim())
      : `${latitude},${longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    void Linking.openURL(url);
  };

  return (
    <View style={styles.block}>
      {mapUsable ? (
        <MapView
          style={styles.map}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }} />
        </MapView>
      ) : (
        <View style={[styles.fallback, { backgroundColor: c.cardMuted, borderColor: c.border }]}>
          <Ionicons name="map-outline" size={28} color={c.hint} />
          <ThemedText style={[styles.fallbackText, { color: c.hint }]}>{webFallback}</ThemedText>
        </View>
      )}
      <Pressable
        onPress={openExternalMaps}
        style={[styles.openBtn, { borderColor: c.border, backgroundColor: c.cardMuted }]}
      >
        <Ionicons name="navigate-outline" size={16} color={c.primary} />
        <ThemedText style={[styles.openBtnText, { color: c.primary }]}>{openInMapsLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  map: {
    height: 200,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  fallback: {
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  fallbackText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  openBtnText: { fontSize: 14, fontWeight: "700" },
});
