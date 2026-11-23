import type { NumberConfig } from "@libs/data-processor";
import { Text } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { DataNumber } from "./data-number";

const en = (mode: NumberConfig["mode"], extra: Partial<NumberConfig> = {}): NumberConfig => ({ mode, locale: "en-GB", ...extra });
const C = en({ kind: "compactMax", n: 3 });

export default function DataNumberFixture() {
  return (
    <FixtureBody>
      <Row label="value and unit — the unit comes from the processor, always on the right">
        <DataNumber value={34765432} config={en({ kind: "full" })} />
        <DataNumber value={34765432} config={C} />
        <DataNumber value={3476543210} config={en({ kind: "fixedScale", scale: "million", n: 2 })} />
        <DataNumber value="0.000002" config={en({ kind: "scientific", n: 3 })} />
      </Row>
      <Row label="percentage — a fraction, and points">
        <DataNumber value={0.1534} config={en({ kind: "fixedScale", scale: "unit", n: 1 }, { representation: { kind: "percentage", input: "fraction" } })} />
        <DataNumber value={42} config={en({ kind: "fixedScale", scale: "unit", n: 0 }, { representation: { kind: "percentage", input: "points" } })} />
      </Row>
      <Row label="negative — a minus (default) and accounting parentheses">
        <DataNumber value={-1234.5} config={en({ kind: "full" })} symbol="USD" />
        <DataNumber value={-1234.5} config={en({ kind: "full" }, { negative: "parentheses" })} symbol="USD" />
        <DataNumber value={-34000} config={en({ kind: "compactMax", n: 2 }, { negative: "parentheses" })} symbol="USD" />
      </Row>
      <Row label="symbol — right (default) and left">
        <DataNumber value={1250000} config={C} symbol="USD" />
        <DataNumber value={1250000} config={C} symbol="EUR" symbolPosition="left" />
      </Row>
      <Row label="trend — always on the left, any library icon; status on the root, the theme chooses what it colours">
        <DataNumber value={1250000} config={C} symbol="USD" trend="arrowUp" status="success" />
        <DataNumber value={-34000} config={C} symbol="USD" trend="arrowDown" status="error" />
        <DataNumber value={1250000} config={C} symbol="EUR" symbolPosition="left" trend="arrowUp" status="success" />
      </Row>
      <Row label="concept — the same instance, a product concept the theme may key on">
        <DataNumber value={-34000} config={C} trend="arrowDown" status="error" concept="alert" />
        <DataNumber value={-34000} config={C} trend="arrowDown" status="error" concept="default" />
      </Row>
      <Row label="tooltip — true (the full value in a data-tooltip), a delay of 0, a click, content given, false">
        <DataNumber value={34765432} config={C} symbol="USD" tooltip />
        <DataNumber value={34765432} config={C} symbol="USD" tooltip tooltipDelay={0} />
        <DataNumber value={34765432} config={C} symbol="USD" tooltip tooltipTrigger="click" />
        <DataNumber value={34765432} config={C} symbol="USD" tooltip={<Text type="body-small">Any content, drawn inside the data-tooltip</Text>} />
        <DataNumber value={34765432} config={C} symbol="USD" tooltip={false} />
      </Row>
      <Row label="status — the semantic state">
        {(["neutral", "info", "success", "warning", "error", "destructive"] as const).map((s) => <DataNumber key={s} value={1234.5} config={en({ kind: "full" })} status={s} />)}
      </Row>
      <Row label="emphasis — the axis, on the root">
        {(["hero", "primary", "secondary", "tertiary", "quiet"] as const).map((e) => <DataNumber key={e} value={1234.5} config={en({ kind: "full" })} emphasis={e} />)}
      </Row>
      <Row label="status × emphasis — the status is the colour, the emphasis the form; one row per emphasis, one column per status">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: "12px 20px", alignItems: "center" }}>
          {(["hero", "primary", "secondary", "tertiary", "quiet"] as const).flatMap((e) =>
            (["neutral", "info", "success", "warning", "error"] as const).map((s) => <DataNumber key={e + s} value={s === "error" ? 34000 : -34000} config={C} trend={s === "error" ? "arrowUp" : "arrowDown"} symbol="USD" emphasis={e} status={s} />),
          )}
        </div>
      </Row>
      <Row label="scale — xs sm md lg xl">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => <DataNumber key={s} value={34765432} config={C} symbol="USD" scale={s} />)}
      </Row>
      <Row label="empty and invalid — the placeholder, and a custom one">
        <DataNumber value={null} />
        <DataNumber value="abc" config={en({ kind: "full" })} />
        <DataNumber value={undefined} placeholder="n/a" />
      </Row>
    </FixtureBody>
  );
}
