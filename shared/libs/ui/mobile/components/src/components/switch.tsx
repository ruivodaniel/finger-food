// Contract: control--switch with surface--switch-inner (ui/types/elements.ts) · mirrors @libs/web-components Switch, 0.1.0
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import type { MobileState } from "../../../../types/axes";
import type { StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  status?: StatusOf<"switch">;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Switch({ checked, onCheckedChange, status, disabled = false, accessibilityLabel, testID, style }: SwitchProps) {
  const states: MobileState[] = [];
  if (checked) states.push("selected");
  if (disabled) states.push("disabled");
  const track = useElement("switch", { status, states });
  const thumb = useElement("switchInner");
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onCheckedChange?.(!checked)}
      // the thumb sits at the start when off, at the end when on
      style={[track.view, { flexDirection: "row", alignItems: "center", justifyContent: checked ? "flex-end" : "flex-start" }, style]}
    >
      <View style={thumb.view} />
    </Pressable>
  );
}
