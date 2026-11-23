import { useState } from "react";
import { Switch } from "@libs/mobile-components";
import { FixtureBody, Row } from "../../_chrome";

/** Switch fixture — off, on, disabled, and one that is live. */
export default function SwitchFixture() {
  const [on, setOn] = useState(true);
  return (
    <FixtureBody>
      <Row label="checked">
        <Switch checked={false} accessibilityLabel="Off" />
        <Switch checked accessibilityLabel="On" />
      </Row>
      <Row label="disabled">
        <Switch checked={false} disabled accessibilityLabel="Off, disabled" />
        <Switch checked disabled accessibilityLabel="On, disabled" />
      </Row>
      <Row label="live">
        <Switch checked={on} onCheckedChange={setOn} accessibilityLabel="Live" />
      </Row>
    </FixtureBody>
  );
}
