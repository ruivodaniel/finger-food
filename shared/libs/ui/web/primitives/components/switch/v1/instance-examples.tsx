import { Switch } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one switch: its config (scale, disabled) and its data (checked) live in the instance; a click writes to it */
const One = ({ id, scale = "md", checked = false, disabled = false }: { id: string; scale?: string; checked?: boolean; disabled?: boolean }) => (
  <Instance id={id} initial={{ config: { scale, disabled }, data: { checked } }}>
    {(x) => <Switch scale={x.config.scale} disabled={x.config.disabled} {...x.bind("checked", "checked", "onCheckedChange")} />}
  </Instance>
);

export default function SwitchFixture() {
  return (
    <FixtureBody>
      <Row label='state — scale="md"'>
        <One id="state-off" />
        <One id="state-on" checked />
        <One id="state-off-disabled" disabled />
      </Row>

      <Row label="scale — all checked">
        <One id="scale-sm" scale="sm" checked />
        <One id="scale-md" scale="md" checked />
        <One id="scale-lg" scale="lg" checked />
      </Row>
    </FixtureBody>
  );
}
