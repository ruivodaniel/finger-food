/**
 * ProfileDataForm — view and edit the caller's profile fields. Always shows
 * `name` plus any config-driven data field the caller has set (e.g. `age`) or
 * still owes to the gate (`profile_data_provided` obligations), prefilled from
 * the current profile. Saving writes via PATCH /me/profile and refreshes the
 * gate so an outstanding obligation clears in place.
 */

import * as React from "react";
import { Button, Input } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession, useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { initialsOf } from "../../lib/initials";
import { UserAvatarPicker } from "./UserAvatarPicker";

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
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();
  const { data: sessionData } = useSession();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [seeded, setSeeded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const { data: me } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => client.getMe(),
    enabled: !!sessionData?.session,
  });
  const { data: gate } = useQuery({
    queryKey: queryKeys.gate,
    queryFn: () => client.gateCheck(),
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
      await client.updateProfile({
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(Object.keys(rest).length > 0 ? { data: rest } : {}),
      });
      await invalidateSession();
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Required (still-owed) fields must be filled before saving; already-set
  // fields can be edited freely.
  const missingRequired = outstanding.some((field) => !values[field]?.trim());

  return (
    <form data-testid="profile-data-form" onSubmit={submit}>
      <Stack dir="col" gap={12}>
      <h2 element="type--heading4">Your details</h2>
      {me && (
        <UserAvatarPicker
          image={profile?.image}
          fallback={initialsOf(values.name ?? profile?.name ?? "")}
          onError={setError}
        />
      )}
      {fields.map((field) => (
        <label key={field}>
          <Stack dir="col" gap={4}>
          <span
            element="type--body-small"
            style={{ textTransform: "capitalize" }}
          >
            {field}
            {outstanding.includes(field) ? " (required)" : ""}
          </span>
          <Input
            data-testid={`profile-data-${field}`}
            value={values[field] ?? ""}
            onChange={(e) => setField(field, e.target.value)}
          />
          </Stack>
        </label>
      ))}
      {error && (
        <p
          element="type--body-small"
          data-testid="profile-data-error"
          role="alert"
        >
          {error}
        </p>
      )}
      <Stack dir="row" gap={8} align="center">
        <Button
          data-testid="profile-data-submit"
          type="submit"
          disabled={submitting || missingRequired}
        >
          Save
        </Button>
        {saved && (
          <span element="type--body-small" data-testid="profile-data-saved">
            Saved
          </span>
        )}
      </Stack>
      </Stack>
    </form>
  );
}
