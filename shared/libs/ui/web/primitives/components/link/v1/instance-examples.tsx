import { Link, Text } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

export default function LinkFixture() {
  return (
    <FixtureBody>
      <Row label='type — default "link", then body sizes'>
        <Link href="#">A link</Link>
        <Link href="#" type="body-small">A small link</Link>
        <Link href="#" type="heading3">A heading link</Link>
      </Row>

      <Row label="emphasis and status">
        <Link href="#" emphasis="primary">Primary</Link>
        <Link href="#" emphasis="secondary">Secondary</Link>
        <Link href="#" emphasis="quiet">Quiet</Link>
        <Link href="#" status="error">Error</Link>
      </Row>

      <Row label="inline in text, external target">
        <Text as="p">
          Read the <Link href="https://example.com" target="_blank" rel="noreferrer">documentation</Link> before you start.
        </Text>
      </Row>
    </FixtureBody>
  );
}
