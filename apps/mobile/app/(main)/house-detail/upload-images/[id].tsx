import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, router, useLocalSearchParams } from "expo-router";

import { useToast } from "@/components/toast";
import { ThemedText } from "@/components/themed-text";
import { isDevMode } from "@/src/config/dev-mode";
import { uploadHousingImages } from "@/src/features/housings/api/housing-images-upload";
import { HouseDetailHeader } from "@/src/features/housings/house-detail";
import { HousingUploadImageGrid } from "@/src/features/housings/house-detail/upload-images/components/housing-upload-image-grid";
import { HousingUploadImagePreviewModal } from "@/src/features/housings/house-detail/upload-images/components/housing-upload-image-preview-modal";
import { preloadHousingImages } from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import { pickHousingImagesFromLibrary } from "@/src/features/housings/house-detail/upload-images/pick-housing-images";
import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";
import { useLanguage } from "@/src/i18n";
import { href } from "@/src/navigation/href";
import { useAuth } from "@/src/providers/auth-context";
import { queryKeys } from "@/src/query/query-keys";
import { useAppTheme } from "@/src/theme";

export default function HouseUploadImagesScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const housingId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  const { getApiClient } = useAuth();
  const { dictionary } = useLanguage();
  const d = dictionary.houseDetail;
  const { colors: c } = useAppTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const client = useMemo(() => getApiClient(), [getApiClient]);

  const [pendingImages, setPendingImages] = useState<PendingHousingImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const mergePickedImages = useCallback((picked: PendingHousingImage[]) => {
    setPendingImages((prev) => {
      const seen = new Set(prev.map((img) => img.uri));
      const next = picked.filter((img) => !seen.has(img.uri));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
  }, []);

  const onAddPhotos = useCallback(async () => {
    const result = await pickHousingImagesFromLibrary();
    if (!result.ok) {
      if (result.reason === "permission_denied") {
        showToast({ status: "warning", title: d.uploadPermissionDenied, durationMs: 2800 });
      }
      return;
    }
    mergePickedImages(result.images);
    preloadHousingImages(result.images.map((img) => img.uri));
  }, [d.uploadPermissionDenied, mergePickedImages, showToast]);

  const onRemoveImage = useCallback((imageId: string) => {
    setPendingImages((prev) => {
      const next = prev.filter((img) => img.id !== imageId);
      setPreviewIndex((current) => {
        if (current == null) {
          return current;
        }
        const removedAt = prev.findIndex((img) => img.id === imageId);
        if (removedAt < 0) {
          return current;
        }
        if (next.length === 0) {
          return null;
        }
        if (current > removedAt) {
          return current - 1;
        }
        if (current === removedAt) {
          return Math.min(current, next.length - 1);
        }
        return current;
      });
      return next;
    });
  }, []);

  const onPressImage = useCallback(
    (image: PendingHousingImage) => {
      const index = pendingImages.findIndex((img) => img.id === image.id);
      if (index >= 0) {
        setPreviewIndex(index);
      }
    },
    [pendingImages],
  );

  const onClosePreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!housingId || pendingImages.length === 0 || isSubmitting) {
      if (pendingImages.length === 0) {
        showToast({ status: "warning", title: d.uploadNoImages, durationMs: 2400 });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadHousingImages(
        client,
        housingId,
        pendingImages.map(({ uri, name, mimeType }) => ({ uri, name, mimeType })),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.housings.detail(client.baseUrl, housingId),
      });
      showToast({ status: "success", title: d.uploadSuccess, durationMs: 2200 });
      router.back();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : d.uploadFailed;
      showToast({ status: "error", title: message || d.uploadFailed, durationMs: 3200 });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    client,
    d.uploadFailed,
    d.uploadNoImages,
    d.uploadSuccess,
    housingId,
    isSubmitting,
    pendingImages,
    queryClient,
    showToast,
  ]);

  if (!isDevMode) {
    return <Redirect href={housingId ? href.mainHouseDetail(housingId) : href.mainHome} />;
  }

  if (!housingId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
        <HouseDetailHeader title={d.uploadScreenTitle} />
        <View style={styles.center}>
          <ThemedText style={{ color: c.hint }}>{d.loadFailed}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = pendingImages.length > 0 && !isSubmitting;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top", "bottom"]}>
      <HouseDetailHeader title={d.uploadScreenTitle} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.hint, { color: c.hint }]}>
          {pendingImages.length === 0 ? d.uploadEmptyHint : d.uploadReviewHint}
        </ThemedText>

        {pendingImages.length > 0 ? (
          <HousingUploadImageGrid
            images={pendingImages}
            viewAccessibilityLabel={d.uploadViewImage}
            removeAccessibilityLabel={d.uploadRemoveImage}
            onPressImage={onPressImage}
            onRemove={onRemoveImage}
          />
        ) : (
          <View style={[styles.emptyBox, { borderColor: c.border, backgroundColor: c.card }]}>
            <Ionicons name="images-outline" size={40} color={c.hint} />
            <ThemedText style={[styles.emptyText, { color: c.hint }]}>{d.uploadEmptyHint}</ThemedText>
          </View>
        )}

        <Pressable
          onPress={() => void onAddPhotos()}
          disabled={isSubmitting}
          style={[
            styles.addBtn,
            { borderColor: c.border, backgroundColor: c.card },
            isSubmitting && styles.disabled,
          ]}
        >
          <Ionicons name="add-circle-outline" size={22} color={c.primary} />
          <ThemedText style={[styles.addBtnText, { color: c.primary }]}>{d.uploadAddPhotos}</ThemedText>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.screen }]}>
        <Pressable
          onPress={() => void onSubmit()}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            { backgroundColor: c.primary },
            !canSubmit && styles.disabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <ThemedText style={[styles.submitText, { color: "#FFFFFF" }]}>
                {d.uploadSubmit}
                {pendingImages.length > 0 ? ` (${pendingImages.length})` : ""}
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>

      <HousingUploadImagePreviewModal
        visible={previewIndex != null}
        images={pendingImages}
        initialIndex={previewIndex ?? 0}
        closeAccessibilityLabel={d.uploadClosePreview}
        onClose={onClosePreview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scroll: { padding: 16, gap: 16, paddingBottom: 24 },
  hint: { fontSize: 14, lineHeight: 20 },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  submitText: { fontSize: 16, fontWeight: "700" },
  submittingHint: { fontSize: 13, textAlign: "center" },
  disabled: { opacity: 0.5 },
});
