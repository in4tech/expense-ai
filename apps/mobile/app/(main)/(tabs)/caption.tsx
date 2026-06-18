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
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CaptionIdleStage,
  CaptionImageActions,
  CaptionNextActions,
  CaptionResultCard,
  CaptionScanFrame,
  CaptionScanOverlay,
  CaptionScreenHeader,
  captionImagePickerOptions,
  predictImageCaption,
  toCaptionPickedAsset,
} from "@/src/features/image-caption";
import { isAndroid } from "@/src/config/dev-mode";
import { useLanguage } from "@/src/i18n";
import { setCaptionChatDraft } from "@/src/navigation/caption-chat-bridge";
import { href } from "@/src/navigation/href";
import { useAuth } from "@/src/providers/auth-context";

type PickedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type CaptureMode = "camera" | "gallery";

const TAB_BAR_CLEARANCE = isAndroid ? 120 : 0;
const MIN_SCAN_MS = 5000;
const BOTTOM_DOCK_RESERVE = 210;

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
    setPickedImage(toCaptionPickedAsset(asset));
    setCaption(null);
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(copy.cameraPermissionDeniedTitle, copy.cameraPermissionDeniedMessage);
      return;
    }

    const result = await ImagePicker.launchCameraAsync(captionImagePickerOptions);

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

    const result = await ImagePicker.launchImageLibraryAsync(captionImagePickerOptions);

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
      if (captureMode === "gallery") {
        void pickFromGallery();
      } else {
        void takePhoto();
      }
      return;
    }
    void predictCaption();
  }, [captureMode, isPredicting, pickedImage, pickFromGallery, predictCaption, takePhoto]);

  const onAskAiPress = useCallback(() => {
    if (!caption) {
      return;
    }
    const draft = copy.askAiDraft.replace("{{caption}}", caption);
    setCaptionChatDraft(draft);
    router.push(href.mainChat);
  }, [caption, copy.askAiDraft]);

  const onNewPhotoPress = useCallback(() => {
    clearPickedImage();
    void takePhoto();
  }, [clearPickedImage, takePhoto]);

  const onChangeImagePress = useCallback(() => {
    if (captureMode === "gallery") {
      void pickFromGallery();
      return;
    }
    void takePhoto();
  }, [captureMode, pickFromGallery, takePhoto]);

  const hasCaption = Boolean(caption && !isPredicting);
  const isCameraIdle = !pickedImage && captureMode === "camera";
  const isGalleryIdle = !pickedImage && captureMode === "gallery";
  const showHero = !hasCaption && !isPredicting;

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
        {showHero ? (
          <CaptionScreenHeader
            eyebrow={copy.modeCaption}
            title={pickedImage ? copy.predictButton : undefined}
            subtitle={pickedImage ? copy.headerGenerateHint : undefined}
            mode={captureMode}
            modeLabel={captureMode === "camera" ? copy.modeCamera : copy.modeGallery}
          />
        ) : null}

        {!hasCaption ? (
          <View style={styles.scanStage}>
            <View style={styles.scanFrame}>
              {pickedImage && !isPredicting ? <CaptionScanFrame /> : null}
              {pickedImage && isPredicting ? (
                <CaptionScanOverlay active={isPredicting} label={copy.scanning} />
              ) : null}

              {!pickedImage && (isCameraIdle || isGalleryIdle) ? (
                <CaptionIdleStage
                  mode={captureMode}
                  title={isCameraIdle ? copy.cameraReadyTitle : copy.pickImage}
                  subtitle={isCameraIdle ? copy.cameraReadySubtitle : copy.subtitle}
                  hint={isCameraIdle ? copy.cameraReadyHint : copy.idleGalleryHint}
                  accessibilityLabel={isCameraIdle ? copy.takePhotoA11y : copy.galleryA11y}
                  onPress={() => (isCameraIdle ? void takePhoto() : void pickFromGallery())}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={[styles.bottomDock, { paddingBottom: bottomInset }]}>
          <CaptionResultCard
            visible={hasCaption}
            label={copy.captionReady}
            caption={caption ?? ""}
          />

          <CaptionNextActions
            visible={hasCaption}
            askAiLabel={copy.askAi}
            newPhotoLabel={copy.newPhoto}
            askAiA11y={copy.askAiA11y}
            newPhotoA11y={copy.newPhotoA11y}
            onAskAi={onAskAiPress}
            onNewPhoto={onNewPhotoPress}
          />

          <CaptionImageActions
            visible={Boolean(pickedImage && !isPredicting && !hasCaption)}
            changeLabel={copy.changeImage}
            clearLabel={copy.clearImage}
            changeA11y={copy.changeImageA11y}
            clearA11y={copy.clearImageA11y}
            onChange={onChangeImagePress}
            onClear={clearPickedImage}
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
              accessibilityLabel={
                hasCaption
                  ? copy.regenerateA11y
                  : pickedImage
                    ? copy.shutterA11y
                    : copy.takePhotoA11y
              }
              disabled={isPredicting}
              onPress={onShutterPress}
              style={styles.shutterOuter}
            >
              {isPredicting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : hasCaption ? (
                <View style={styles.shutterInner}>
                  <Ionicons name="refresh" size={28} color="#111111" />
                </View>
              ) : pickedImage ? (
                <View style={styles.shutterInner}>
                  <Ionicons name="arrow-up" size={28} color="#111111" />
                </View>
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
    overflow: "hidden",
    position: "relative",
  },
  bottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  controls: {
    gap: 14,
  },
  captureHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
});
