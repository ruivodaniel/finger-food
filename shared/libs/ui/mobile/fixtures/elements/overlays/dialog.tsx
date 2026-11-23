import { Button, Dialog } from "@libs/mobile-components";
import { Body, Screen } from "@libs/mobile-layouts";
import { Row } from "../../_chrome";

/** Dialog fixture — open over a screen: a question with its two answers. */
export default function DialogFixture() {
  return (
    <Screen>
      <Body>
        <Row label="the screen under the dialog"><Button emphasis="secondary">Remove member</Button></Row>
      </Body>
      <Dialog
        open
        title="Remove Lena Fischer?"
        description="Lena will lose access to Riverside Tennis Club. This can not be undone."
        actions={<><Button emphasis="quiet">Cancel</Button><Button emphasis="primary" status="destructive">Remove</Button></>}
      />
    </Screen>
  );
}
