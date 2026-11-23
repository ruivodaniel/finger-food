import { useState } from "react";
import { InputOTP } from "@libs/mobile-components";
import { FixtureBody, Row } from "../../_chrome";

/** InputOTP fixture — empty, half typed, full, in error, disabled. */
export default function InputOTPFixture() {
  const [code, setCode] = useState("");
  return (
    <FixtureBody>
      <Row label="live"><InputOTP value={code} onChangeText={setCode} /></Row>
      <Row label="half typed"><InputOTP value="482" onChangeText={() => {}} /></Row>
      <Row label="full"><InputOTP value="482915" onChangeText={() => {}} /></Row>
      <Row label="status error"><InputOTP value="482915" onChangeText={() => {}} status="error" /></Row>
      <Row label="disabled"><InputOTP value="48" onChangeText={() => {}} disabled /></Row>
      <Row label="length 4"><InputOTP length={4} value="" onChangeText={() => {}} /></Row>
    </FixtureBody>
  );
}
