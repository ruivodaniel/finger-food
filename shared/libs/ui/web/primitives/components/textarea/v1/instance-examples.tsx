import { Textarea } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one textarea: its config (scale, status, disabled) and its data (value) live in the instance; typing writes to it */
const One = ({ id, status, disabled = false, placeholder }: { id: string; status?: string; disabled?: boolean; placeholder: string }) => (
  <Instance id={id} initial={{ config: { status, disabled }, data: { value: "" } }}>
    {(x) => <Textarea scale="md" status={x.config.status} disabled={x.config.disabled} placeholder={placeholder} rows={3} {...x.bind("value")} />}
  </Instance>
);

export default function TextareaFixture() {
  return (
    <FixtureBody>
      <Row label="status + state">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <One id="state-default" placeholder="Default" />
          <One id="status-error" status="error" placeholder="Error state" />
          <One id="state-disabled" placeholder="Disabled" disabled />
        </div>
      </Row>
    </FixtureBody>
  );
}
