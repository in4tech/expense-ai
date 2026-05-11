import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UploadReceiptResponse } from '@/src/features/receipt-upload/types';

type UploadResultCardProps = {
  result: UploadReceiptResponse;
};

export const UploadResultCard = ({ result }: UploadResultCardProps) => {
  return (
    <ThemedView style={styles.resultBox}>
      <ThemedText type="subtitle">Ket qua</ThemedText>
      <ThemedText selectable>{JSON.stringify(result, null, 2)}</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  resultBox: {
    gap: 8,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 12,
  },
});
