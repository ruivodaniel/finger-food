import { useState } from "react";
import { Field, Input, PhoneInput } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { FixtureBody, Row } from "../../_chrome";

/** Input fixture — the field and what stands around it: label, description, error, the phone variant. */
export default function InputFixture() {
  const [phone, setPhone] = useState("");
  return (
    <FixtureBody>
      <Row label="in a field">
        <Stack gap={16} size="fill">
          <Field label="Name" description="As on your account">
            <Input placeholder="Maya Chen" />
          </Field>
          <Field label="Email" error="Enter a valid email" required>
            <Input defaultValue="not-an-email" keyboardType="email-address" />
          </Field>
        </Stack>
      </Row>

      <Row label="scale">
        <Stack gap={10} size="fill">
          <Input scale="sm" placeholder="sm" />
          <Input scale="md" placeholder="md" />
          <Input scale="lg" placeholder="lg" />
        </Stack>
      </Row>

      <Row label="status and state">
        <Stack gap={10} size="fill">
          <Input status="success" defaultValue="success" />
          <Input status="warning" defaultValue="warning" />
          <Input status="error" defaultValue="error" />
          <Input state="focus" defaultValue="focus" />
          <Input disabled defaultValue="disabled" />
        </Stack>
      </Row>

      <Row label="phone">
        <Stack size="fill">
          <Field label="Phone">
            <PhoneInput value={phone} onChangeText={setPhone} defaultCountry="GB" onRequestCountryChange={() => {}} />
          </Field>
        </Stack>
      </Row>
    </FixtureBody>
  );
}
