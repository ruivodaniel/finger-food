/**
 * MembersTable — an org's members: one row per member, the cells stacked
 * (Avatar beside name over the default contact · the roles as quiet Badges ·
 * the edit action at the row end). Actions always render — the server
 * enforces who may actually change anything. EmptyState when nothing
 * matches. The roles testid wraps the badges.
 */

import * as React from "react";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Icon, Avatar, AvatarFallback, AvatarImage, Text } from "@libs/web-components";
import { initialsOf } from "../../../shared/helpers/initials";
import { Stack } from "@libs/web-layouts";
import { mounted } from "../../../services/application/mount";
import { roleLabels as labelsFor } from "../../../shared/helpers/role-labels";
import type { MemberView } from "../../../../shared/types/domain";

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
  const roleLabels = labelsFor(mounted().roleCatalog, orgType);

  if (members.length === 0) {
    return (
      <EmptyState emphasis="quiet"
        data-testid="members-empty"
        icon={<Icon name="users" />}
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
                <Stack dir="row" align="center" scale="sm">
                  <Avatar scale="sm">
                    {member.image && <AvatarImage src={member.image} alt="" />}
                    <AvatarFallback>{initialsOf(display)}</AvatarFallback>
                  </Avatar>
                  <Stack dir="col" scale="3xs" size="fill">
                    <Text type="body">{display}</Text>
                    <Text type="body-extra-small"
emphasis="quiet"
                    data-testid={`member-${member.userId}-contact`}>
                      {member.contact?.value ?? "—"}
                    </Text>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack
                  dir="row"
                  align="center" scale="2xs"
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
