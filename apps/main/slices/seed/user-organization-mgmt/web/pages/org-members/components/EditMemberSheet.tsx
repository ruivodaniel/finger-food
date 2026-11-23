/**
 * EditMemberSheet — one member's roles (RoleSelect + save) and removal
 * (type-to-confirm). The server enforces last-owner protection and (later)
 * who may manage members; this sheet surfaces the outcome.
 *
 * SheetContent › Header › SheetTitle, then the form: a Stack of fields
 * (the roles), errors as an Alert, the actions in an end-justified row
 * (Remove, then Save).
 *
 * AC(availability-check): member.role.update / member.remove — the sheet
 * renders for every member until availability-check narrows visibility from
 * the engine's rules.
 */

import * as React from "react";
import { Button, Label, Sheet, SheetContent, Header, SheetTitle, Alert, AlertDescription, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { RoleSelect } from "./RoleSelect";
import { RemoveMemberModal } from "./RemoveMemberModal";
import type { MemberView } from "../../../../shared/types/domain";
import { membershipsService } from "../../../services/application/memberships.service";
import { isApiError } from "../../../shared/helpers/api-error";

export interface EditMemberSheetProps {
  /** The org whose member is edited — the shown org, not the active one. */
  organizationId: string;
  orgType: string | undefined;
  /** The member being edited; null keeps the sheet closed. */
  member: MemberView | null;
  onClose: () => void;
  onChanged: () => void;
}

export function EditMemberSheet({
  organizationId,
  orgType,
  member,
  onClose,
  onChanged,
}: EditMemberSheetProps): React.ReactElement {
  const [roles, setRoles] = React.useState<string[]>([]);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setRoles(member?.roles ?? []);
    setError(null);
    setRemoving(false);
  }, [member?.userId]);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      onChanged();
      onClose();
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const display = member?.name ?? member?.contact?.value ?? member?.userId ?? "";

  return (
    <Sheet open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-testid="edit-member-sheet">
        <Header><Stack dir="row" align="center" justify="between"><SheetTitle>{display}</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="edit-member-sheet-close-btn" /></SheetClose></Stack></Header>
        {member && (
          <Stack dir="col" scale="lg">
            <Stack dir="col" scale="xs">
              <Label>Roles</Label>
              <RoleSelect
                orgType={orgType}
                value={roles}
                onChange={setRoles}
                testId="edit-member-roles"
              />
            </Stack>
            {error && (
              <Alert status="error" data-testid="edit-member-error"><AlertDescription>{error}</AlertDescription></Alert>
            )}
            <Stack dir="row" justify="end" scale="sm">
              <Button
                data-testid="edit-member-remove"
                emphasis="secondary"
                status="destructive"
                onClick={() => setRemoving(true)}
              >
                Remove from organization
              </Button>
              <Button
                data-testid="edit-member-save"
                disabled={saving || roles.length === 0}
                onClick={() =>
                  void run(() =>
                    membershipsService.updateMemberRoles(organizationId, member.userId, roles),
                  )
                }
              >
                Save
              </Button>
            </Stack>
            <RemoveMemberModal
              open={removing}
              memberName={display}
              onCancel={() => setRemoving(false)}
              onConfirm={() =>
                void run(() => membershipsService.removeMember(organizationId, member.userId))
              }
            />
          </Stack>
        )}
      </SheetContent>
    </Sheet>
  );
}
