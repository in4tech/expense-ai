import type { Href } from "expo-router";

/** Typed routes may lag file moves; keep paths in one place. */
export const href = {
  authSignIn: "/(auth)/sign-in" as Href,
  authSignUp: "/(auth)/sign-up" as Href,
  mainChat: "/(main)/(tabs)/chat" as Href,
  mainCaption: "/(main)/(tabs)/caption" as Href,
  mainSettings: "/(main)/(tabs)/settings" as Href,
  mainDevSettings: "/(main)/dev-settings" as Href,
  mainProfile: "/(main)/profile" as Href,
  mainHome: "/(main)/(tabs)/home" as Href,
  mainHomeListings: "/(main)/home-listings" as Href,
  mainNotifications: "/(main)/notifications" as Href,
  mainHousingPredict: "/(main)/housing-predict" as Href,
  mainHousingPredictResult: "/(main)/housing-predict-result" as Href,
  mainMapPickLocation: "/(main)/map-pick-location" as Href,
  mainHouseDetail: (housingId: string) => `/(main)/house-detail/${housingId}` as Href,
  mainHouseUploadImages: (housingId: string) =>
    `/(main)/house-detail/upload-images/${housingId}` as Href,
};
