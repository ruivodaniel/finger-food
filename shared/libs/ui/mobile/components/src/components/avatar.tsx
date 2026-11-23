// Contract: surface--avatar (ui/types/elements.ts) · mirrors @libs/web-components Avatar, 0.1.0
import { Image, Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import type { EmphasisOf, StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

export type AvatarScale = "xs" | "sm" | "md" | "lg" | "xl";
const POINTS: Record<AvatarScale, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };

export interface AvatarProps {
  /** the person or the thing: its initials show when there is no image */
  name: string;
  image?: string | null;
  emphasis?: EmphasisOf<"avatar">;
  status?: StatusOf<"avatar">;
  scale?: AvatarScale;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({ name, image, emphasis, status, scale = "md", style, testID }: AvatarProps) {
  const el = useElement("avatar", { emphasis, status, scale });
  const side = POINTS[scale];
  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[{ width: side, height: side, alignItems: "center", justifyContent: "center", overflow: "hidden" }, el.view, style]}
    >
      {image ? <Image source={{ uri: image }} style={{ width: side, height: side }} /> : <RNText style={el.text}>{initialsOf(name)}</RNText>}
    </View>
  );
}
