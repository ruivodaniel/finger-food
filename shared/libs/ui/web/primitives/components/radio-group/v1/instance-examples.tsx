import type { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one radio group: its config (scale) and its data (the checked value) live in the instance; a pick writes to it */
const Group = ({ id, value, scale = "md", className, children }: { id: string; value: string; scale?: string; className?: string; children: ReactNode }) => (
  <Instance id={id} initial={{ config: { scale }, data: { value } }}>
    {(x) => <RadioGroup scale={x.config.scale} className={className} {...x.bind("value", "value", "onValueChange")}>{children}</RadioGroup>}
  </Instance>
);

export default function RadioFixture() {
  return (
    <FixtureBody>
      <Row label='state — scale="md"'>
        <Group id="state" value="b" className="flex flex-row gap-4">
          <RadioGroupItem value="a" />
          <RadioGroupItem value="b" />
          <RadioGroupItem value="c" disabled />
        </Group>
      </Row>

      <Row label="scale — all checked">
        <Group id="scale-sm" value="sm" scale="sm" className="flex flex-row gap-4">
          <RadioGroupItem value="sm" />
        </Group>
        <Group id="scale-md" value="md" scale="md" className="flex flex-row gap-4">
          <RadioGroupItem value="md" />
        </Group>
        <Group id="scale-lg" value="lg" scale="lg" className="flex flex-row gap-4">
          <RadioGroupItem value="lg" />
        </Group>
      </Row>
    </FixtureBody>
  );
}
