import { Chart, ChartLegend, Stack } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const S = [{ key: "a", name: "Revenue", data: [120, 132, 101, 134, 90, 230] }, { key: "b", name: "Cost", data: [80, 92, 71, 94, 60, 120] }, { key: "c", name: "Margin", status: "success" as const, data: [40, 40, 30, 40, 30, 110] }];

export default function ChartLegendFixture() {
  return (
    <FixtureBody>
      <Row label="row (default) above the chart — click toggles a series, hover highlights it">
        <Stack dir="col" gap={8} style={{ width: 560 }}><ChartLegend for="lg1" /><Chart id="lg1" kind="line" categories={months} series={S} height={180} /></Stack>
      </Row>
      <Row label="column beside the chart, with the last value">
        <Stack dir="row" gap={16} align="start" style={{ width: 560 }}><Chart id="lg2" kind="column" categories={months} series={S} height={180} style={{ flex: 1 }} /><ChartLegend for="lg2" layout="column" values="last" /></Stack>
      </Row>
      <Row label="not interactive, small">
        <Stack dir="col" gap={8} style={{ width: 560 }}><Chart id="lg3" kind="area" categories={months} series={S} height={160} /><ChartLegend for="lg3" interactive={false} scale="sm" /></Stack>
      </Row>
    </FixtureBody>
  );
}
