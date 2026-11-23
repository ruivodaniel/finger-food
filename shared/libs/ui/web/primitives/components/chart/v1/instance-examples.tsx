import { Chart, ChartLegend, ChartToolbar, Stack, Text } from "@libs/web-components";
import type { NumberConfig } from "@libs/data-processor";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import population from "./population.json";
import portfolio from "./portfolio.json";

const en = (mode: NumberConfig["mode"], extra: Partial<NumberConfig> = {}): NumberConfig => ({ mode, locale: "en-GB", ...extra });
const C = en({ kind: "compactMax", n: 3 });
const PCT = en({ kind: "fixedScale", scale: "unit", n: 1 }, { representation: { kind: "percentage", input: "points" } });
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const walk = (n: number, start: number, step: number, seed: number) => { const r = rnd(seed); let v = start; return Array.from({ length: n }, () => (v += (r() - 0.45) * step)); };
const weeks = Array.from({ length: 520 }, (_, i) => `W${(i % 52) + 1} ${2008 + Math.floor(i / 52)}`);

export default function ChartFixture() {
  return (
    <FixtureBody>
      <Row label="line — two series, our tooltip at the axis pointer; a legend bound by id, placed by the fixture">
        <Stack dir="col" gap={8} style={{ width: 640 }}>
          <ChartLegend for="rev" values="last" />
          <Chart id="rev" kind="line" categories={months} series={[{ key: "rev", name: "Revenue", data: walk(12, 120e6, 18e6, 3) }, { key: "cost", name: "Cost", data: walk(12, 80e6, 12e6, 7) }]} format={C} symbol="USD" height={220} />
        </Stack>
      </Row>
      <Row label="anchors — click anywhere on the plot to pin that x (up to 3); every hovered value then shows its delta to each anchor; click an anchor to unpin, Esc or the chip clears">
        <Chart kind="line" anchors={3} categories={months} series={[{ key: "rev", name: "Revenue", data: walk(12, 120e6, 18e6, 3) }, { key: "cost", name: "Cost", data: walk(12, 80e6, 12e6, 7) }]} format={C} symbol="USD" height={240} style={{ width: 640 }} />
      </Row>
      <Row label="area, stacked — percent">
        <Chart kind="area" stack="percent" categories={months} series={[{ key: "a", name: "Performing", data: walk(12, 60, 4, 1) }, { key: "b", name: "Past due", data: walk(12, 20, 3, 2) }, { key: "c", name: "Unlikely to pay", data: walk(12, 12, 2, 4) }, { key: "d", name: "Bad loans", data: walk(12, 8, 2, 5) }]} format={PCT} height={200} style={{ width: 640 }} />
      </Row>
      <Row label="column and bar — a series with a status takes its colour; a mixed chart (bars with a line on a second axis)">
        <Chart kind="column" categories={["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]} series={[{ key: "exp", name: "Exposure", data: [420, 980, 1540, 1210, 640, 310, 90] }, { key: "npl", name: "NPL ratio", kind: "line", yAxis: 1, status: "error", data: [0.2, 0.4, 0.9, 1.8, 3.4, 6.1, 12.2] }]} format={en({ kind: "fixedScale", scale: "unit", n: 0 })} format2={PCT} height={220} style={{ width: 480 }} />
        <Chart kind="bar" categories={["Retail", "SME", "Corporate", "Public"]} series={[{ key: "x", name: "Exposure", data: [1250, 980, 2310, 410] }]} format={C} symbol="M EUR" axes="x" height={160} style={{ width: 320 }} />
      </Row>
      <Row label="population scatter — one dot per loan, grouped by status on x, the exposure on y (Alix's exposure vs performance); every dot clickable">
        <Chart kind="scatter" xLabels={["Performing", "Past due", "Unlikely to pay", "Bad loans"]} series={(population as { key: string; name: string; data: number[][] }[]).map((s, i) => ({ ...s, status: (["success", "warning", "warning", "error"] as const)[i] }))} format={C} symbol="EUR" height={320} style={{ width: 760 }} onClick={(pt) => console.log("loan", pt)} />
      </Row>
      <Row label="bubble — a third value is the size">
        <Chart kind="bubble" series={[{ key: "b", name: "Issuers", data: [[10, 20, 40], [25, 35, 120], [40, 15, 60], [55, 50, 200], [70, 30, 90]] }]} height={220} style={{ width: 400 }} />
      </Row>
      <Row label="pie and donut — item tooltip">
        <Chart kind="pie" series={[{ key: "s", name: "Sector", data: [{ name: "Banks", value: 42 }, { name: "Utilities", value: 23 }, { name: "Telecom", value: 18 }, { name: "Retail", value: 17 }] }]} height={260} style={{ width: 420 }} />
        <Chart kind="donut" series={[{ key: "s", name: "Rating", data: [{ name: "Investment grade", value: 68 }, { name: "High yield", value: 27 }, { name: "Unrated", value: 5 }] }]} height={260} style={{ width: 420 }} />
      </Row>
      <Row label="treemap — Alix's portfolio by sector, click a sector to drill into its industries · radar">
        <Chart kind="treemap" series={[{ key: "t", name: "Portfolio", data: portfolio as { name: string; value: number; children?: unknown[] }[] }]} format={C} symbol="EUR" height={360} style={{ width: 760 }} onClick={(pt) => console.log("sector", pt)} />
        <Chart kind="radar" categories={["Liquidity", "Leverage", "Coverage", "Growth", "Margin"]} series={[{ key: "a", name: "Issuer", data: [[72, 58, 81, 44, 66]] }, { key: "b", name: "Peers", data: [[60, 65, 70, 55, 60]] }]} height={240} style={{ width: 360 }} />
      </Row>
      <Row label="candlestick and boxplot">
        <Chart kind="candlestick" categories={months} series={[{ key: "p", name: "Price", data: months.map((_, i) => { const o = 98 + i * 0.3, c = o + (i % 3 === 0 ? -1.2 : 0.9); return [o, c, Math.min(o, c) - 0.8, Math.max(o, c) + 0.7]; }) }]} format={en({ kind: "fixedScale", scale: "unit", n: 2 })} height={220} style={{ width: 480 }} />
        <Chart kind="boxplot" categories={["Performing", "Past due", "UTP", "Bad"]} series={[{ key: "b", name: "Exposure", data: [[12, 18, 24, 31, 40], [8, 14, 19, 26, 35], [5, 9, 14, 20, 28], [1, 4, 7, 11, 16]] }]} format={C} height={220} style={{ width: 320 }} />
      </Row>
      <Row label="zoom — slider, the window at the last 5 %; a toolbar bound by id sets presets">
        <Stack dir="col" gap={8} style={{ width: 720 }}>
          <ChartToolbar for="long" presets={[{ label: "1Y", window: [90, 100] }, { label: "3Y", window: [70, 100] }, { label: "All", window: [0, 100] }]} defaultPreset="1Y" export />
          <Chart id="long" kind="line" categories={weeks} series={[{ key: "e", name: "Exposure", data: walk(520, 30e9, 0.6e9, 21) }]} format={C} symbol="EUR" zoom="slider" window={[95, 100]} height={220} />
        </Stack>
      </Row>
      <Row label="linked — three charts share zoom and axis pointer (ECharts connect); the slider on the last one drives the three">
        <Stack dir="col" gap={0} style={{ width: 720 }}>
          <Text type="body-small" emphasis="quiet">Exposure</Text>
          <Chart id="l1" linked="dash" kind="line" categories={weeks} series={[{ key: "e", name: "Exposure", data: walk(520, 30e9, 0.6e9, 21) }]} format={C} symbol="EUR" zoom="inside" window={[95, 100]} height={140} axes="y" />
          <Text type="body-small" emphasis="quiet">Net margin</Text>
          <Chart id="l2" linked="dash" kind="line" categories={weeks} series={[{ key: "m", name: "Net margin", status: "success", data: walk(520, 3.2, 0.08, 22) }]} format={PCT} zoom="inside" window={[95, 100]} height={140} axes="y" />
          <Text type="body-small" emphasis="quiet">Non-performing</Text>
          <Chart id="l3" linked="dash" kind="column" categories={weeks} series={[{ key: "n", name: "Non-performing", status: "error", data: walk(520, 400e6, 20e6, 23) }]} format={C} symbol="EUR" zoom="slider" window={[95, 100]} height={240} />
        </Stack>
      </Row>
      <Row label="events — a timeline of lanes under a chart, linked to it: a marker per event at its week, several at one week merge into a bigger one; hover a marker for its events, click hands them up">
        <Stack dir="col" gap={0} style={{ width: 720 }}>
          <Chart id="ev-price" linked="ev" kind="area" categories={weeks} series={[{ key: "p", name: "Ask price", data: walk(520, 100, 1.2, 31) }]} format={en({ kind: "fixedScale", scale: "unit", n: 2 })} zoom="inside" window={[90, 100]} height={180} />
          <Chart id="ev-lanes" linked="ev" kind="events" categories={weeks}
            series={[
              { key: "issues", name: "New issues", status: "error", data: [470, 482, 500, 515].map((at) => ({ at, payload: { title: "New issue" } })) },
              { key: "news", name: "Issuer news", status: "warning", data: [468, 475, 475, 475, 490, 505, 505, 512].map((at) => ({ at, payload: { title: "Issuer news" } })) },
              { key: "reports", name: "Issuer reports", status: "info", data: [469, 481, 494, 507, 519].map((at) => ({ at, payload: { title: "Report" } })) },
              { key: "industry", name: "Industry breaking news", data: Array.from({ length: 34 }, (_, i) => 466 + Math.floor(i * 1.6)).map((at) => ({ at, payload: { title: "Industry" } })) },
            ]}
            zoom="slider" window={[90, 100]} onClick={(pt) => console.log("events", pt.events)} />
        </Stack>
      </Row>
      <Row label="renderer svg (same look, a DOM svg instead of a canvas) · the engine's own tooltip as an option">
        <Chart kind="line" renderer="svg" categories={months} series={[{ key: "a", name: "SVG", data: walk(12, 50, 8, 9) }]} format={C} height={160} style={{ width: 360 }} />
        <Chart kind="line" tooltip="engine" categories={months} series={[{ key: "a", name: "Engine tip", data: walk(12, 50, 8, 9) }]} format={C} height={160} style={{ width: 360 }} />
      </Row>
    </FixtureBody>
  );
}
