import { Icon } from "@libs/web-components";
import { DataNumber } from "./data-number";
import type { NumberConfig } from "@libs/data-processor";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const en = (mode: NumberConfig["mode"], extra: Partial<NumberConfig> = {}): NumberConfig => ({ mode, locale: "en-GB", ...extra });

export default function DataNumberFixture() {
  return (
    <FixtureBody>
      <Row label="modes — 34,765,432 (hover a number: the full value; the unit is its own part)">
        <DataNumber value={34765432} config={en({ kind: "full" })} tooltip />
        <DataNumber value={34765432} config={en({ kind: "compactMax", n: 3 })} tooltip />
        <DataNumber value={1000000} config={en({ kind: "compactFixed", n: 3 })} tooltip />
        <DataNumber value={3476543210} config={en({ kind: "fixedScale", scale: "million", n: 2 })} tooltip />
        <DataNumber value="0.000002" config={en({ kind: "scientific", n: 3 })} tooltip />
      </Row>
      <Row label="percentage — a fraction, and points">
        <DataNumber value={0.1534} config={en({ kind: "fixedScale", scale: "unit", n: 1 }, { representation: { kind: "percentage", input: "fraction" } })} />
        <DataNumber value={42} config={en({ kind: "fixedScale", scale: "unit", n: 0 }, { representation: { kind: "percentage", input: "points" } })} />
      </Row>
      <Row label="slots — leading (a currency), trailing (a trend)">
        <DataNumber value={1250000} config={en({ kind: "compactMax", n: 3 })} leading={<span>€</span>} trailing={<Icon name="arrowUp" scale="xs" />} status="success" tooltip />
        <DataNumber value={-34000} config={en({ kind: "compactMax", n: 2 })} leading={<span>$</span>} trailing={<Icon name="arrowDown" scale="xs" />} status="error" />
      </Row>
      <Row label="unit placement — after, before, hidden">
        <DataNumber value={3400000} config={en({ kind: "compactMax", n: 2 })} unitPlacement="after" />
        <DataNumber value={3400000} config={en({ kind: "compactMax", n: 2 })} unitPlacement="before" />
        <DataNumber value={3400000} config={en({ kind: "compactMax", n: 2 })} unitPlacement="hidden" />
      </Row>
      <Row label="tooltip — the default delay is 350 ms; 0 ms; a click instead of a hover; a tooltip that shows another mode">
        <DataNumber value={34765432} config={en({ kind: "compactMax", n: 3 })} tooltip />
        <DataNumber value={34765432} config={en({ kind: "compactMax", n: 3 })} tooltip tooltipDelay={0} />
        <DataNumber value={34765432} config={en({ kind: "compactMax", n: 3 })} tooltip tooltipTrigger="click" />
        <DataNumber value={34765432} config={en({ kind: "compactMax", n: 3 })} tooltip tooltipConfig={en({ kind: "scientific", n: 4 })} />
      </Row>
      <Row label="status — the semantic state; the theme gives each its colour">
        {(["neutral", "info", "success", "warning", "error", "destructive"] as const).map((s) => <DataNumber key={s} value={1234.5} config={en({ kind: "full" })} status={s} />)}
      </Row>
      <Row label="scale — xs sm md lg xl">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => <DataNumber key={s} value={34765432} config={en({ kind: "compactMax", n: 3 })} scale={s} />)}
      </Row>
      <Row label="empty and invalid — the placeholder, and a custom one">
        <DataNumber value={null} />
        <DataNumber value="abc" config={en({ kind: "full" })} />
        <DataNumber value={undefined} placeholder="n/a" />
      </Row>
      <Row label="align end — the way a column of numbers sits">
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 4, border: "1px dashed rgba(128,128,128,.4)", padding: 6 }}>
          {[12, 1234.5, 9876543.21].map((v) => <DataNumber key={v} value={v} config={en({ kind: "full" })} align="end" />)}
        </div>
      </Row>
    </FixtureBody>
  );
}
