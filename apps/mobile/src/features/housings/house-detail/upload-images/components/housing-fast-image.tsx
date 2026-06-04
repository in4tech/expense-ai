import FastImage, { type ImageStyle as FastImageStyle } from "react-native-fast-image";
import { type StyleProp } from "react-native";

export type HousingImageContentFit = "cover" | "contain";

const resizeModeMap = {
  cover: FastImage.resizeMode.cover,
  contain: FastImage.resizeMode.contain,
} as const;

type Props = {
  uri: string;
  style?: StyleProp<FastImageStyle>;
  contentFit?: HousingImageContentFit;
  accessibilityLabel?: string;
  priority?: "low" | "normal" | "high";
};

export function HousingFastImage({
  uri,
  style,
  contentFit = "cover",
  accessibilityLabel,
  priority = "normal",
}: Props) {
  return (
    <FastImage
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      source={{
        uri,
        priority: FastImage.priority[priority],
        cache: FastImage.cacheControl.immutable,
      }}
      style={style}
      resizeMode={resizeModeMap[contentFit]}
    />
  );
}

export const preloadHousingImages = (uris: string[]) => {
  if (uris.length === 0) {
    return;
  }
  FastImage.preload(uris.map((uri) => ({ uri })));
};
