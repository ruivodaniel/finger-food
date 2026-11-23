import { PhoneInput, type PhoneCountryOption } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

const COUNTRIES: PhoneCountryOption[] = [
  { code: "PT", dialingCode: "351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dialingCode: "1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dialingCode: "44", flag: "🇬🇧", name: "United Kingdom" },
];

/** one phone field: its config (disabled) and its data (value, E.164) live in the instance; typing writes to it */
const One = ({ id, value = "", disabled = false, defaultCountryCode }: { id: string; value?: string; disabled?: boolean; defaultCountryCode?: string }) => (
  <Instance id={id} initial={{ config: { disabled }, data: { value } }}>
    {(x) => <PhoneInput countryOptions={COUNTRIES} defaultCountryCode={defaultCountryCode} disabled={x.config.disabled} {...x.bind("value", "value", "onChange")} />}
  </Instance>
);

export default function PhoneInputFixture() {
  return (
    <FixtureBody>
      <Row label="default">
        <One id="default" defaultCountryCode="PT" />
      </Row>

      <Row label="with value">
        <One id="with-value" value="+15550100" />
      </Row>

      <Row label="disabled">
        <One id="disabled" disabled />
      </Row>
    </FixtureBody>
  );
}
