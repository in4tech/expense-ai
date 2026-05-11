import { UploadReceiptResponse } from '@/src/features/receipt-upload/types';

const buildMimeType = (fileName: string) => {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
  return ext === 'png' ? 'image/png' : 'image/jpeg';
};

export const uploadReceipt = async (
  apiBaseUrl: string,
  imageUri: string
): Promise<UploadReceiptResponse> => {
  const fileName = imageUri.split('/').pop() ?? `receipt-${Date.now()}.jpg`;
  const mimeType = buildMimeType(fileName);

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as never);

  const response = await fetch(`${apiBaseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload thất bại (${response.status})`);
  }

  return (await response.json()) as UploadReceiptResponse;
};
