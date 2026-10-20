/**
 * AccountSettingsPage — the caller's sign-in identifiers as a LIST: one row
 * per address (its value, a Verified / Not verified badge, Remove), and below
 * it the form that adds another — as many as the product allows (3 emails,
 * 2 phones), each proven with a code. Requires a session; redirects to login
 * otherwise.
 *
 * The "Settings" title is the settings frame's; inside, the section heading
 * block, then two Cards — "Sign-in identifiers" (IdentifiersList) and "Add an
 * email…" (AddIdentifierForm), the same parts IdentifierResolution composes
 * in the /resolve wizard. Layout is Stack; no inline styles.
 */

import * as React from "react";
import { Card, CardContent, CardHeader } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession, useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { IdentifiersList } from "../../components/identifiers/IdentifiersList";
import { AddIdentifierForm } from "../../components/identifiers/AddIdentifierForm";

export interface AccountSettingsPageProps {
  loginPath?: string;
}

export function AccountSettingsPage({
  loginPath = "/login",
}: AccountSettingsPageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  const { data: authConfig } = useQuery({
    queryKey: queryKeys.authConfig("authentication"),
    queryFn: () => client.getAuthConfig({ intent: "authentication" }),
    enabled: !!sessionData?.session,
  });
  const offersPhone = (authConfig?.identifiers ?? []).includes("phone");

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  return (
    <Stack dir="col" gap={24} data-testid="account-settings-page" className="w-full max-w-2xl">
      <Stack dir="col" gap={4}>
        <h2 element="type--heading3">Account</h2>
        <span element="type--body-small" emphasis="quiet">
          The addresses you sign in with.
        </span>
      </Stack>

      <Stack dir="col" gap={16} data-testid="identifier-resolution">
        <Card>
          <CardHeader>
            <Stack dir="col" gap={2}>
              <h2 element="type--heading4">Sign-in identifiers</h2>
              <span element="type--body-small" emphasis="quiet">
                Every address on your account. Any verified one signs you in.
              </span>
            </Stack>
          </CardHeader>
          <CardContent>
            <IdentifiersList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Stack dir="col" gap={2}>
              <h2 element="type--heading4">
                {offersPhone ? "Add an email or phone number" : "Add an email"}
              </h2>
              <span element="type--body-small" emphasis="quiet">
                We send a code to the new address; it joins the list once you enter it. Up to 3
                emails{offersPhone ? " and 2 phone numbers" : ""}.
              </span>
            </Stack>
          </CardHeader>
          <CardContent>
            <AddIdentifierForm onChanged={() => void invalidateSession()} />
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
