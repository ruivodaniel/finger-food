import { Button, List, ListItem, Sheet } from "@libs/mobile-components";
import { Body, Screen } from "@libs/mobile-layouts";
import { Row } from "../../_chrome";

/** Sheet fixture — open over a screen: a short choice that does not leave the screen. */
export default function SheetFixture() {
  return (
    <Screen>
      <Body>
        <Row label="the screen under the sheet"><Button emphasis="secondary">Change role</Button></Row>
      </Body>
      <Sheet open title="Role">
        <List>
          <ListItem title="Owner" description="Everything, including billing" onPress={() => {}} />
          <ListItem title="Admin" description="Members and settings" selected onPress={() => {}} />
          <ListItem title="Member" description="The organization's content" onPress={() => {}} />
        </List>
      </Sheet>
    </Screen>
  );
}
