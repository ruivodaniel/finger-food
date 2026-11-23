import type { ReactNode } from "react";
import { Toggle, ToggleGroup, ToggleGroupItem } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one toggle: its config (emphasis, status, scale) and its data (pressed) live in the instance; a click writes to it */
const One = ({ id, emphasis, status, scale, children }: { id: string; emphasis?: string; status?: string; scale?: string; children: ReactNode }) => (
  <Instance id={id} initial={{ config: { emphasis, status, scale }, data: { pressed: true } }}>
    {(x) => <Toggle emphasis={x.config.emphasis} status={x.config.status} scale={x.config.scale} {...x.bind("pressed", "pressed", "onPressedChange")}>{children}</Toggle>}
  </Instance>
);

export default function ToggleFixture() {
  return (
    <FixtureBody>
      <Row label="emphasis">
        <One id="emphasis-hero" emphasis="hero">Hero</One>
        <One id="emphasis-primary" emphasis="primary">Primary</One>
        <One id="emphasis-secondary" emphasis="secondary">Secondary</One>
        <One id="emphasis-tertiary" emphasis="tertiary">Tertiary</One>
        <One id="emphasis-quiet" emphasis="quiet">Quiet</One>
      </Row>
      <Row label="status">
        <One id="status-neutral" status="neutral">Neutral</One>
        <One id="status-success" status="success">Success</One>
        <One id="status-warning" status="warning">Warning</One>
        <One id="status-error" status="error">Error</One>
      </Row>
      <Row label="scale">
        <One id="scale-xs" scale="xs">XS</One>
        <One id="scale-sm" scale="sm">SM</One>
        <One id="scale-md" scale="md">MD</One>
        <One id="scale-lg" scale="lg">LG</One>
        <One id="scale-xl" scale="xl">XL</One>
      </Row>
      <Row label="group">
        <Instance id="group" initial={{ data: { value: [] } }}>
          {(x) => (
            <ToggleGroup type="multiple" {...x.bind("value", "value", "onValueChange")}>
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
              <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
              <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
            </ToggleGroup>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
