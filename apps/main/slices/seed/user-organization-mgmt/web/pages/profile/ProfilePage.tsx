/**
 * ProfilePage — the caller's profile details: avatar, name, config-driven
 * fields (via ProfileDataForm). Sign-in identifiers live on the account
 * settings page, not here. Requires a session; redirects to login otherwise.
 * Page chrome (shell, sign out) belongs to the hosting app.
 *
 * The "Settings" title is the settings frame's; inside, the section heading
 * block (Profile over a quiet line), then one Card holding the profile form,
 * which carries its own title ("Your details"). Layout is Stack; no inline
 * styles.
 */

import * as React from "react";
import { Card, Content, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ProfileDataForm } from "../../shared/components/ProfileDataForm";
import { authenticationService } from "../../services/application/authentication.service";
import { mounted } from "../../services/application/mount";
import { useQuery } from "@tanstack/react-query";

export interface ProfilePageProps {
  loginPath?: string;
  securityPath?: string;
}

export function ProfilePage({
  loginPath = "/login",
}: ProfilePageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  return (
    <Stack dir="col" scale="xl" data-testid="profile-page">
      <Stack dir="col" scale="2xs">
        <Text as="h2" type="heading3">Profile</Text>
        <Text type="body-small" emphasis="quiet">
          Your avatar, your name and the details this product asks for.
        </Text>
      </Stack>

      <Card>
        <Content>
          <ProfileDataForm />
        </Content>
      </Card>
    </Stack>
  );
}
