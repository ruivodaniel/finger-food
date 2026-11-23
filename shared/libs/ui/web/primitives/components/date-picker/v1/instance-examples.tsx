import { DatePicker } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one single-date picker: its config (scale, status) and its data (the picked date) live in the instance; picking writes to it */
function SinglePicker({ id, scale, status, placeholder }: { id: string; scale?: string; status?: string; placeholder?: string }) {
  return (
    <Instance id={id} initial={{ config: { scale, status }, data: { value: null } }}>
      {(x) => <DatePicker mode="single" scale={x.config.scale} status={x.config.status} placeholder={placeholder} {...x.bind("value")} />}
    </Instance>
  );
}

/** one range picker: the same, its data is the picked range */
function RangePicker({ id, scale, status, placeholder }: { id: string; scale?: string; status?: string; placeholder?: string }) {
  return (
    <Instance id={id} initial={{ config: { scale, status }, data: { value: null } }}>
      {(x) => <DatePicker mode="range" scale={x.config.scale} status={x.config.status} placeholder={placeholder} {...x.bind("value")} />}
    </Instance>
  );
}

export default function DatePickerFixture() {
  return (
    <FixtureBody>
      <Row label="single">
        <SinglePicker id="single-sm" scale="sm" placeholder="Small" />
        <SinglePicker id="single-md" scale="md" placeholder="Medium" />
        <SinglePicker id="single-lg" scale="lg" placeholder="Large" />
      </Row>

      <Row label="range">
        <RangePicker id="range-md" scale="md" placeholder="Select range" />
      </Row>

      <Row label="status">
        <SinglePicker id="status-error" scale="md" status="error" placeholder="Error" />
        <SinglePicker id="status-warning" scale="md" status="warning" placeholder="Warning" />
        <SinglePicker id="status-success" scale="md" status="success" placeholder="Success" />
      </Row>
    </FixtureBody>
  );
}
