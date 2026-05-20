import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/src/i18n";
import { emitLocationPick } from "@/src/navigation/location-pick-bridge";

const NOMINATIM = "https://nominatim.openstreetmap.org";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

const USER_AGENT = "ExpenseAI-Mobile/1.0 (housing demo; dev)";

const HCMC_REGION: Region = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const nominatimFetch = async (path: string): Promise<unknown> => {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  return res.json();
};

export default function MapPickLocationScreen() {
  const { dictionary } = useLanguage();
  const d = dictionary.mapPickLocation;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const mapRef = useRef<MapView>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressLabel, setAddressLabel] = useState("");

  const reverseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = {
    screen: isDark ? "#0B0B0F" : "#F5F7FB",
    card: isDark ? "#17181D" : "#FFFFFF",
    cardMuted: isDark ? "#111217" : "#F8FAFC",
    title: isDark ? "#F3F4F6" : "#0F172A",
    hint: isDark ? "#94A3B8" : "#64748B",
    primary: "#4F46E5",
    border: isDark ? "#2B2D33" : "#E2E8F0",
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const payload = await nominatimFetch(
        `/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=0`,
      );
      if (payload && typeof payload === "object" && "display_name" in payload) {
        const name = (payload as { display_name?: unknown }).display_name;
        if (typeof name === "string" && name.trim()) setAddressLabel(name);
      }
    } catch {
      setAddressLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    }
  }, []);

  const scheduleReverse = useCallback(
    (latitude: number, longitude: number) => {
      if (reverseTimeout.current) clearTimeout(reverseTimeout.current);
      reverseTimeout.current = setTimeout(() => {
        void reverseGeocode(latitude, longitude);
      }, 400);
    },
    [reverseGeocode],
  );

  const moveTo = useCallback(
    (latitude: number, longitude: number, label?: string) => {
      setMarker({ latitude, longitude });
      if (label) setAddressLabel(label);
      else scheduleReverse(latitude, longitude);
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        350,
      );
    },
    [scheduleReverse],
  );

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    try {
      const payload = await nominatimFetch(
        `/search?format=json&limit=8&q=${encodeURIComponent(q)}`,
      );
      if (Array.isArray(payload)) {
        setResults(
          (payload as unknown[]).filter(
            (row): row is NominatimHit =>
              !!row &&
              typeof row === "object" &&
              typeof (row as NominatimHit).lat === "string" &&
              typeof (row as NominatimHit).lon === "string",
          ),
        );
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const confirm = () => {
    if (!marker) return;
    const addr = addressLabel.trim() || `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}`;
    emitLocationPick({
      address: addr,
      latitude: marker.latitude,
      longitude: marker.longitude,
    });
    router.back();
  };

  const mapUsable = Platform.OS !== "web";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: c.title }]}>{d.title}</ThemedText>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void runSearch()}
          placeholder={d.searchPlaceholder}
          placeholderTextColor={c.hint}
          style={[
            styles.searchInput,
            { borderColor: c.border, color: c.title, backgroundColor: c.cardMuted },
          ]}
          returnKeyType="search"
        />
        <Pressable
          onPress={() => void runSearch()}
          style={[styles.searchBtn, { backgroundColor: c.primary }]}
        >
          {searching ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="search" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.lon}-${item.lat}-${index}`}
          keyboardShouldPersistTaps="handled"
          style={[styles.resultsList, { borderColor: c.border, backgroundColor: c.card }]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                const lat = Number(item.lat);
                const lon = Number(item.lon);
                if (Number.isFinite(lat) && Number.isFinite(lon)) {
                  moveTo(lat, lon, item.display_name);
                  setResults([]);
                  setQuery(item.display_name.split(",").slice(0, 2).join(",").trim());
                }
              }}
              style={styles.resultRow}
            >
              <Ionicons name="location-outline" size={16} color={c.primary} />
              <ThemedText style={[styles.resultText, { color: c.title }]} numberOfLines={2}>
                {item.display_name}
              </ThemedText>
            </Pressable>
          )}
        />
      ) : null}

      {mapUsable ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={HCMC_REGION}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            moveTo(latitude, longitude);
          }}
        >
          {marker ? (
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setMarker({ latitude, longitude });
                scheduleReverse(latitude, longitude);
              }}
            />
          ) : null}
        </MapView>
      ) : (
        <View style={[styles.webFallback, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="map-outline" size={32} color={c.hint} />
          <ThemedText style={[styles.webFallbackText, { color: c.hint }]}>{d.webFallback}</ThemedText>
        </View>
      )}

      <View style={[styles.infoBar, { backgroundColor: c.card, borderColor: c.border }]}>
        <ThemedText style={[styles.infoLabel, { color: c.hint }]}>{d.selectedLabel}</ThemedText>
        <ThemedText style={[styles.infoValue, { color: c.title }]} numberOfLines={3}>
          {marker
            ? addressLabel || `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}`
            : d.noSelection}
        </ThemedText>
        <ThemedText style={[styles.hintLine, { color: c.hint }]}>{d.hintTapMap}</ThemedText>
      </View>

      <View style={[styles.footer, { backgroundColor: c.screen, borderColor: c.border }]}>
        <Pressable
          onPress={confirm}
          disabled={!marker}
          style={[
            styles.confirmBtn,
            {
              backgroundColor: marker ? c.primary : c.border,
              opacity: marker ? 1 : 0.65,
            },
          ]}
        >
          <ThemedText style={styles.confirmBtnText}>{d.confirm}</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsList: {
    maxHeight: 160,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultText: { flex: 1, fontSize: 13, lineHeight: 18 },
  map: { flex: 1, marginHorizontal: 16, borderRadius: 12, overflow: "hidden" },
  webFallback: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  webFallbackText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  infoBar: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  hintLine: { fontSize: 11, marginTop: 4 },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
