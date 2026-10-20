/**
 * OrgInfoCard — one organization's identity, edited in one place: logo
 * (picked file previews locally, uploads on save through the module's own
 * presign endpoint — server-derived key) and name, committed together by a
 * single Save. Targets the SHOWN org (organizationId), which may not be the
 * active one.
 *
 * A Card: the "Details" header, rows of a quiet label beside its control
 * (Logo · Name), errors as an Alert, Save in the footer. No inline styles.
 *
 * WHO may edit is server-enforced. AC(availability-check):
 * organization.update — controls stay visible until availability-check
 * narrows visibility from the engine's rules.
 */

import * as React from "react";
import {
  AvatarUploadField,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { ApiError } from "../../lib/api-client";
import { UploadError, uploadImage } from "../../lib/upload";
import type { OrganizationView } from "../../../shared/types/domain";
import { initialsOf } from "../../lib/initials";
import { StatusAlert } from "../StatusAlert";

export interface OrgInfoCardProps {
  /** The edited org — the shown org, not the active one. */
  organizationId: string;
  org: OrganizationView | undefined;
  /** Called after a successful save so the page refreshes its org query. */
  onChanged: () => void;
}

export function OrgInfoCard({
  organizationId,
  org,
  onChanged,
}: OrgInfoCardProps): React.ReactElement {
  const { client, toast } = useUserOrgMgmtContext();
  const [name, setName] = React.useState("");
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Seed the inputs per org — the page can stay mounted while the shown org
  // changes, so edits staged for one org never leak into the next.
  React.useEffect(() => {
    if (!org || seededFor === org.id) return;
    setName(org.name);
    setPendingLogo(null);
    setError(null);
    setSeededFor(org.id);
  }, [seededFor, org]);

  const fallback = initialsOf(org?.name ?? "");
  const trimmedName = name.trim();
  const nameChanged = !!org && !!trimmedName && trimmedName !== org.name;
  const nothingToSave = !pendingLogo && !nameChanged;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!org) return;
    setSaving(true);
    setError(null);
    try {
      let logo: string | undefined;
      if (pendingLogo) {
        logo = await uploadImage(pendingLogo, (contentType) =>
          client.presignOrgLogoUpload(organizationId, { contentType }),
        );
      }
      await client.updateOrganization(organizationId, {
        ...(nameChanged ? { name: trimmedName } : {}),
        ...(logo ? { logo } : {}),
      });
      setPendingLogo(null);
      toast?.success("Organization updated");
      onChanged();
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof UploadError
          ? e.message
          : "something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid="org-info-card">
      <form onSubmit={submit}>
        <CardHeader>
          <Stack dir="col" gap={2}>
            <h2 element="type--heading4">Details</h2>
            <span element="type--body-small" emphasis="quiet">
              The logo and the name shown across the platform.
            </span>
          </Stack>
        </CardHeader>
        <CardContent>
          <Stack dir="col" gap={12}>
            <Stack dir="row" gap={16} align="center">
              <span element="type--body-small" emphasis="quiet" position="w-xs hug">
                Logo
              </span>
              <AvatarUploadField
                value={pendingLogo ?? org?.logo}
                onChange={setPendingLogo}
                fallback={fallback}
                uploadLabel="Change logo"
                disabled={saving || !org}
              />
            </Stack>
            <Stack dir="row" gap={16} align="center">
              <label
                element="type--body-small"
                emphasis="quiet"
                htmlFor="org-info-name"
                position="w-xs hug"
              >
                Name
              </label>
              <Input
                id="org-info-name"
                data-testid="org-info-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                position="fill"
              />
            </Stack>
            {error && (
              <StatusAlert status="error" testId="org-info-error">{error}</StatusAlert>
            )}
          </Stack>
        </CardContent>
        <CardFooter position="fill">
          <Stack dir="row" justify="end" gap={8} className="w-full">
            <Button
              data-testid="org-info-save"
              type="submit"
              disabled={saving || nothingToSave}
            >
              Save
            </Button>
          </Stack>
        </CardFooter>
      </form>
    </Card>
  );
}
