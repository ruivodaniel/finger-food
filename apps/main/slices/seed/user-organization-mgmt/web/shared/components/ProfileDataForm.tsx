/**
 * ProfileDataForm — view and edit the caller's profile fields. Always shows
 * `name` plus any config-driven data field the caller has set (e.g. `age`) or
 * still owes to the gate (`profile_data_provided` obligations), prefilled from
 * the current profile. Saving writes via PATCH /me/profile and refreshes the
 * gate so an outstanding obligation clears in place.
 */

import * as React from "react";
import { Button, Input, Label, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { initialsOf } from "../helpers/initials";
import { UserAvatarPicker } from "./UserAvatarPicker";
import { authenticationService } from "../../services/application/authentication.service";
import { profileService } from "../../services/application/profile.service";
import { onboardingService } from "../../services/application/onboarding.service";
import { isApiError } from "../helpers/api-error";

/** name first, then fields already on the profile, then any still owed. */
function fieldsToShow(
  data: Record<string, unknown> | undefined,
  outstanding: string[],
): string[] {
  const fields = ["name"];
  for (const key of Object.keys(data ?? {})) {
    if (!fields.includes(key)) fields.push(key);
  }
  for (const field of outstanding) {
    if (!fields.includes(field)) fields.push(field);
  }
  return fields;
}


export function ProfileDataForm(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const invalidateSession = authenticationService.refreshSession;
  const { data: sessionData } = useQuery(authenticationService.getSession());
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [seeded, setSeeded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const { data: me } = useQuery({
    ...profileService.getProfile(),
    enabled: !!sessionData?.session,
  });
  const { data: gate } = useQuery({
    ...onboardingService.evaluate(),
    enabled: !!sessionData?.session,
    refetchOnMount: "always",
  });

  const profile = me?.profile;

  // Fields the gate still requires (unmet obligations only).
  const outstanding =
    gate && "obligations" in gate
      ? gate.obligations
          .filter((o) => o.require === "profile_data_provided" && o.dataField)
          .map((o) => o.dataField as string)
      : [];

  const fields = fieldsToShow(profile?.data, outstanding);

  // Seed the inputs from the current profile once it loads.
  React.useEffect(() => {
    if (seeded || !profile) return;
    const seed: Record<string, string> = { name: profile.name ?? "" };
    for (const [key, value] of Object.entries(profile.data)) {
      seed[key] = value == null ? "" : String(value);
    }
    setValues(seed);
    setSeeded(true);
  }, [seeded, profile]);

  if (!sessionData?.session) return null;

  const setField = (field: string, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // `name` is a first-class profile column; every other field is a
      // config-driven data field (matches the gate's read at gate.service.ts).
      const { name, ...rest } = values;
      const trimmedName = name?.trim();
      await profileService.updateProfile({
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(Object.keys(rest).length > 0 ? { data: rest } : {}),
      });
      await invalidateSession();
      await queryClient.invalidateQueries({ queryKey: profileService.keys.me });
      setSaved(true);
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Required (still-owed) fields must be filled before saving; already-set
  // fields can be edited freely.
  const missingRequired = outstanding.some((field) => !values[field]?.trim());

  return (
    <form data-testid="profile-data-form" onSubmit={submit}>
      <Stack dir="col" scale="md">
      <Text as="h2" type="heading4">Your details</Text>
      {me && (
        <UserAvatarPicker
          image={profile?.image}
          fallback={initialsOf(values.name ?? profile?.name ?? "")}
          onError={setError}
        />
      )}
      {fields.map((field) => (
        <Stack key={field} dir="col" scale="2xs">
          <Label htmlFor={`profile-data-${field}`}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {outstanding.includes(field) ? " (required)" : ""}
          </Label>
          <Input
            id={`profile-data-${field}`}
            data-testid={`profile-data-${field}`}
            value={values[field] ?? ""}
            onChange={(value) => setField(field, value)}
          />
        </Stack>
      ))}
      {error && (
        <Text as="p" type="body-small"
data-testid="profile-data-error"
          role="alert"
        >
          {error}
        </Text>
      )}
      <Stack dir="row" scale="sm" align="center">
        <Button
          data-testid="profile-data-submit"
          type="submit"
          disabled={submitting || missingRequired}
        >
          Save
        </Button>
        {saved && (
          <Text type="body-small" data-testid="profile-data-saved">
            Saved
          </Text>
        )}
      </Stack>
      </Stack>
    </form>
  );
}
