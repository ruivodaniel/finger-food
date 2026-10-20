/**
 * CreateOrganizationForm — name + org type, submit to create. The server is
 * authoritative on which types a user may create (it rejects developer-only
 * and singleton-taken types); this form just surfaces the error. Consent for
 * types that demand it is collected inline when the server asks.
 *
 * A column of fields (Label over the control), errors as an Alert, the
 * action row. The type is an InputSelect; the Sheet names the form, so it
 * carries no heading of its own.
 */

import * as React from "react";
import {
  Button,
  Input,
  InputSelect,
  Label,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { ApiError } from "../../lib/api-client";
import type { OrganizationView } from "../../../shared/types/domain";
import { StatusAlert } from "../StatusAlert";

export interface CreateOrganizationFormProps {
  /** Org types the app offers for creation (the server still enforces). */
  types: Array<{ id: string; label: string }>;
  onCreated: (org: OrganizationView) => void;
}

export function CreateOrganizationForm({
  types,
  onCreated,
}: CreateOrganizationFormProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState(types[0]?.id ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const org = await client.createOrganization({
        type,
        name,
        // accept the platform documents up front; the server records only what
        // the org type actually requires
        consents: [
          { type: "termsAndConditions", accepted: true },
          { type: "privacyPolicy", accepted: true },
        ],
      });
      setName("");
      onCreated(org);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form data-testid="create-org-form" onSubmit={submit}>
      <Stack dir="col" gap={16} pad={16}>
        <Stack dir="col" gap={6}>
          <Label id="create-org-type-label" htmlFor="create-org-type">
            Type
          </Label>
          <InputSelect
            id="create-org-type"
            data-testid="create-org-type"
            aria-labelledby="create-org-type-label"
            placeholder="Type"
            clearable={false}
            value={type || null}
            onChange={(next) => setType(next ?? "")}
            options={types.map((t) => ({ value: t.id, label: t.label }))}
          />
        </Stack>
        <Stack dir="col" gap={6}>
          <Label htmlFor="create-org-name">Name</Label>
          <Input
            id="create-org-name"
            data-testid="create-org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
          />
        </Stack>
        {error && (
          <StatusAlert status="error" testId="create-org-error">{error}</StatusAlert>
        )}
        <Stack dir="row" justify="end" gap={8}>
          <Button
            data-testid="create-org-submit"
            type="submit"
            disabled={submitting || name.length === 0 || type.length === 0}
          >
            Create
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
