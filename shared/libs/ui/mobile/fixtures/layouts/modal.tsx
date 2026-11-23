import { Button } from "@libs/mobile-components";
import { ActionBar, AppBar, Body, Screen } from "@libs/mobile-layouts";
import { Note, Rows } from "./_parts";

/** A modal screen: Cancel before the title, no tab bar, the main action fixed under the body. */
export default function ModalLayoutFixture() {
  return (
    <Screen>
      <AppBar align="center" title="Invite member" start={<Button emphasis="quiet">Cancel</Button>} />
      <Body>
        <Note>Screen · AppBar (center, Cancel) · Body · ActionBar</Note>
        <Rows count={4} />
      </Body>
      <ActionBar><Button emphasis="hero" fill>Send invitation</Button></ActionBar>
    </Screen>
  );
}
