/**
 * MembersTable — an org's members: one row per member, the cells stacked
 * (Avatar beside name over the default contact · the roles as quiet Badges ·
 * the edit action at the row end). Actions always render — the server
 * enforces who may actually change anything. EmptyState when nothing
 * matches. The roles testid wraps the badges.
 */

import * as React from "react";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useComponents } from "../../hooks/use-components";
import { useRoleLabels } from "../../hooks/use-role-labels";
import type { MemberView } from "../../../shared/types/domain";
import { EmptyState } from "../EmptyState";

export interface MembersTableProps {
  orgType: string | undefined;
  members: MemberView[];
  onEdit: (member: MemberView) => void;
}

export function MembersTable({
  orgType,
  members,
  onEdit,
}: MembersTableProps): React.ReactElement {
  const { UserAvatar } = useComponents();
  const roleLabels = useRoleLabels(orgType);

  if (members.length === 0) {
    return (
      <EmptyState
        kind="no-results"
        testId="members-empty"
        icon="users"
        title="No members match"
        description="Try another name, or clear the search."
      />
    );
  }
  return (
    <Table data-testid="members-table">
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const display = member.name ?? member.contact?.value ?? member.userId;
          return (
            <TableRow key={member.userId} data-testid={`member-${member.userId}`}>
              <TableCell>
                <UserAvatar
                  name={display}
                  image={member.image}
                  scale="sm"
                  showName
                  detail={member.contact?.value ?? "—"}
                  detailTestId={`member-${member.userId}-contact`}
                />
              </TableCell>
              <TableCell>
                <Stack
                  dir="row"
                  align="center"
                  gap={4}
                  wrap
                  data-testid={`member-${member.userId}-roles`}
                >
                  {member.roles.map((role) => (
                    <Badge key={role} emphasis="quiet">
                      {roleLabels([role])}
                    </Badge>
                  ))}
                </Stack>
              </TableCell>
              <TableCell>
                <Stack dir="row" justify="end">
                  <Button
                    data-testid={`member-${member.userId}-edit`}
                    buttonType="icon"
                    startIcon="edit"
                    emphasis="quiet"
                    scale="sm"
                    aria-label={`Edit ${display}`}
                    onClick={() => onEdit(member)}
                  />
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
