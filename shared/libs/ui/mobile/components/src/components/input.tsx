// Contract: field--input (ui/types/elements.ts) · mirrors @libs/web-components Input, 0.1.0
import { TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from "react-native";
import { forwardRef, useState, type ReactNode } from "react";
import type { MobileState } from "../../../../types/axes";
import type { EmphasisOf, ScaleOf, StatusOf } from "../../../../types/elements";
import { useColor, useElement } from "../theme";
import { useField } from "./field";

export interface InputProps extends Omit<RNTextInputProps, "style" | "editable"> {
  emphasis?: EmphasisOf<"input">;
  /** absent = the surrounding Field's (error when it has one) */
  status?: StatusOf<"input">;
  /** absent = the surrounding Field's, else "md" */
  scale?: ScaleOf<"input">;
  state?: MobileState;
  disabled?: boolean;
  /** what sits before and after the text, inside the field */
  start?: ReactNode;
  end?: ReactNode;
  style?: RNTextInputProps["style"];
}

export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { emphasis, status, scale, state, disabled = false, start, end, style, onFocus, onBlur, placeholderTextColor, accessibilityState, accessibilityLabelledBy, nativeID, ...rest },
  ref,
) {
  const field = useField();
  const [focused, setFocused] = useState(false);
  const states: MobileState[] = [];
  if (state) states.push(state);
  if (focused) states.push("focus");
  if (disabled) states.push("disabled");
  const effectiveStatus = status ?? (field?.hasError ? "error" : undefined);
  const el = useElement("input", { emphasis, status: effectiveStatus, scale: scale ?? field?.scale ?? "md", states });
  const placeholder = useColor(el.extras.placeholderColor);
  const caret = useColor(el.extras.caretColor);
  const multiline = rest.multiline === true;

  return (
    <View style={[{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", alignSelf: "stretch" }, el.view]}>
      {start}
      <RNTextInput
        ref={ref}
        editable={!disabled}
        // the text fills the field; its own padding is the field's, already on the container
        style={[{ flex: 1, minWidth: 0, padding: 0, margin: 0 }, el.text, multiline ? null : { lineHeight: undefined }, style]}
        placeholderTextColor={placeholderTextColor ?? placeholder}
        selectionColor={caret}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        nativeID={nativeID ?? field?.controlId}
        accessibilityLabelledBy={accessibilityLabelledBy ?? (field?.controlId ? `${field.controlId}-label` : undefined)}
        accessibilityState={{ disabled, ...(effectiveStatus === "error" ? { invalid: true } : null), ...accessibilityState }}
        {...rest}
      />
      {end}
    </View>
  );
});
