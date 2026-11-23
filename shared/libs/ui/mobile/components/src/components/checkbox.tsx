// Contract: control--checkbox with surface--checkbox-inner (ui/types/elements.ts) · mirrors @libs/web-components Checkbox, 0.1.0
import { Pressable, Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { MobileState } from "../../../../types/axes";
import type { StatusOf } from "../../../../types/elements";
import { useElement, useType } from "../theme";
import { Icon } from "./icons";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** what is being agreed to or chosen, beside the box */
  label?: ReactNode;
  status?: StatusOf<"checkbox">;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({ checked, onCheckedChange, label, status, disabled = false, accessibilityLabel, testID, style }: CheckboxProps) {
  const states: MobileState[] = [];
  if (checked) states.push("selected");
  if (disabled) states.push("disabled");
  const box = useElement("checkbox", { status, states });
  const text = useType("body");
  const words = useElement("fieldDescription");
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? (typeof label === "string" ? label : undefined)}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onCheckedChange?.(!checked)}
      style={[{ flexDirection: "row", alignItems: "flex-start", columnGap: 12, flexShrink: 1, maxWidth: "100%" }, style]}
    >
      <View style={[{ alignItems: "center", justifyContent: "center", flexShrink: 0 }, box.view]}>
        {checked ? <Icon name="check" size="sm" color={box.color} weight={3} /> : null}
      </View>
      {typeof label === "string" ? <RNText style={[text, { flex: 1, color: words.color }]}>{label}</RNText> : label ? <View style={{ flex: 1 }}>{label}</View> : null}
    </Pressable>
  );
}
