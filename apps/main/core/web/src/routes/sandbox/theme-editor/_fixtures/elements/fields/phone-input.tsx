import { PhoneInput } from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function PhoneInputFixture() {
  return (
    <FixtureBody>
      <Row label="default">
        <PhoneInput />
      </Row>

      <Row label="with value">
        <PhoneInput defaultValue="+1 555 0100" />
      </Row>

      <Row label="disabled">
        <PhoneInput disabled />
      </Row>
    </FixtureBody>
  );
}
