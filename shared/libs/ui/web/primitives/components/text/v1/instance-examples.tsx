import { Text } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

export default function TextFixture() {
  return (
    <FixtureBody>
      <Row label="type — headings and body">
        <Text as="h1" type="heading1">Heading 1</Text>
        <Text as="h2" type="heading2">Heading 2</Text>
        <Text as="h3" type="heading3">Heading 3</Text>
        <Text as="p" type="body-large">Body large</Text>
        <Text as="p" type="body">Body</Text>
        <Text as="p" type="body-small">Body small</Text>
        <Text as="p" type="body-extra-small">Body extra small</Text>
      </Row>

      <Row label="type — quote, code, numbers">
        <Text as="p" type="quote">A quote, set by the theme.</Text>
        <Text type="code">const x = 1;</Text>
        <Text type="numbers-large">1,234.56</Text>
        <Text type="numbers">1,234.56</Text>
        <Text type="numbers-small">1,234.56</Text>
      </Row>

      <Row label='emphasis and status — type="body"'>
        <Text emphasis="hero">Hero</Text>
        <Text emphasis="primary">Primary</Text>
        <Text emphasis="secondary">Secondary</Text>
        <Text emphasis="quiet">Quiet</Text>
        <Text status="success">Success</Text>
        <Text status="warning">Warning</Text>
        <Text status="error">Error</Text>
      </Row>

      <Row label='truncate'>
        <Text truncate>A line long enough to be cut by its container, ending in an ellipsis.</Text>
      </Row>
    </FixtureBody>
  );
}
