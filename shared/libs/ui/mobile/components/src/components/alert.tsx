// Contract: surface--alert (ui/types/elements.ts) · mirrors @libs/web-components Alert, 0.1.0
import { Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { EmphasisOf, StatusOf } from "../../../../types/elements";
import { useElement, useType } from "../theme";
import { Icon, type IconName } from "./icons";

const STATUS_ICON: Partial<Record<NonNullable<StatusOf<"alert">>, IconName>> = { info: "info", success: "success", warning: "warning", error: "error", destructive: "error" };

export interface AlertProps {
  /** what the alert is: its fill, its colour and its icon follow it */
  status?: StatusOf<"alert">;
  emphasis?: EmphasisOf<"alert">;
  title?: string;
  description?: string;
  /** absent = the status's own icon; null = none */
  icon?: IconName | null;
  /** an action under the text: a button */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Alert({ status, emphasis, title, description, icon, action, style, testID }: AlertProps) {
  const el = useElement("alert", { status, emphasis });
  const strong = useType("heading4");
  const name = icon === null ? undefined : icon ?? (status ? STATUS_ICON[status] : undefined);
  return (
    <View testID={testID} accessibilityRole="alert" style={[{ flexDirection: "row", alignItems: "flex-start", alignSelf: "stretch" }, el.view, style]}>
      {name ? <Icon name={name} color={el.color} /> : null}
      <View style={{ flex: 1, minWidth: 0, rowGap: 2 }}>
        {title ? <RNText style={[el.text, strong]}>{title}</RNText> : null}
        {description ? <RNText style={el.text}>{description}</RNText> : null}
        {action ? <View style={{ marginTop: 8, alignItems: "flex-start" }}>{action}</View> : null}
      </View>
    </View>
  );
}
