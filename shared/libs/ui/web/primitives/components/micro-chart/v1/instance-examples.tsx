import { DataNumber, MicroChart, Stack, Text } from "@libs/web-components";
import type { NumberConfig } from "@libs/data-processor";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const en = (mode: NumberConfig["mode"]): NumberConfig => ({ mode, locale: "en-GB" });
const C = en({ kind: "compactMax", n: 3 });
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const walk = (n: number, start: number, step: number, seed: number) => { const r = rnd(seed); let v = start; return Array.from({ length: n }, () => (v += (r() - 0.45) * step)); };
const up = walk(30, 100, 6, 3), down = walk(30, 100, 6, 5).map((v, i) => v - i * 2);

export default function MicroChartFixture() {
  return (
    <FixtureBody>
      <Row label="kinds — sparkline, bars, bullet, win-loss; hover: a data-tooltip with the last value">
        <MicroChart kind="sparkline" data={up} format={C} />
        <MicroChart kind="bars" data={walk(12, 40, 20, 8)} format={C} />
        <MicroChart kind="bullet" value={78} target={90} bands={[50, 75]} range={[0, 100]} format={en({ kind: "fixedScale", scale: "unit", n: 0 })} />
        <MicroChart kind="win-loss" data={[1, 1, -1, 1, -1, -1, 1, 1, 1, -1, 1, 1]} tooltip={false} />
      </Row>
      <Row label="anchors — click a point to pin it (up to 3); the hover then shows the delta to each; Esc clears">
        <MicroChart kind="sparkline" data={up} anchors={3} format={C} width={160} scale="lg" />
        <MicroChart kind="bars" data={walk(12, 40, 20, 8)} anchors={2} format={C} width={160} scale="lg" />
      </Row>
      <Row label="status — colours the series; a baseline">
        <MicroChart kind="sparkline" data={up} status="success" baseline={100} format={C} />
        <MicroChart kind="sparkline" data={down} status="error" baseline={100} format={C} />
        <MicroChart kind="sparkline" data={up} status="neutral" format={C} />
      </Row>
      <Row label="emphasis — quiet, default, hero (the area fills)">
        <MicroChart kind="sparkline" data={up} emphasis="quiet" format={C} />
        <MicroChart kind="sparkline" data={up} format={C} />
        <MicroChart kind="sparkline" data={up} emphasis="hero" format={C} />
      </Row>
      <Row label="scale — xs sm md lg, the height follows the text">
        {(["xs", "sm", "md", "lg"] as const).map((s) => <MicroChart key={s} kind="sparkline" data={up} scale={s} format={C} />)}
      </Row>
      <Row label="markers — last, min-max, none">
        <MicroChart kind="sparkline" data={up} marker="last" format={C} />
        <MicroChart kind="sparkline" data={up} marker="min-max" format={C} />
        <MicroChart kind="sparkline" data={up} marker="none" format={C} />
      </Row>
      <Row label="beside a number, a shared range down the column — the thing it is for">
        <Stack dir="col" gap={6}>
          {[["Price", 100.08, up], ["YTW", 0.24, down], ["Z-Spread", 1.67, up]].map(([l, v, d]) => (
            <Stack key={l as string} dir="row" gap={12} align="center">
              <Text type="body-small" emphasis="quiet" style={{ width: 80 }}>{l as string}</Text>
              <MicroChart kind="sparkline" data={d as number[]} range={[40, 160]} scale="sm" status={(d as number[])[29] > 100 ? "success" : "error"} format={C} />
              <DataNumber value={v as number} config={en({ kind: "full" })} scale="sm" />
            </Stack>
          ))}
        </Stack>
      </Row>
    </FixtureBody>
  );
}
