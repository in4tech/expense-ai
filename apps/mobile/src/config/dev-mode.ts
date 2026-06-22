import { Platform } from "react-native";

/** True in Expo/RN development builds; false in production release builds. */
export const isDevMode = typeof __DEV__ !== "undefined" && __DEV__;

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';