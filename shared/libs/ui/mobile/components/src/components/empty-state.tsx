// Contract: surface--empty-state (ui/types/elements.ts) · mirrors @libs/web-components EmptyState, 0.1.0
import { Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { EmphasisOf, StatusOf } from "../../../../types/elements";
import { useElement, useType } from "../theme";
import { Icon, type IconName } from "./icons";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  /** the way out: a button */
  action?: ReactNode;
  emphasis?: EmphasisOf<"emptyState">;
  status?: StatusOf<"emptyState">;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({ icon, title, description, action, emphasis, status, style, testID }: EmptyStateProps) {
  const el = useElement("emptyState", { emphasis, status });
  const heading = useType("heading4");
  return (
    <View testID={testID} style={[{ alignSelf: "stretch", alignItems: "center" }, el.view, style]}>
      {icon ? <Icon name={icon} size="xl" color={el.color} /> : null}
      <RNText accessibilityRole="header" style={[el.text, heading, { textAlign: "center" }]}>{title}</RNText>
      {description ? <RNText style={[el.text, { textAlign: "center" }]}>{description}</RNText> : null}
      {action}
    </View>
  );
}
