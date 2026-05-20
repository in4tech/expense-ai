import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import type { PickedAttachment } from "@/src/features/chat/compose-attachment-message";

type ChatDictionarySlice = {
  pickFileFailed: string;
  pickImageFailed: string;
  pickImagePermissionDenied: string;
  attachMenuTitle: string;
  attachMenuPhoto: string;
  attachMenuDocument: string;
};

export function useChatScreenAttachments(options: {
  isSending: boolean;
  chat: ChatDictionarySlice;
  startNewConversation: () => void;
}) {
  const { isSending, chat, startNewConversation } = options;
  const [pickedAttachment, setPickedAttachment] =
    useState<PickedAttachment | null>(null);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);

  const closeAttachmentPicker = useCallback(() => {
    setAttachmentPickerOpen(false);
  }, []);

  const beginNewConversation = useCallback(() => {
    setPickedAttachment(null);
    setAttachmentPickerOpen(false);
    startNewConversation();
  }, [startNewConversation]);

  const pickDocument = useCallback(async () => {
    if (isSending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "application/pdf",
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedAttachment({
        uri: asset.uri,
        name: asset.name,
        kind: "document",
        mimeType: asset.mimeType ?? undefined,
      });
    } catch {
      Alert.alert("", chat.pickFileFailed);
    }
  }, [isSending, chat.pickFileFailed]);

  const pickImageFromLibrary = useCallback(async () => {
    if (isSending) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("", chat.pickImagePermissionDenied);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const name = asset.fileName ?? "photo.jpg";
      setPickedAttachment({
        uri: asset.uri,
        name,
        kind: "image",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    } catch {
      Alert.alert("", chat.pickImageFailed);
    }
  }, [isSending, chat.pickImageFailed, chat.pickImagePermissionDenied]);

  const openAttachmentMenu = useCallback(() => {
    if (isSending) return;
    setAttachmentPickerOpen(true);
  }, [isSending]);

  const pickPhotoFromSheet = useCallback(() => {
    setAttachmentPickerOpen(false);
    requestAnimationFrame(() => {
      void pickImageFromLibrary();
    });
  }, [pickImageFromLibrary]);

  const pickDocumentFromSheet = useCallback(() => {
    setAttachmentPickerOpen(false);
    requestAnimationFrame(() => {
      void pickDocument();
    });
  }, [pickDocument]);

  return {
    pickedAttachment,
    setPickedAttachment,
    openAttachmentMenu,
    beginNewConversation,
    attachmentPickerOpen,
    closeAttachmentPicker,
    pickPhotoFromSheet,
    pickDocumentFromSheet,
  };
}
