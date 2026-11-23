// Contract: surface--group (ui/types/elements.ts): a titled section of content.
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useElement } from "../theme";
import { Label } from "./field";

export interface GroupProps extends Omit<ViewProps, "style"> {
  /** the title, in the label voice */
  title?: string;
  /** what sits at the end of the title row: a badge, an action */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Group({ title, trailing, style, children, ...rest }: GroupProps) {
  const el = useElement("group");
  return (
    <View style={[{ alignSelf: "stretch" }, el.view, style]} {...rest}>
      {title || trailing ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {title ? <Label accessibilityRole="header">{title}</Label> : <View />}
          {trailing}
        </View>
      ) : null}
      {children}
    </View>
  );
}
