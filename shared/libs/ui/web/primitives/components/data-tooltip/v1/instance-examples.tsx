import { Button, Stack, Text } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { DataTooltip } from "./data-tooltip";

const Rows = ({ rows }: { rows: [string, string][] }) => (
  <Stack dir="col" gap={4}>
    {rows.map(([k, v]) => (
      <Stack key={k} dir="row" gap={16} justify="between"><Text type="body-small" emphasis="quiet">{k}</Text><Text type="numbers-small">{v}</Text></Stack>
    ))}
  </Stack>
);

export default function DataTooltipFixture() {
  return (
    <FixtureBody>
      <Row label="body only — hover the button">
        <DataTooltip content={<Text type="numbers">1,250,000,000.00 USD</Text>}><Button emphasis="secondary" scale="sm">Body only</Button></DataTooltip>
      </Row>
      <Row label="header and body — comparison rows as the body (a pattern, drawn here by hand)">
        <DataTooltip header={<Text type="body-small" emphasis="primary">Price · 30d</Text>} content={<Rows rows={[["Reference (Sep 20)", "99.76"], ["Difference", "+0.32"], ["Relative", "+0.32 %"]]} />}>
          <Button emphasis="secondary" scale="sm">Header and body</Button>
        </DataTooltip>
      </Row>
      <Row label="header, body and footer">
        <DataTooltip header={<Text type="body-small" emphasis="primary">Z-Spread</Text>} content={<Text type="numbers">1.67</Text>} footer={<Text type="body-extra-small" emphasis="quiet">Last 30 days</Text>}>
          <Button emphasis="secondary" scale="sm">With a footer</Button>
        </DataTooltip>
      </Row>
      <Row label="a click instead of a hover, and a status">
        <DataTooltip trigger="click" content={<Text type="body-small">Opened by a click</Text>}><Button emphasis="secondary" scale="sm">Click</Button></DataTooltip>
        <DataTooltip status="warning" delay={0} content={<Text type="body-small">A warning, no delay</Text>}><Button emphasis="secondary" scale="sm">Warning</Button></DataTooltip>
      </Row>
    </FixtureBody>
  );
}
