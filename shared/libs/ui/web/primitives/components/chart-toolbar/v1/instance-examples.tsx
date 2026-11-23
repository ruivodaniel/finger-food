import { Button, Chart, ChartToolbar, Stack } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const weeks = Array.from({ length: 260 }, (_, i) => `W${(i % 52) + 1} ${2021 + Math.floor(i / 52)}`);
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const walk = (n: number, start: number, step: number, seed: number) => { const r = rnd(seed); let v = start; return Array.from({ length: n }, () => (v += (r() - 0.45) * step)); };

export default function ChartToolbarFixture() {
  return (
    <FixtureBody>
      <Row label="presets set the zoom window of the chart it is bound to; reset; export">
        <Stack dir="col" gap={8} style={{ width: 640 }}>
          <ChartToolbar for="tb1" presets={[{ label: "3M", window: [95, 100] }, { label: "1Y", window: [80, 100] }, { label: "All", window: [0, 100] }]} defaultPreset="1Y" export />
          <Chart id="tb1" kind="line" categories={weeks} series={[{ key: "a", name: "Exposure", data: walk(260, 100, 4, 2) }]} zoom="inside" window={[80, 100]} height={200} />
        </Stack>
      </Row>
      <Row label="the product's own controls in children; one toolbar for two linked charts">
        <Stack dir="col" gap={8} style={{ width: 640 }}>
          <ChartToolbar for={["tb2", "tb3"]} presets={[{ label: "1Y", window: [80, 100] }, { label: "All", window: [0, 100] }]} reset={false} scale="sm"><Button emphasis="quiet" scale="sm">Compare</Button></ChartToolbar>
          <Chart id="tb2" linked="tb" kind="line" categories={weeks} series={[{ key: "a", name: "A", data: walk(260, 100, 4, 2) }]} zoom="inside" height={140} axes="y" />
          <Chart id="tb3" linked="tb" kind="column" categories={weeks} series={[{ key: "b", name: "B", status: "warning", data: walk(260, 50, 3, 4) }]} zoom="inside" height={140} />
        </Stack>
      </Row>
    </FixtureBody>
  );
}
