// Contract: control--button (ui/types/elements.ts) · mirrors @libs/web-components Button, 0.1.0
import { ActivityIndicator, Platform, Pressable, Text as RNText, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useState, type ReactNode } from "react";
import type { MobileState } from "../../../../types/axes";
import type { EmphasisOf, ScaleOf, StatusOf } from "../../../../types/elements";
import { useElement, useTheme, useColor } from "../theme";
import { Icon, type IconName } from "./icons";

export interface ButtonProps extends Omit<PressableProps, "style" | "children" | "disabled"> {
  emphasis?: EmphasisOf<"button">;
  status?: StatusOf<"button">;
  scale?: ScaleOf<"button">;
  /** force a state, beside the ones the button reaches by itself (pressed, disabled, loading) */
  state?: MobileState;
  disabled?: boolean;
  loading?: boolean;
  /** Start (leading) icon */
  startIcon?: IconName;
  /** End (trailing) icon */
  endIcon?: IconName;
  /** take the whole width of the parent */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Button({
  emphasis = "primary", status, scale = "md", state, disabled = false, loading = false,
  startIcon, endIcon, fill = false, style, children,
  accessibilityState, android_ripple, onPressIn, onPressOut, onLongPress, ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);
  const [held, setHeld] = useState(false);
  const inactive = disabled || loading;

  const states: MobileState[] = [];
  if (state) states.push(state);
  if (pressed && !inactive) states.push("active");
  if (held && !inactive) states.push("long-pressed");
  if (loading) states.push("loading");
  else if (disabled) states.push("disabled");

  const el = useElement("button", { emphasis, status, scale, states });
  const rippleColor = useColor(theme.press.ripple.color);
  const iconPoints = el.icon.size;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading, ...accessibilityState }}
      disabled={inactive}
      hitSlop={8}
      android_ripple={Platform.OS === "android" && !inactive ? android_ripple ?? { color: rippleColor, borderless: theme.press.ripple.borderless } : undefined}
      onPressIn={(e) => { setPressed(true); onPressIn?.(e); }}
      onPressOut={(e) => { setPressed(false); setHeld(false); onPressOut?.(e); }}
      onLongPress={(e) => { setHeld(true); onLongPress?.(e); }}
      style={[
        { flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden", alignSelf: fill ? "stretch" : "flex-start" },
        el.view,
        Platform.OS === "ios" && pressed && !inactive ? { opacity: theme.press.opacityDim } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator size="small" color={el.color} /> : startIcon ? <Icon name={startIcon} color={el.color} points={iconPoints} weight={el.icon.weight} /> : null}
      {typeof children === "string" || typeof children === "number" ? <RNText style={el.text}>{children}</RNText> : children ? <View>{children}</View> : null}
      {endIcon ? <Icon name={endIcon} color={el.color} points={iconPoints} weight={el.icon.weight} /> : null}
    </Pressable>
  );
}
