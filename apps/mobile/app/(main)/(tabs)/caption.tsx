import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import {
  CaptionResultCard,
  CaptionScanFrame,
  CaptionScanOverlay,
  predictImageCaption,
} from "@/src/features/image-caption";
import { isAndroid } from "@/src/config/dev-mode";
import { useLanguage } from "@/src/i18n";
import { useAuth } from "@/src/providers/auth-context";

type PickedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type CaptureMode = "camera" | "gallery";

const TAB_BAR_CLEARANCE = isAndroid ? 120 : 0;
const MIN_SCAN_MS = 5000;
const BOTTOM_DOCK_RESERVE = 180;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function CaptionScreen() {
  const { dictionary } = useLanguage();
  const { getApiClient } = useAuth();
  const insets = useSafeAreaInsets();
  const copy = dictionary.imageCaption;

  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");

  const client = useMemo(() => getApiClient(), [getApiClient]);

  const applyPickedAsset = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    setPickedImage({
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
    setCaption(null);
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(copy.cameraPermissionDeniedTitle, copy.cameraPermissionDeniedMessage);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    applyPickedAsset(result.assets[0]);
  }, [
    applyPickedAsset,
    copy.cameraPermissionDeniedMessage,
    copy.cameraPermissionDeniedTitle,
  ]);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(copy.permissionDeniedTitle, copy.permissionDeniedMessage);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    applyPickedAsset(result.assets[0]);
  }, [applyPickedAsset, copy.permissionDeniedMessage, copy.permissionDeniedTitle]);

  const clearPickedImage = useCallback(() => {
    setPickedImage(null);
    setCaption(null);
  }, []);

  const onCameraModePress = useCallback(() => {
    if (captureMode !== "camera") {
      clearPickedImage();
    }
    setCaptureMode("camera");
    void takePhoto();
  }, [captureMode, clearPickedImage, takePhoto]);

  const onGalleryModePress = useCallback(() => {
    if (captureMode !== "gallery") {
      clearPickedImage();
    }
    setCaptureMode("gallery");
    void pickFromGallery();
  }, [captureMode, clearPickedImage, pickFromGallery]);

  const predictCaption = useCallback(async () => {
    if (!pickedImage || isPredicting) {
      return;
    }

    setIsPredicting(true);
    setCaption(null);
    const startedAt = Date.now();
    try {
      const response = await predictImageCaption(client, pickedImage);
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SCAN_MS) {
        await wait(MIN_SCAN_MS - elapsed);
      }
      setCaption(response.caption);
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SCAN_MS) {
        await wait(MIN_SCAN_MS - elapsed);
      }
      const message = error instanceof Error ? error.message : copy.predictFailed;
      Alert.alert(copy.predictFailedTitle, message);
    } finally {
      setIsPredicting(false);
    }
  }, [client, copy.predictFailed, copy.predictFailedTitle, isPredicting, pickedImage]);

  const onShutterPress = useCallback(() => {
    if (isPredicting) {
      return;
    }
    if (!pickedImage) {
      void takePhoto();
      return;
    }
    void predictCaption();
  }, [isPredicting, pickedImage, predictCaption, takePhoto]);

  const bottomInset = TAB_BAR_CLEARANCE + Math.max(insets.bottom, 8);

  return (
    <View style={styles.root}>
      {pickedImage ? (
        <Image source={{ uri: pickedImage.uri }} style={styles.backgroundImage} resizeMode="cover" />
      ) : (
        <View style={[styles.backgroundImage, styles.placeholderBackground]} />
      )}

      <View style={styles.scrim} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ThemedText style={styles.heroPrompt}>{copy.heroPrompt}</ThemedText>

        <View style={styles.scanStage}>
          <View style={styles.scanFrame}>
            {pickedImage && !isPredicting ? <CaptionScanFrame /> : null}
            {pickedImage && isPredicting ? (
              <CaptionScanOverlay active={isPredicting} label={copy.scanning} />
            ) : null}

            {!pickedImage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.takePhotoA11y}
                onPress={() => void takePhoto()}
                style={styles.emptyFrame}
              >
                <Ionicons name="camera-outline" size={42} color="rgba(255,255,255,0.9)" />
                <ThemedText style={styles.emptyFrameText}>{copy.pickImageHint}</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[styles.bottomDock, { paddingBottom: bottomInset }]}>
          <CaptionResultCard
            visible={Boolean(caption && !isPredicting)}
            label={copy.captionReady}
            caption={caption ?? ""}
          />

          <View style={styles.controls}>
          <View style={styles.shutterRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.takePhotoA11y}
              disabled={isPredicting}
              onPress={onCameraModePress}
              style={[
                styles.sideButton,
                captureMode === "camera" ? styles.sideButtonActive : null,
              ]}
            >
              <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={pickedImage ? copy.shutterA11y : copy.takePhotoA11y}
              disabled={isPredicting}
              onPress={onShutterPress}
              style={styles.shutterOuter}
            >
              {isPredicting ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.galleryA11y}
              disabled={isPredicting}
              onPress={onGalleryModePress}
              style={[
                styles.sideButton,
                captureMode === "gallery" ? styles.sideButtonActive : null,
              ]}
            >
              <Ionicons name="images-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    paddingBottom: 12,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  placeholderBackground: {
    backgroundColor: "#15171C",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
  },
  safe: {
    flex: 1,
  },
  heroPrompt: {
    marginTop: 8,
    paddingHorizontal: 28,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
  },
  scanStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: BOTTOM_DOCK_RESERVE,
  },
  scanFrame: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 0.92,
    borderRadius: 24,
    overflow: "visible",
    position: "relative",
  },
  emptyFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 24,
  },
  emptyFrameText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  bottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  controls: {
    gap: 18,
  },
  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  sideButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sideButtonActive: {
    borderColor: "#86EFAC",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },
});
