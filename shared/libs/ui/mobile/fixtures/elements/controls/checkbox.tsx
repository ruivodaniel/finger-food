import { useState } from "react";
import { Checkbox } from "@libs/mobile-components";
import { FixtureBody, Row } from "../../_chrome";

/** Checkbox fixture — the box alone, with its label, in its states. */
export default function CheckboxFixture() {
  const [on, setOn] = useState(false);
  return (
    <FixtureBody>
      <Row label="checked">
        <Checkbox checked={false} accessibilityLabel="Off" />
        <Checkbox checked accessibilityLabel="On" />
      </Row>
      <Row label="disabled">
        <Checkbox checked={false} disabled accessibilityLabel="Off, disabled" />
        <Checkbox checked disabled accessibilityLabel="On, disabled" />
      </Row>
      <Row label="status">
        <Checkbox checked={false} status="error" accessibilityLabel="Error" />
      </Row>
      <Row label="with a label, live">
        <Checkbox checked={on} onCheckedChange={setOn} label="I accept the terms of service and the privacy policy" />
      </Row>
    </FixtureBody>
  );
}
