import { Image } from 'expo-image';
import { ActivityIndicator, Button, StyleSheet, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UploadResultCard, useReceiptUpload } from '@/src/features/receipt-upload';

export default function HomeScreen() {
  const { apiBaseUrl, imageUri, isUploading, error, result, setApiBaseUrl, pickImage, submitUpload } =
    useReceiptUpload();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<ThemedView style={styles.headerPlaceholder} />}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Upload Receipt</ThemedText>
        <ThemedText style={styles.helperText}>
          Chọn ảnh hóa đơn và gọi API <ThemedText type="defaultSemiBold">POST /upload</ThemedText>.
        </ThemedText>

        <ThemedText type="defaultSemiBold">Backend URL</ThemedText>
        <TextInput
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="http://192.168.x.x:8000"
        />

        <Button title="Chọn ảnh" onPress={pickImage} />

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" /> : null}

        <Button
          title={isUploading ? 'Đang upload...' : 'Upload /upload'}
          onPress={submitUpload}
          disabled={isUploading}
        />

        {isUploading ? <ActivityIndicator style={styles.loading} /> : null}

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        {result ? <UploadResultCard result={result} /> : null}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerPlaceholder: {
    flex: 1,
  },
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  helperText: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  loading: {
    marginTop: 4,
  },
  errorText: {
    color: '#d32f2f',
  },
});
