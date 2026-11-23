// Contract: surface--label · surface--field-description · surface--field-message (ui/types/elements.ts)
// · mirrors @libs/web-components Label and the field wrappers of Form, 0.1.0
import { Platform, Text as RNText, View, type TextProps as RNTextProps } from "react-native";
import { createContext, useContext, useId, useMemo, type ReactElement, type ReactNode } from "react";
import type { ScaleOf, StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";

interface FieldContextValue {
  controlId: string;
  hasError: boolean;
  scale: ScaleOf<"input">;
}
const FieldContext = createContext<FieldContextValue | null>(null);

/** The surrounding Field's state, or null outside one: an input then renders standalone. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface LabelProps extends Omit<RNTextProps, "style"> {
  status?: StatusOf<"label">;
  scale?: ScaleOf<"label">;
  children?: ReactNode;
}
export function Label({ status, scale, children, ...rest }: LabelProps) {
  const el = useElement("label", { status, scale });
  return <RNText style={[el.view, el.text]} {...rest}>{children}</RNText>;
}

export interface FieldProps {
  label?: string;
  /** the hint under the field */
  description?: string;
  /** the error under the field; it puts the field and its input in the error status */
  error?: string;
  required?: boolean;
  scale?: ScaleOf<"input">;
  /** one input (Input, PhoneInput): it reads the field through useField() */
  children: ReactElement;
}

export function Field({ label, description, error, required = false, scale = "md", children }: FieldProps) {
  const controlId = `field-${useId()}`;
  const hasError = !!error;
  const value = useMemo<FieldContextValue>(() => ({ controlId, hasError, scale }), [controlId, hasError, scale]);
  const hint = useElement("fieldDescription");
  const message = useElement("fieldMessage", { status: hasError ? "error" : undefined });

  return (
    <FieldContext.Provider value={value}>
      <View style={{ alignSelf: "stretch", rowGap: 6 }}>
        {label ? <Label nativeID={`${controlId}-label`}>{required ? `${label} *` : label}</Label> : null}
        {children}
        {hasError ? (
          <RNText
            nativeID={`${controlId}-error`}
            style={[message.view, message.text]}
            // a live region announces the error on Android; iOS announces through the input's invalid state
            {...(Platform.OS === "android" ? { accessibilityLiveRegion: "polite" as const } : null)}
          >
            {error}
          </RNText>
        ) : description ? (
          <RNText nativeID={`${controlId}-description`} style={[hint.view, hint.text]}>{description}</RNText>
        ) : null}
      </View>
    </FieldContext.Provider>
  );
}
