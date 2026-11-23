import { useState } from "react";
import { Dialog, DialogContent, Header, DialogTitle, DialogDescription, Footer, DialogTrigger, DialogClose, Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { FixtureBody, Row } from "../_chrome";

export default function DialogFixture() {
  const [openSm, setOpenSm] = useState<boolean>(false);
  const [openMd, setOpenMd] = useState<boolean>(false);
  const [openLg, setOpenLg] = useState<boolean>(false);

  return (
    <FixtureBody>
      <Row label="sm">
        <Dialog open={openSm} onOpenChange={setOpenSm}>
          <DialogTrigger asChild>
            <Button variant="outline">Open sm dialog</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <Header>
              <Stack dir="row" align="start" justify="between">
                <Stack dir="col" scale="2xs">
                  <DialogTitle>Small Dialog</DialogTitle>
                  <DialogDescription>
                    This is a small dialog. It contains a brief description of the
                    action being performed.
                  </DialogDescription>
                </Stack>
                <DialogClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="dialog-fixture-close-btn-1" /></DialogClose>
              </Stack>
            </Header>
            <Footer>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => setOpenSm(false)}>Confirm</Button>
            </Footer>
          </DialogContent>
        </Dialog>
      </Row>

      <Row label="md">
        <Dialog open={openMd} onOpenChange={setOpenMd}>
          <DialogTrigger asChild>
            <Button variant="outline">Open md dialog</Button>
          </DialogTrigger>
          <DialogContent size="md">
            <Header>
              <Stack dir="row" align="start" justify="between">
                <Stack dir="col" scale="2xs">
                  <DialogTitle>Medium Dialog</DialogTitle>
                  <DialogDescription>
                    This is a medium dialog. It contains a more detailed description
                    of the action being performed, with a bit more room for content.
                  </DialogDescription>
                </Stack>
                <DialogClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="dialog-fixture-close-btn-2" /></DialogClose>
              </Stack>
            </Header>
            <Footer>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => setOpenMd(false)}>Confirm</Button>
            </Footer>
          </DialogContent>
        </Dialog>
      </Row>

      <Row label="lg">
        <Dialog open={openLg} onOpenChange={setOpenLg}>
          <DialogTrigger asChild>
            <Button variant="outline">Open lg dialog</Button>
          </DialogTrigger>
          <DialogContent size="lg">
            <Header>
              <Stack dir="row" align="start" justify="between">
                <Stack dir="col" scale="2xs">
                  <DialogTitle>Large Dialog</DialogTitle>
                  <DialogDescription>
                    This is a large dialog. It provides ample space for more complex
                    content, forms, or detailed information that requires additional
                    room to display properly.
                  </DialogDescription>
                </Stack>
                <DialogClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="dialog-fixture-close-btn-3" /></DialogClose>
              </Stack>
            </Header>
            <Footer>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => setOpenLg(false)}>Confirm</Button>
            </Footer>
          </DialogContent>
        </Dialog>
      </Row>
    </FixtureBody>
  );
}
