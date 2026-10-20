/**
 * PasswordSignInCard — resolution for a factor_session_verified(password)
 * obligation. Only a fresh password sign-in can prove the factor on this
 * session, so the card explains that and signs the caller out toward login,
 * carrying the wizard (with its original intention) as the login intention —
 * after signing back in, resolution resumes where it left off.
 *
 * A Card: the header carries the title and the explanation, the footer the
 * one action. No inline styles.
 */

import * as React from "react";
import { Button, Card, CardFooter, CardHeader } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useLogout } from "../../hooks/use-logout";

export interface PasswordSignInCardProps {
  loginPath?: string;
}

export function PasswordSignInCard({
  loginPath = "/login",
}: PasswordSignInCardProps): React.ReactElement {
  const { router } = useUserOrgMgmtContext();
  const logout = useLogout({
    loginPath,
    // Come back to the wizard (and, through it, the original intention).
    intention: router?.currentPath?.(),
  });

  return (
    <Card data-testid="password-sign-in-card" position="fill">
      <CardHeader>
        <Stack dir="col" gap={4}>
          <h2 element="type--heading4">Sign in with your password</h2>
          <span element="type--body-small" emphasis="quiet">
            This area requires a session signed in with your password. Sign out and sign
            back in with it to continue.
          </span>
        </Stack>
      </CardHeader>
      <CardFooter position="fill">
        <Stack dir="row" justify="end" gap={8} className="w-full">
          <Button data-testid="password-sign-in-signout" onClick={() => void logout()}>
            Sign out and sign back in
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}
