// Contract: surface--badge (ui/types/elements.ts) · mirrors @libs/web-components Badge, 0.1.0
import { Text as RNText, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { EmphasisOf, ScaleOf, StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

export interface BadgeProps extends Omit<ViewProps, "style"> {
  emphasis?: EmphasisOf<"badge">;
  status?: StatusOf<"badge">;
  scale?: ScaleOf<"badge">;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Badge({ emphasis, status, scale, style, children, ...rest }: BadgeProps) {
  const el = useElement("badge", { emphasis, status, scale });
  return (
    <View style={[{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center" }, el.view, style]} {...rest}>
      {typeof children === "string" || typeof children === "number" ? <RNText style={el.text}>{children}</RNText> : children}
    </View>
  );
}
