import { Badge } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

/**
 * Badge fixture — every axis the elements table gives a badge (emphasis, status, state, scale), the icon on either
 * side, and the status dot (a 3xs badge with concept="dot") beside a text, as the patterns compose it.
 * v2: the component is v1's; only this fixture changed, so the theme can be reviewed on the whole matrix.
 */
const STATUSES = ["neutral", "info", "success", "warning", "error", "destructive"] as const;
const EMPHASES = ["hero", "primary", "secondary", "tertiary", "quiet"] as const;
const STATES = ["hover", "active", "focus", "selected", "disabled"] as const;
const SCALES = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

export default function BadgeFixture() {
  return (
    <FixtureBody>
      <Row label="emphasis">
        {EMPHASES.map((e) => <Badge key={e} emphasis={e}>{e}</Badge>)}
      </Row>
      <Row label="status">
        {STATUSES.map((s) => <Badge key={s} status={s}>{s}</Badge>)}
      </Row>
      {EMPHASES.map((e) => (
        <Row key={e} label={`emphasis="${e}" × status`}>
          {STATUSES.map((s) => <Badge key={s} emphasis={e} status={s}>{s}</Badge>)}
        </Row>
      ))}
      <Row label="state">
        <Badge>none</Badge>
        {STATES.map((st) => <Badge key={st} state={st}>{st}</Badge>)}
      </Row>
      <Row label='state × status="success"'>
        <Badge status="success">none</Badge>
        {STATES.map((st) => <Badge key={st} status="success" state={st}>{st}</Badge>)}
      </Row>
      <Row label="scale">
        {SCALES.map((sc) => <Badge key={sc} scale={sc} status="neutral">{sc}</Badge>)}
      </Row>
      <Row label="icon — left (default) and right">
        <Badge showIcon status="success">check</Badge>
        <Badge showIcon iconName="warning" status="warning">warning</Badge>
        <Badge showIcon iconName="loading" status="info">loading</Badge>
        <Badge showIcon iconName="tag" iconPosition="right">tag right</Badge>
        <Badge showIcon iconName="close" iconPosition="right" emphasis="secondary">close right</Badge>
      </Row>
      <Row label="icon × scale">
        {SCALES.map((sc) => <Badge key={sc} scale={sc} showIcon status="info">{sc}</Badge>)}
      </Row>
      <Row label='the status dot — Badge scale="3xs" concept="dot", alone and inside a badge'>
        {STATUSES.map((s) => <Badge key={s} scale="3xs" concept="dot" status={s} />)}
        <Badge scale="3xs" concept="dot" emphasis="quiet" />
        {STATUSES.map((s) => (
          <Badge key={`in-${s}`} status={s} scale="xs"><Badge scale="3xs" concept="dot" status={s} /><span element="type--body-extra-small">{s}</span></Badge>
        ))}
      </Row>
      <Row label='the icon "dot" — the Lucide glyph: a grain in an empty box; not the way to draw a dot'>
        <Badge showIcon iconName="dot" status="success" emphasis="quiet">Active</Badge>
      </Row>
    </FixtureBody>
  );
}
