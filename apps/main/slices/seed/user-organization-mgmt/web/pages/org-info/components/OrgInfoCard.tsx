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
import { AvatarUploadField, Button, Card, Content, Footer, Header, Input, Label, Alert, AlertDescription, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { UploadError, uploadImage } from "../../../shared/helpers/upload";
import type { OrganizationView } from "../../../../shared/types/domain";
import { initialsOf } from "../../../shared/helpers/initials";
import { organizationsService } from "../../../services/application/organizations.service";
import { mounted } from "../../../services/application/mount";
import { isApiError } from "../../../shared/helpers/api-error";

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
  const { toast } = mounted();
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
          organizationsService.presignLogoUpload(organizationId, { contentType }),
        );
      }
      await organizationsService.updateOrganization(organizationId, {
        ...(nameChanged ? { name: trimmedName } : {}),
        ...(logo ? { logo } : {}),
      });
      setPendingLogo(null);
      toast?.success("Organization updated");
      onChanged();
    } catch (e) {
      setError(
        isApiError(e) || e instanceof UploadError
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
        <Header>
          <Stack dir="col" scale="3xs">
            <Text as="h2" type="heading4">Details</Text>
            <Text type="body-small" emphasis="quiet">
              The logo and the name shown across the platform.
            </Text>
          </Stack>
        </Header>
        <Content>
          <Stack dir="col" scale="md">
            <Stack dir="row" scale="lg" align="center">
              <Label>Logo</Label>
              <AvatarUploadField
                value={pendingLogo ?? org?.logo}
                onChange={setPendingLogo}
                fallback={fallback}
                uploadLabel="Change logo"
                disabled={saving || !org}
              />
            </Stack>
            <Stack dir="row" scale="lg" align="center">
              <Label htmlFor="org-info-name">
                Name
              </Label>
              <Input
                id="org-info-name"
                data-testid="org-info-name"
                value={name}
                onChange={(value) => setName(value)}
                position="fill"
              />
            </Stack>
            {error && (
              <Alert status="error" data-testid="org-info-error"><AlertDescription>{error}</AlertDescription></Alert>
            )}
          </Stack>
        </Content>
        <Footer position="fill">
          <Stack dir="row" justify="end" scale="sm" size="fill">
            <Button
              data-testid="org-info-save"
              type="submit"
              disabled={saving || nothingToSave}
            >
              Save
            </Button>
          </Stack>
        </Footer>
      </form>
    </Card>
  );
}
