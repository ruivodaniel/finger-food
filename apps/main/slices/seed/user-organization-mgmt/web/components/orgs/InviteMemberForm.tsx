/**
 * InviteMemberForm — invite by email or phone with a role. Whether an org
 * type accepts invitations, and match strictness, are the server's call.
 *
 * A form of Stacked fields: the channel picker (when the org offers more
 * than one), the identifier field, the roles; errors as an Alert; the submit
 * in an end-justified action row.
 *
 * AC(availability-check): invitation.create — the form renders for every
 * member until availability-check narrows visibility from the engine's rules.
 */

import * as React from "react";
import { Button, Input, Label, PhoneInput } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { COUNTRY_ROWS } from "@libs/value-types";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { ApiError } from "../../lib/api-client";
import { RoleSelect } from "./RoleSelect";
import { StatusAlert } from "../StatusAlert";

export interface InviteMemberFormProps {
  /** The inviting org — the shown org, not the active one. */
  organizationId: string;
  orgType: string | undefined;
  channels: string[];
  onInvited: () => void;
}

export function InviteMemberForm({
  organizationId,
  orgType,
  channels,
  onInvited,
}: InviteMemberFormProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();

  const available = channels.length > 0 ? channels : ["email"];
  const [picked, setPicked] = React.useState<string | null>(null);
  const channel = picked && available.includes(picked) ? picked : available[0];
  const [value, setValue] = React.useState("");
  const [roles, setRoles] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.createInvitation(organizationId, { [channel]: value, roles });
      setValue("");
      setRoles([]);
      onInvited();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form data-testid="invite-member-form" onSubmit={submit}>
      <Stack dir="col" gap={16}>
        {available.length > 1 && (
          <Stack dir="col" gap={6}>
            <Label>Invite by</Label>
            <Stack dir="row" gap={8}>
              {available.map((option) => (
                <Button
                  key={option}
                  data-testid={`invite-channel-${option}`}
                  type="button"
                  scale="sm"
                  emphasis={channel === option ? "primary" : "secondary"}
                  onClick={() => {
                    setPicked(option);
                    setValue("");
                  }}
                >
                  {option === "phone" ? "Phone" : "Email"}
                </Button>
              ))}
            </Stack>
          </Stack>
        )}
        <Stack dir="col" gap={6}>
          <Label htmlFor="invite-value">
            {channel === "phone" ? "Phone number" : "Email"}
          </Label>
          {channel === "phone" ? (
            <PhoneInput
              id="invite-value"
              data-testid="invite-value"
              value={value}
              onChange={setValue}
              countryOptions={[...COUNTRY_ROWS]}
            />
          ) : (
            <Input
              id="invite-value"
              data-testid="invite-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="you@example.com"
            />
          )}
        </Stack>
        <Stack dir="col" gap={6}>
          <Label>Roles</Label>
          <RoleSelect
            orgType={orgType}
            value={roles}
            onChange={setRoles}
            testId="invite-role"
          />
        </Stack>
        {error && (
          <StatusAlert status="error" testId="invite-error">{error}</StatusAlert>
        )}
        <Stack dir="row" justify="end" gap={8}>
          <Button
            data-testid="invite-submit"
            type="submit"
            disabled={submitting || value.length === 0 || roles.length === 0}
          >
            Send invitation
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
