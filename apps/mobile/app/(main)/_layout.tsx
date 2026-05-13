import { Stack } from 'expo-router';

/**
 * Main app flow: tab shell + auxiliary screens (e.g. dev settings).
 */
export default function MainStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dev-settings" />
    </Stack>
  );
}
