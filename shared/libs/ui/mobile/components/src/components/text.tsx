// Contract: the typography elements, type--<level> (ui/types/primitives.ts TypographyTypeKey).
// On the web they are an attribute on any tag; on mobile text is a component, so this is it.
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import type { TypographyTypeKey } from "../../../../types/primitives";
import { useColor, useType } from "../theme";

export interface TextProps extends Omit<RNTextProps, "style"> {
  /** the typography level (default: "body") */
  type?: TypographyTypeKey;
  /** a colour of the theme, by its name; absent = the foreground. Inside a themed element, the element passes its own. */
  color?: string;
  align?: "left" | "center" | "right";
  style?: RNTextProps["style"];
}

export function Text({ type = "body", color, align, style, ...rest }: TextProps) {
  const level = useType(type);
  const resolved = useColor(color ?? "foreground");
  return <RNText style={[level, { color: resolved }, align ? { textAlign: align } : null, style]} {...rest} />;
}
