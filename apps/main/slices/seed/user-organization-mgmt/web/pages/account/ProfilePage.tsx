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
import { Card, CardContent } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { ProfileDataForm } from "../../components/account/ProfileDataForm";

export interface ProfilePageProps {
  loginPath?: string;
  securityPath?: string;
}

export function ProfilePage({
  loginPath = "/login",
}: ProfilePageProps): React.ReactElement | null {
  const { router } = useUserOrgMgmtContext();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  return (
    <Stack dir="col" gap={24} data-testid="profile-page" className="w-full max-w-2xl">
      <Stack dir="col" gap={4}>
        <h2 element="type--heading3">Profile</h2>
        <span element="type--body-small" emphasis="quiet">
          Your avatar, your name and the details this product asks for.
        </span>
      </Stack>

      <Card>
        <CardContent>
          <ProfileDataForm />
        </CardContent>
      </Card>
    </Stack>
  );
}
