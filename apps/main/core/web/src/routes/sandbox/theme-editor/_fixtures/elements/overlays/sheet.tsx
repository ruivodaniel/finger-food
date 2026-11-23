import { useState } from "react";
import { Sheet, SheetContent, Header, SheetTitle, SheetDescription, SheetTrigger, SheetClose, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function SheetFixture() {
  const [openRight, setOpenRight] = useState<boolean>(false);
  const [openLeft, setOpenLeft] = useState<boolean>(false);
  const [openTop, setOpenTop] = useState<boolean>(false);
  const [openBottom, setOpenBottom] = useState<boolean>(false);

  return (
    <FixtureBody>
      <Row label="right">
        <Sheet open={openRight} onOpenChange={setOpenRight}>
          <SheetTrigger asChild>
            <Button variant="outline">Open right sheet</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <Header>
              <SheetTitle>Right Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the right side of the screen.
              </SheetDescription>
            </Header>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </Row>

      <Row label="left">
        <Sheet open={openLeft} onOpenChange={setOpenLeft}>
          <SheetTrigger asChild>
            <Button variant="outline">Open left sheet</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Header>
              <SheetTitle>Left Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the left side of the screen.
              </SheetDescription>
            </Header>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </Row>

      <Row label="top">
        <Sheet open={openTop} onOpenChange={setOpenTop}>
          <SheetTrigger asChild>
            <Button variant="outline">Open top sheet</Button>
          </SheetTrigger>
          <SheetContent side="top">
            <Header>
              <SheetTitle>Top Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the top of the screen.
              </SheetDescription>
            </Header>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </Row>

      <Row label="bottom">
        <Sheet open={openBottom} onOpenChange={setOpenBottom}>
          <SheetTrigger asChild>
            <Button variant="outline">Open bottom sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <Header>
              <SheetTitle>Bottom Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the bottom of the screen.
              </SheetDescription>
            </Header>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </Row>
    </FixtureBody>
  );
}
