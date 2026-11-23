import { AlertDialog, AlertDialogContent, Header, AlertDialogTitle, AlertDialogDescription, Footer, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function AlertDialogFixture() {
  return (
    <FixtureBody>
      <Row label="neutral">
        <Instance id="neutral" initial={{ config: { status: "neutral" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button emphasis="secondary">Open neutral alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent status={x.config.status}>
                  <Header>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will proceed with the selected operation. Please
                      confirm you want to continue.
                    </AlertDialogDescription>
                  </Header>
                  <Footer>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                      Continue
                    </AlertDialogAction>
                  </Footer>
                </AlertDialogContent>
              </AlertDialog>
            );
          }}
        </Instance>
      </Row>

      <Row label="warning">
        <Instance id="warning" initial={{ config: { status: "warning" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button emphasis="secondary">Open warning alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent status={x.config.status}>
                  <Header>
                    <AlertDialogTitle>Proceed with caution</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action may have unintended side effects. Please review
                      carefully before confirming.
                    </AlertDialogDescription>
                  </Header>
                  <Footer>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                      Proceed anyway
                    </AlertDialogAction>
                  </Footer>
                </AlertDialogContent>
              </AlertDialog>
            );
          }}
        </Instance>
      </Row>

      <Row label="destructive">
        <Instance id="destructive" initial={{ config: { status: "destructive" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button emphasis="primary" status="destructive">Open destructive alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent status={x.config.status}>
                  <Header>
                    <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      item and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </Header>
                  <Footer>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                      Delete
                    </AlertDialogAction>
                  </Footer>
                </AlertDialogContent>
              </AlertDialog>
            );
          }}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
