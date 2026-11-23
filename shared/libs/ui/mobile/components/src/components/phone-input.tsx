// Contract: field--phone-input (ui/types/elements.ts) · mirrors @libs/web-components PhoneInput, 0.1.0
import { Pressable, Text as RNText, type TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from "react-native";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { COUNTRIES, getCountryMeta, type Country, type CountryRow } from "@libs/value-types/country";
import type { ScaleOf, StatusOf } from "../../../../types/elements";
import { useElement } from "../theme";
import { Icon } from "./icons";
import { Input } from "./input";

const COUNTRY_ROWS: readonly CountryRow[] = COUNTRIES.map((code) => getCountryMeta(code));

export interface PhoneInputProps {
  /** E.164 string. Empty is valid (no input yet). */
  value: string;
  /** called with the canonical E.164 string ("" when the national part is empty) */
  onChangeText: (e164: string) => void;
  onBlur?: () => void;
  /** the country when `value` is empty or cannot be read. The app passes the device's region; "US" when absent. */
  defaultCountry?: Country;
  /** the country chip was pressed: the caller presents a picker and calls `setCountry` with the choice. Absent = the chip is a label. */
  onRequestCountryChange?: (current: Country, setCountry: (next: Country) => void) => void;
  status?: StatusOf<"phoneInput">;
  scale?: ScaleOf<"phoneInput">;
  disabled?: boolean;
  placeholder?: string;
  testID?: string;
  accessibilityLabel?: string;
  autoFocus?: RNTextInputProps["autoFocus"];
}

/** longest-prefix match: some dialing codes share a prefix ("1", "44", "972") */
function parseE164(value: string): { country: Country; national: string } | null {
  if (!value || value[0] !== "+") return null;
  const digits = value.slice(1);
  let best: { row: CountryRow; len: number } | null = null;
  for (const row of COUNTRY_ROWS) {
    if (digits.startsWith(row.dialingCode) && (!best || row.dialingCode.length > best.len)) best = { row, len: row.dialingCode.length };
  }
  return best ? { country: best.row.code as Country, national: digits.slice(best.len) } : null;
}

function toE164(country: Country, national: string): string {
  const digits = national.replace(/\D/g, "");
  return digits.length === 0 ? "" : `+${getCountryMeta(country).dialingCode}${digits}`;
}

export const PhoneInput = forwardRef<RNTextInput, PhoneInputProps>(function PhoneInput(
  { value, onChangeText, onBlur, defaultCountry, onRequestCountryChange, status, scale, disabled, placeholder, testID, accessibilityLabel, autoFocus },
  ref,
) {
  // the initial country is read once: a later `defaultCountry` does not move a field the user has touched
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => parseE164(value) ?? { country: defaultCountry ?? ("US" as Country), national: "" }, []);
  const [country, setCountry] = useState<Country>(initial.country);
  const [national, setNational] = useState<string>(initial.national);
  const chip = useElement("phoneInput", { status, scale });

  useEffect(() => {
    if (value === toE164(country, national)) return;
    if (value === "") { setNational(""); return; }
    const parsed = parseE164(value);
    if (parsed) { setCountry(parsed.country); setNational(parsed.national); }
  }, [value, country, national]);

  const meta = getCountryMeta(country);
  const onNational = useCallback((next: string) => {
    const digits = next.replace(/\D/g, "");
    setNational(digits);
    onChangeText(toE164(country, digits));
  }, [country, onChangeText]);
  const onCountry = useCallback((next: Country) => { setCountry(next); onChangeText(toE164(next, national)); }, [national, onChangeText]);

  return (
    <Input
      ref={ref}
      testID={testID}
      status={status}
      scale={scale}
      disabled={disabled}
      value={national}
      onChangeText={onNational}
      onBlur={onBlur}
      placeholder={placeholder}
      autoFocus={autoFocus}
      keyboardType="phone-pad"
      textContentType="telephoneNumber"
      accessibilityLabel={accessibilityLabel}
      start={
        <Pressable
          accessibilityRole={onRequestCountryChange ? "button" : "text"}
          accessibilityLabel={`${meta.name}, +${meta.dialingCode}`}
          disabled={!onRequestCountryChange || disabled}
          onPress={() => onRequestCountryChange?.(country, onCountry)}
          style={{ flexDirection: "row", alignItems: "center", columnGap: 6, marginRight: 8 }}
        >
          <RNText style={chip.text}>{meta.flag} +{meta.dialingCode}</RNText>
          {onRequestCountryChange ? <Icon name="chevronDown" size="xs" color={chip.color} /> : null}
        </Pressable>
      }
    />
  );
});
