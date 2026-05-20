import type { Href } from "expo-router";

/** Typed routes may lag file moves; keep paths in one place. */
export const href = {
  authSignIn: "/(auth)/sign-in" as Href,
  authSignUp: "/(auth)/sign-up" as Href,
  mainChat: "/(main)/(tabs)/chat" as Href,
  mainSettings: "/(main)/(tabs)/settings" as Href,
  mainDevSettings: "/(main)/dev-settings" as Href,
  mainProfile: "/(main)/profile" as Href,
  mainHome: "/(main)/(tabs)/home" as Href,
  mainHousingPredict: "/(main)/housing-predict" as Href,
  mainMapPickLocation: "/(main)/map-pick-location" as Href,
};
