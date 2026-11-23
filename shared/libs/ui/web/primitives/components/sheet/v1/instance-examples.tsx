import { Sheet, SheetContent, Header, SheetTitle, SheetDescription, SheetTrigger, SheetClose, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function SheetFixture() {
  return (
    <FixtureBody>
      <Row label="right">
        <Instance id="right" initial={{ config: { side: "right" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetTrigger asChild>
                  <Button emphasis="secondary">Open right sheet</Button>
                </SheetTrigger>
                <SheetContent side={x.config.side}>
                  <Header>
                    <SheetTitle>Right Sheet</SheetTitle>
                    <SheetDescription>
                      This sheet slides in from the right side of the screen.
                    </SheetDescription>
                  </Header>
                  <SheetClose asChild>
                    <Button emphasis="secondary" className="mt-4">
                      Close
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            );
          }}
        </Instance>
      </Row>

      <Row label="left">
        <Instance id="left" initial={{ config: { side: "left" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetTrigger asChild>
                  <Button emphasis="secondary">Open left sheet</Button>
                </SheetTrigger>
                <SheetContent side={x.config.side}>
                  <Header>
                    <SheetTitle>Left Sheet</SheetTitle>
                    <SheetDescription>
                      This sheet slides in from the left side of the screen.
                    </SheetDescription>
                  </Header>
                  <SheetClose asChild>
                    <Button emphasis="secondary" className="mt-4">
                      Close
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            );
          }}
        </Instance>
      </Row>

      <Row label="top">
        <Instance id="top" initial={{ config: { side: "top" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetTrigger asChild>
                  <Button emphasis="secondary">Open top sheet</Button>
                </SheetTrigger>
                <SheetContent side={x.config.side}>
                  <Header>
                    <SheetTitle>Top Sheet</SheetTitle>
                    <SheetDescription>
                      This sheet slides in from the top of the screen.
                    </SheetDescription>
                  </Header>
                  <SheetClose asChild>
                    <Button emphasis="secondary" className="mt-4">
                      Close
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            );
          }}
        </Instance>
      </Row>

      <Row label="bottom">
        <Instance id="bottom" initial={{ config: { side: "bottom" }, data: { open: false } }}>
          {(x) => {
            const { open, onOpenChange } = x.bind("open", "open", "onOpenChange") as { open: boolean; onOpenChange: (open: boolean) => void };
            return (
              <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetTrigger asChild>
                  <Button emphasis="secondary">Open bottom sheet</Button>
                </SheetTrigger>
                <SheetContent side={x.config.side}>
                  <Header>
                    <SheetTitle>Bottom Sheet</SheetTitle>
                    <SheetDescription>
                      This sheet slides in from the bottom of the screen.
                    </SheetDescription>
                  </Header>
                  <SheetClose asChild>
                    <Button emphasis="secondary" className="mt-4">
                      Close
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            );
          }}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
