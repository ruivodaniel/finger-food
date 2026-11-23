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
import { Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { IdentifiersList } from "./IdentifiersList";
import { AddIdentifierForm } from "./AddIdentifierForm";
import { authenticationService } from "../../services/application/authentication.service";

export function IdentifierResolution(): React.ReactElement | null {
  const invalidateSession = authenticationService.refreshSession;
  const { data: sessionData } = useQuery(authenticationService.getSession());

  // Same query AddIdentifierForm runs (react-query dedupes) — the heading
  // names only the identifier types the config actually offers.
  const { data: authConfig } = useQuery({
    ...authenticationService.getAuthConfig("authentication"),
    enabled: !!sessionData?.session,
  });
  const offersPhone = (authConfig?.identifiers ?? []).includes("phone");

  if (!sessionData?.session) return null;

  return (
    <Stack dir="col" scale="lg" data-testid="identifier-resolution">
      <IdentifiersList />
      <Text as="h2" type="heading4">
        {offersPhone ? "Add an email or phone number" : "Add an email"}
      </Text>
      <AddIdentifierForm onChanged={() => void invalidateSession()} />
    </Stack>
  );
}
