// Contract: control-group--choice-group with control--toggle options (ui/types/elements.ts)
// · mirrors the choice group of @libs/web-components (a set of toggles, one chosen), 0.1.0
import { Pressable, Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import { useState } from "react";
import type { MobileState } from "../../../../types/axes";
import type { EmphasisOf, ScaleOf, StatusOf } from "../../../../types/elements";
import { positionsOf, useElement } from "../theme";

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  testID?: string;
}

export interface ChoiceGroupProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<ChoiceOption<T>>;
  emphasis?: EmphasisOf<"choiceGroup">;
  status?: StatusOf<"choiceGroup">;
  scale?: ScaleOf<"choiceGroup">;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ChoiceGroup<T extends string = string>({ value, onChange, options, emphasis, status, scale = "md", disabled = false, accessibilityLabel, style }: ChoiceGroupProps<T>) {
  const group = useElement("choiceGroup", { emphasis, status, scale, states: disabled ? ["disabled"] : [] });
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[{ flexDirection: "row", alignSelf: "stretch" }, group.view, style]}>
      {options.map((o, i) => (
        <Option key={o.value} option={o} selected={o.value === value} disabled={disabled || !!o.disabled} scale={scale} index={i} count={options.length} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

function Option<T extends string>({ option, selected, disabled, scale, index, count, onPress }: { option: ChoiceOption<T>; selected: boolean; disabled: boolean; scale: ScaleOf<"toggle">; index: number; count: number; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const states: MobileState[] = [];
  if (selected) states.push("selected");
  if (pressed && !disabled) states.push("active");
  if (disabled) states.push("disabled");
  const el = useElement("toggle", { scale, states, positions: positionsOf(index, count) });
  return (
    <Pressable
      testID={option.testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }, el.view]}
    >
      <RNText style={el.text}>{option.label}</RNText>
    </Pressable>
  );
}
