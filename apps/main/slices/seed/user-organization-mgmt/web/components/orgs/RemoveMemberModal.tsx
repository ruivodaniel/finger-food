/**
 * RemoveMemberModal — type-to-confirm removal ("confirm member"). The server
 * still enforces last-owner protection; this modal only prevents accidents.
 * The phrase field is a labelled field Stack between the text and the buttons.
 *
 * AC(availability-check): member.remove — the modal opens for every member
 * until availability-check narrows visibility from the engine's rules.
 */
import * as React from "react";
import { Input, Label } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ConfirmModal } from "../ConfirmModal";

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
  return (
    <ConfirmModal
      open={open}
      onCancel={() => {
        setPhrase("");
        onCancel();
      }}
      onConfirm={() => {
        setPhrase("");
        onConfirm();
      }}
      title={`Remove ${memberName}?`}
      description={`They lose access to this organization. Type "${CONFIRM_PHRASE}" to confirm.`}
      confirmLabel="Remove"
      destructive
      confirmDisabled={phrase !== CONFIRM_PHRASE}
      confirmDisabledReason={`Type "${CONFIRM_PHRASE}" to enable`}
      cancelTestId="remove-member-cancel"
      confirmTestId="remove-member-confirm"
    >
      <Stack dir="col" gap={6}>
        <Label htmlFor="remove-member-phrase">Confirmation</Label>
        <Input
          id="remove-member-phrase"
          data-testid="remove-member-phrase"
          value={phrase}
          placeholder={CONFIRM_PHRASE}
          onChange={(e) => setPhrase(e.target.value)}
        />
      </Stack>
    </ConfirmModal>
  );
}
