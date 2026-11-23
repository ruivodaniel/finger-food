import { Input } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one input: its config (scale, status, disabled, placeholder) and its data (value) live in the instance; typing writes to it */
const One = ({ id, scale = "md", status, disabled = false, placeholder }: { id: string; scale?: string; status?: string; disabled?: boolean; placeholder: string }) => (
  <Instance id={id} initial={{ config: { scale, status, disabled, placeholder }, data: { value: "" } }}>
    {(x) => <Input scale={x.config.scale} status={x.config.status} disabled={x.config.disabled} placeholder={x.config.placeholder} {...x.bind("value")} />}
  </Instance>
);

export default function InputFixture() {
  return (
    <FixtureBody>
      <Row label="scale">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <One id="scale-sm" scale="sm" placeholder="Small input" />
          <One id="scale-md" scale="md" placeholder="Medium input" />
          <One id="scale-lg" scale="lg" placeholder="Large input" />
        </div>
      </Row>

      <Row label="status">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <One id="status-default" placeholder="Default" />
          <One id="status-error" status="error" placeholder="Error state" />
        </div>
      </Row>

      <Row label="state">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <One id="state-default" placeholder="Default" />
          <One id="state-disabled" placeholder="Disabled" disabled />
        </div>
      </Row>
    </FixtureBody>
  );
}
