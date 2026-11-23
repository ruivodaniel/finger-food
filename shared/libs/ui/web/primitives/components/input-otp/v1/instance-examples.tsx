import type { ReactNode } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one OTP field: its config (scale) and its data (value, the typed code) live in the instance; typing writes to it */
const Otp = ({ id, scale, maxLength, children }: { id: string; scale?: string; maxLength: number; children: ReactNode }) => (
  <Instance id={id} initial={{ config: { scale }, data: { value: "" } }}>
    {(x) => <InputOTP maxLength={maxLength} scale={x.config.scale} {...x.bind("value", "value", "onChange")}>{children}</InputOTP>}
  </Instance>
);

export default function InputOTPFixture() {
  return (
    <FixtureBody>
      <Row label="4 digit">
        <Otp id="digits-4" maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </Otp>
      </Row>

      <Row label="6 digit with separator">
        <Otp id="digits-6" maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </Otp>
      </Row>

      <Row label="scale">
        <Otp id="scale-sm" scale="sm" maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </Otp>
        <Otp id="scale-md" scale="md" maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </Otp>
        <Otp id="scale-lg" scale="lg" maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </Otp>
      </Row>
    </FixtureBody>
  );
}
