import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { PickedAttachment } from '@/src/features/chat/compose-attachment-message';

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
  cancelLabel: string;
  startNewConversation: () => void;
}) {
  const { isSending, chat, cancelLabel, startNewConversation } = options;
  const [pickedAttachment, setPickedAttachment] = useState<PickedAttachment | null>(null);

  const beginNewConversation = useCallback(() => {
    setPickedAttachment(null);
    startNewConversation();
  }, [startNewConversation]);

  const pickDocument = useCallback(async () => {
    if (isSending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedAttachment({
        uri: asset.uri,
        name: asset.name,
        kind: 'document',
        mimeType: asset.mimeType ?? undefined,
      });
    } catch {
      Alert.alert('', chat.pickFileFailed);
    }
  }, [isSending, chat.pickFileFailed]);

  const pickImageFromLibrary = useCallback(async () => {
    if (isSending) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('', chat.pickImagePermissionDenied);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const name = asset.fileName ?? 'photo.jpg';
      setPickedAttachment({
        uri: asset.uri,
        name,
        kind: 'image',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      Alert.alert('', chat.pickImageFailed);
    }
  }, [isSending, chat.pickImageFailed, chat.pickImagePermissionDenied]);

  const openAttachmentMenu = useCallback(() => {
    if (isSending) return;
    Alert.alert(chat.attachMenuTitle, undefined, [
      { text: chat.attachMenuPhoto, onPress: () => void pickImageFromLibrary() },
      { text: chat.attachMenuDocument, onPress: () => void pickDocument() },
      { text: cancelLabel, style: 'cancel' },
    ]);
  }, [
    isSending,
    chat.attachMenuTitle,
    chat.attachMenuPhoto,
    chat.attachMenuDocument,
    cancelLabel,
    pickImageFromLibrary,
    pickDocument,
  ]);

  return {
    pickedAttachment,
    setPickedAttachment,
    openAttachmentMenu,
    beginNewConversation,
  };
}
