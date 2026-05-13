import { Stack } from 'expo-router';

/**
 * Unauthenticated flow: sign in / sign up.
 */
export default function AuthStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
