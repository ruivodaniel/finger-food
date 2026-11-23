// Contract: field--otp with field--otp-slot (ui/types/elements.ts) · mirrors @libs/web-components InputOTP, 0.1.0
import { Pressable, Text as RNText, TextInput as RNTextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { useRef, useState } from "react";
import type { MobileState } from "../../../../types/axes";
import type { StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

export interface InputOTPProps {
  /** how many digits (default: 6) */
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  /** called once every digit is in */
  onComplete?: (value: string) => void;
  status?: StatusOf<"otp">;
  disabled?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** A one-time code: one box per digit, one input behind them (so the system's code autofill and paste work). */
export function InputOTP({ length = 6, value, onChangeText, onComplete, status, disabled = false, autoFocus, accessibilityLabel = "One-time code", testID, style }: InputOTPProps) {
  const input = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);
  const group = useElement("otp", { status, states: disabled ? ["disabled"] : [] });
  const change = (next: string) => {
    const digits = next.replace(/\D/g, "").slice(0, length);
    onChangeText(digits);
    if (digits.length === length) onComplete?.(digits);
  };
  return (
    <Pressable onPress={() => input.current?.focus()} disabled={disabled} style={[{ flexDirection: "row", alignSelf: "flex-start" }, group.view, style]}>
      {Array.from({ length }, (_, i) => (
        <Slot key={i} char={value[i] ?? ""} current={focused && i === Math.min(value.length, length - 1)} />
      ))}
      <RNTextInput
        ref={input}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={change}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // the input is behind the boxes: it takes the typing, the boxes show it
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0 }}
      />
    </Pressable>
  );
}

function Slot({ char, current }: { char: string; current: boolean }) {
  const states: MobileState[] = current ? ["selected"] : [];
  const el = useElement("otpSlot", { states });
  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, el.view]}>
      <RNText style={el.text}>{char}</RNText>
    </View>
  );
}
