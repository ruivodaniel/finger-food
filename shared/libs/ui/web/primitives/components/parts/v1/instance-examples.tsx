import { Card, Content, Footer, Header, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const LINES = Array.from({ length: 14 }, (_, i) => `Line ${i + 1} of a content that is taller than its container.`);

export default function PartsFixture() {
  return (
    <FixtureBody>
      <Row label="a container with the three parts: the card owns the height, the content fills what is left and scrolls on y">
        <Card style={{ height: 260, width: 420 }}>
          <Header><span element="type--heading4">Header</span></Header>
          <Content overflow={{ y: "scroll" }}>{LINES.map((l) => <p key={l} element="type--body-small">{l}</p>)}</Content>
          <Footer><Button emphasis="primary">Save</Button></Footer>
        </Card>
      </Row>
      <Row label="align: the content places what it holds">
        <Card style={{ height: 180, width: 300 }}>
          <Content align={{ horizontal: "center", vertical: "center" }}><span element="type--body">centred</span></Content>
        </Card>
      </Row>
    </FixtureBody>
  );
}
