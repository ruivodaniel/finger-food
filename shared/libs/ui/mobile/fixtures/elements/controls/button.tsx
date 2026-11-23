import { Button } from "@libs/mobile-components";
import { FixtureBody, Row } from "../../_chrome";

/**
 * Button fixture — every meaningful prop combination on the live Button.
 * The rows are the ones of the web's button fixture, minus what a phone does not have.
 */
export default function ButtonFixture() {
  return (
    <FixtureBody>
      <Row label="emphasis">
        <Button emphasis="hero">Hero</Button>
        <Button emphasis="primary">Primary</Button>
        <Button emphasis="secondary">Secondary</Button>
        <Button emphasis="tertiary">Tertiary</Button>
        <Button emphasis="quiet">Quiet</Button>
      </Row>

      <Row label='scale — emphasis="primary"'>
        <Button emphasis="primary" scale="xs">XS</Button>
        <Button emphasis="primary" scale="sm">SM</Button>
        <Button emphasis="primary" scale="md">MD</Button>
        <Button emphasis="primary" scale="lg">LG</Button>
      </Row>

      <Row label="status primary">
        <Button emphasis="primary" status="error">Error</Button>
        <Button emphasis="primary" status="warning">Warning</Button>
        <Button emphasis="primary" status="success">Success</Button>
        <Button emphasis="primary" status="destructive">Destructive</Button>
      </Row>

      <Row label="status secondary">
        <Button emphasis="secondary" status="error">Error</Button>
        <Button emphasis="secondary" status="warning">Warning</Button>
        <Button emphasis="secondary" status="success">Success</Button>
        <Button emphasis="secondary" status="destructive">Destructive</Button>
      </Row>

      <Row label="state">
        <Button emphasis="primary">Default</Button>
        <Button emphasis="primary" state="active">Active</Button>
        <Button emphasis="primary" state="selected">Selected</Button>
        <Button emphasis="primary" disabled>Disabled</Button>
        <Button emphasis="primary" loading>Loading</Button>
      </Row>

      <Row label="icons">
        <Button emphasis="primary" startIcon="add">Add</Button>
        <Button emphasis="secondary" endIcon="chevronRight">Next</Button>
        <Button emphasis="secondary" startIcon="search" accessibilityLabel="Search" />
      </Row>

      <Row label="fill">
        <Button emphasis="hero" fill>Submit attendance</Button>
      </Row>
    </FixtureBody>
  );
}
