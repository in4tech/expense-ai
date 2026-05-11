import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import { uploadReceipt } from '@/src/features/receipt-upload/api/upload-receipt';
import { UploadReceiptResponse } from '@/src/features/receipt-upload/types';

export const useReceiptUpload = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadReceiptResponse | null>(null);

  const pickImage = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Cần cấp quyền truy cập ảnh để upload.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const submitUpload = async () => {
    if (!imageUri) {
      setError('Vui lòng chọn ảnh trước khi upload.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const payload = await uploadReceipt(apiBaseUrl, imageUri);
      setResult(payload);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    apiBaseUrl,
    imageUri,
    isUploading,
    error,
    result,
    setApiBaseUrl,
    pickImage,
    submitUpload,
  };
};
