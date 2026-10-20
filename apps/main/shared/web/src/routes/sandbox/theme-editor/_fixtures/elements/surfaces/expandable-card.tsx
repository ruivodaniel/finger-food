import { ExpandableCard } from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function ExpandableCardFixture() {
  return (
    <FixtureBody>
      <Row label="basic">
        <ExpandableCard title="Card title" description="Short description here.">
          <p>This is the expanded content of the card. It can contain any child elements.</p>
        </ExpandableCard>
      </Row>
      <Row label="icon left">
        <ExpandableCard iconName="info" iconPosition="left" title="With icon" description="Icon on the left.">
          <p>Expanded content with icon on the left side of the header.</p>
        </ExpandableCard>
      </Row>
      <Row label="icon right">
        <ExpandableCard iconName="info" iconPosition="right" title="With icon" description="Icon on the right.">
          <p>Expanded content with icon on the right side of the header.</p>
        </ExpandableCard>
      </Row>
      <Row label="default collapsed">
        <ExpandableCard title="Collapsed by default" defaultOpen={false} description="Click to expand.">
          <p>This content is hidden until the user clicks to expand the card.</p>
        </ExpandableCard>
      </Row>
    </FixtureBody>
  );
}
