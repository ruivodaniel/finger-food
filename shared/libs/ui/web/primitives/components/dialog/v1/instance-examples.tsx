import { Dialog, DialogContent, Header, DialogTitle, DialogDescription, Footer, DialogTrigger, DialogClose, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function DialogFixture() {
  return (
    <FixtureBody>
      <Row label="sm">
        <Instance id="sm" initial={{ config: { scale: "sm" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                  <Button emphasis="secondary">Open sm dialog</Button>
                </DialogTrigger>
                <DialogContent scale={x.config.scale}>
                  <Header>
                    <DialogTitle>Small Dialog</DialogTitle>
                    <DialogDescription>
                      This is a small dialog. It contains a brief description of the
                      action being performed.
                    </DialogDescription>
                  </Header>
                  <Footer>
                    <DialogClose asChild>
                      <Button emphasis="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onOpenChange(false)}>Confirm</Button>
                  </Footer>
                </DialogContent>
              </Dialog>
            );
          }}
        </Instance>
      </Row>

      <Row label="md">
        <Instance id="md" initial={{ config: { scale: "md" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                  <Button emphasis="secondary">Open md dialog</Button>
                </DialogTrigger>
                <DialogContent scale={x.config.scale}>
                  <Header>
                    <DialogTitle>Medium Dialog</DialogTitle>
                    <DialogDescription>
                      This is a medium dialog. It contains a more detailed description
                      of the action being performed, with a bit more room for content.
                    </DialogDescription>
                  </Header>
                  <Footer>
                    <DialogClose asChild>
                      <Button emphasis="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onOpenChange(false)}>Confirm</Button>
                  </Footer>
                </DialogContent>
              </Dialog>
            );
          }}
        </Instance>
      </Row>

      <Row label="lg">
        <Instance id="lg" initial={{ config: { scale: "lg" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                  <Button emphasis="secondary">Open lg dialog</Button>
                </DialogTrigger>
                <DialogContent scale={x.config.scale}>
                  <Header>
                    <DialogTitle>Large Dialog</DialogTitle>
                    <DialogDescription>
                      This is a large dialog. It provides ample space for more complex
                      content, forms, or detailed information that requires additional
                      room to display properly.
                    </DialogDescription>
                  </Header>
                  <Footer>
                    <DialogClose asChild>
                      <Button emphasis="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onOpenChange(false)}>Confirm</Button>
                  </Footer>
                </DialogContent>
              </Dialog>
            );
          }}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
