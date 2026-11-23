import { Button } from "@libs/mobile-components";
import { ActionBar, AppBar, Body, Screen } from "@libs/mobile-layouts";
import { Note, Rows } from "./_parts";

/** A pushed screen: back before the title, the title in the middle, the main action fixed under the body. */
export default function PushLayoutFixture() {
  return (
    <Screen>
      <AppBar align="center" title="Member" start={<Button emphasis="quiet" startIcon="chevronLeft" accessibilityLabel="Back" />} />
      <Body>
        <Note>Screen · AppBar (center) · Body · ActionBar</Note>
        <Rows count={12} />
      </Body>
      <ActionBar><Button emphasis="hero" fill>Save</Button></ActionBar>
    </Screen>
  );
}
