/**
 * IdentifierResolution — the caller's sign-in identifiers as one
 * self-contained unit: the list (IdentifiersList — verified badges, remove)
 * and the add form (AddIdentifierForm → verification code). It satisfies the
 * gate's identifier_present / identifier_verified obligations in the /resolve
 * wizard; the account settings page lays the same two parts out as cards.
 * Every change invalidates session+me+gate, so an outstanding obligation
 * clears in place.
 */

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession, useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { IdentifiersList } from "./IdentifiersList";
import { AddIdentifierForm } from "./AddIdentifierForm";

export function IdentifierResolution(): React.ReactElement | null {
  const { client } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();
  const { data: sessionData } = useSession();

  // Same query AddIdentifierForm runs (react-query dedupes) — the heading
  // names only the identifier types the config actually offers.
  const { data: authConfig } = useQuery({
    queryKey: queryKeys.authConfig("authentication"),
    queryFn: () => client.getAuthConfig({ intent: "authentication" }),
    enabled: !!sessionData?.session,
  });
  const offersPhone = (authConfig?.identifiers ?? []).includes("phone");

  if (!sessionData?.session) return null;

  return (
    <Stack dir="col" gap={16} data-testid="identifier-resolution">
      <IdentifiersList />
      <h2 element="type--heading4">
        {offersPhone ? "Add an email or phone number" : "Add an email"}
      </h2>
      <AddIdentifierForm onChanged={() => void invalidateSession()} />
    </Stack>
  );
}
