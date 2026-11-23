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
import { Card, Content, Header, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { IdentifiersList } from "../../shared/components/IdentifiersList";
import { AddIdentifierForm } from "../../shared/components/AddIdentifierForm";
import { authenticationService } from "../../services/application/authentication.service";
import { mounted } from "../../services/application/mount";

export interface AccountSettingsPageProps {
  loginPath?: string;
}

export function AccountSettingsPage({
  loginPath = "/login",
}: AccountSettingsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const invalidateSession = authenticationService.refreshSession;
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  const { data: authConfig } = useQuery({
    ...authenticationService.getAuthConfig("authentication"),
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
    <Stack dir="col" scale="xl" data-testid="account-settings-page">
      <Stack dir="col" scale="2xs">
        <Text as="h2" type="heading3">Account</Text>
        <Text type="body-small" emphasis="quiet">
          The addresses you sign in with.
        </Text>
      </Stack>

      <Stack dir="col" scale="lg" data-testid="identifier-resolution">
        <Card>
          <Header>
            <Stack dir="col" scale="3xs">
              <Text as="h2" type="heading4">Sign-in identifiers</Text>
              <Text type="body-small" emphasis="quiet">
                Every address on your account. Any verified one signs you in.
              </Text>
            </Stack>
          </Header>
          <Content>
            <IdentifiersList />
          </Content>
        </Card>

        <Card>
          <Header>
            <Stack dir="col" scale="3xs">
              <Text as="h2" type="heading4">
                {offersPhone ? "Add an email or phone number" : "Add an email"}
              </Text>
              <Text type="body-small" emphasis="quiet">
                We send a code to the new address; it joins the list once you enter it. Up to 3
                emails{offersPhone ? " and 2 phone numbers" : ""}.
              </Text>
            </Stack>
          </Header>
          <Content>
            <AddIdentifierForm onChanged={() => void invalidateSession()} />
          </Content>
        </Card>
      </Stack>
    </Stack>
  );
}
