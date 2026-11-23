// A composite, mobile's own: a number with a minus and a plus.
// Elements: control-group--button-group · control--button · surface--button-group-text (ui/types/elements.ts).
import { Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import type { ScaleOf } from "../../../../types/elements";
import { useElement } from "../theme";
import { Button } from "./button";

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** how the value reads, e.g. v => `${v} students`; String(v) when absent */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  scale?: ScaleOf<"buttonGroup">;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({ value, onChange, min = -Infinity, max = Infinity, step = 1, formatValue, disabled = false, scale = "md", accessibilityLabel, style }: StepperProps) {
  const group = useElement("buttonGroup", { scale, states: disabled ? ["disabled"] : [] });
  const cell = useElement("buttonGroupText", { scale });
  const text = formatValue ? formatValue(value) : String(value);
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text }}
      style={[{ flexDirection: "row", alignItems: "stretch", alignSelf: "flex-start" }, group.view, style]}
    >
      <Button emphasis="secondary" scale={scale} startIcon="remove" accessibilityLabel="Decrease" disabled={disabled || value - step < min} onPress={() => onChange(Math.max(min, value - step))} />
      <View style={[{ alignItems: "center", justifyContent: "center", minWidth: 96 }, cell.view]}>
        <RNText style={cell.text}>{text}</RNText>
      </View>
      <Button emphasis="secondary" scale={scale} startIcon="add" accessibilityLabel="Increase" disabled={disabled || value + step > max} onPress={() => onChange(Math.min(max, value + step))} />
    </View>
  );
}
