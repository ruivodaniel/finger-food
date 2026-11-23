import { Badge, Button, Card, CardAction, Content, CardDescription, Footer, Header, CardTitle } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

export default function CardFixture() {
  return (
    <FixtureBody>
      <Row label="default — header / content / footer">
        <Card style={{ maxWidth: 400 }}>
          <Header>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>A short description of this card.</CardDescription>
          </Header>
          <Content>
            <p element="type--body-small">Card body content goes here.</p>
          </Content>
          <Footer className="justify-end gap-2">
            <Button emphasis="secondary" scale="sm">Cancel</Button>
            <Button emphasis="primary" scale="sm">Save</Button>
          </Footer>
        </Card>
      </Row>

      <Row label="with action in header">
        <Card style={{ maxWidth: 400 }}>
          <Header>
            <CardTitle>Organization Status</CardTitle>
            <CardAction>
              <Badge status="success" scale="xs">Active</Badge>
            </CardAction>
          </Header>
          <Content>
            <p element="type--body-small">Platform Admin · 24 members</p>
          </Content>
        </Card>
      </Row>
    </FixtureBody>
  );
}
