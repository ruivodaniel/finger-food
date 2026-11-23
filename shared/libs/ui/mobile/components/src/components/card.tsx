// Contract: surface--card and its regions surface--header · surface--content · surface--footer
// (ui/types/elements.ts) · mirrors @libs/web-components Card, CardHeader, CardContent, CardFooter, 0.1.0
import { Pressable, Text as RNText, View, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useState, type ReactNode } from "react";
import type { MobileState } from "../../../../types/axes";
import type { EmphasisOf, MobileElementKey, ScaleOf, StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

export interface CardProps extends Omit<ViewProps, "style"> {
  emphasis?: EmphasisOf<"card">;
  status?: StatusOf<"card">;
  scale?: ScaleOf<"card">;
  state?: MobileState;
  /** a card that can be pressed: it takes the `active` state while pressed */
  onPress?: PressableProps["onPress"];
  onLongPress?: PressableProps["onLongPress"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Card({ emphasis, status, scale, state, onPress, onLongPress, disabled = false, style, children, ...rest }: CardProps) {
  const [pressed, setPressed] = useState(false);
  const states: MobileState[] = [];
  if (state) states.push(state);
  if (pressed) states.push("active");
  if (disabled) states.push("disabled");
  const el = useElement("card", { emphasis, status, scale, states });
  if (!onPress && !onLongPress) return <View style={[el.view, style]} {...rest}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[el.view, style]}
      {...(rest as PressableProps)}
    >
      {children}
    </Pressable>
  );
}

type RegionProps = Omit<ViewProps, "style"> & { style?: StyleProp<ViewStyle>; children?: ReactNode };
function region(element: MobileElementKey) {
  return function Region({ style, children, ...rest }: RegionProps) {
    const el = useElement(element);
    return (
      <View style={[el.view, style]} {...rest}>
        {typeof children === "string" ? <RNText style={el.text}>{children}</RNText> : children}
      </View>
    );
  };
}
export const CardHeader = region("header");
export const CardContent = region("content");
export const CardFooter = region("footer");
