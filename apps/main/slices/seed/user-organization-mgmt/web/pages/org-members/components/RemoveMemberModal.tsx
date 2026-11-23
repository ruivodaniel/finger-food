/**
 * RemoveMemberModal — type-to-confirm removal ("confirm member"). The server
 * still enforces last-owner protection; this modal only prevents accidents.
 * The phrase field is a labelled field Stack between the text and the buttons.
 *
 * AC(availability-check): member.remove — the modal opens for every member
 * until availability-check narrows visibility from the engine's rules.
 */
import * as React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, Footer, Header, AlertDialogTitle, Input, Label } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

const CONFIRM_PHRASE = "confirm member";

export interface RemoveMemberModalProps {
  open: boolean;
  memberName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveMemberModal({
  open,
  memberName,
  onCancel,
  onConfirm,
}: RemoveMemberModalProps): React.ReactElement {
  const [phrase, setPhrase] = React.useState("");
  const cancel = () => {
    setPhrase("");
    onCancel();
  };
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && cancel()}>
      <AlertDialogContent status="destructive">
        <Header>
          <AlertDialogTitle>{`Remove ${memberName}?`}</AlertDialogTitle>
          <AlertDialogDescription>{`They lose access to this organization. Type "${CONFIRM_PHRASE}" to confirm.`}</AlertDialogDescription>
        </Header>
        <Stack dir="col" scale="xs">
          <Label htmlFor="remove-member-phrase">Confirmation</Label>
          <Input
            id="remove-member-phrase"
            data-testid="remove-member-phrase"
            value={phrase}
            placeholder={CONFIRM_PHRASE}
            onChange={(value) => setPhrase(value)}
          />
        </Stack>
        <Footer>
          <AlertDialogCancel data-testid="remove-member-cancel">Cancel</AlertDialogCancel>
          <AlertDialogAction
            data-testid="remove-member-confirm"
            status="destructive"
            disabled={phrase !== CONFIRM_PHRASE}
            disabledReason={`Type "${CONFIRM_PHRASE}" to enable`}
            onClick={() => {
              setPhrase("");
              onConfirm();
            }}
          >
            Remove
          </AlertDialogAction>
        </Footer>
      </AlertDialogContent>
    </AlertDialog>
  );
}
