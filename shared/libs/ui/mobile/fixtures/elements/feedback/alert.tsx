import { Alert, Button } from "@libs/mobile-components";
import { FixtureBody, Block } from "../../_chrome";

/** Alert fixture — every status, then the parts an alert can carry. */
export default function AlertFixture() {
  return (
    <FixtureBody>
      <Block title="status">
        <Alert status="info" title="Invitation sent" description="Lena will get an email with a link to join." />
        <Alert status="success" title="Email verified" description="You can now sign in with this address." />
        <Alert status="warning" title="Invitation expires soon" description="This invitation expires in 2 days." />
        <Alert status="error" title="Code not valid" description="The code is wrong or has expired." />
      </Block>
      <Block title="parts">
        <Alert title="No status" description="A neutral alert has no icon of its own." />
        <Alert status="info" description="A description alone." />
        <Alert status="warning" title="With an action" description="Your session is about to end." action={<Button emphasis="secondary" scale="sm">Stay signed in</Button>} />
      </Block>
    </FixtureBody>
  );
}
