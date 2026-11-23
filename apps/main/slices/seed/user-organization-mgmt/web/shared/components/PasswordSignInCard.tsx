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
import { Button, Card, Footer, Header, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { authenticationService } from "../../services/application/authentication.service";
import { mounted } from "../../services/application/mount";

export interface PasswordSignInCardProps {
  loginPath?: string;
}

export function PasswordSignInCard({
  loginPath = "/login",
}: PasswordSignInCardProps): React.ReactElement {
  const { router } = mounted();
  const logout = () => authenticationService.signOut({
    loginPath,
    // Come back to the wizard (and, through it, the original intention).
    intention: router?.currentPath?.(),
  });

  return (
    <Card data-testid="password-sign-in-card" position="fill">
      <Header>
        <Stack dir="col" scale="2xs">
          <Text as="h2" type="heading4">Sign in with your password</Text>
          <Text type="body-small" emphasis="quiet">
            This area requires a session signed in with your password. Sign out and sign
            back in with it to continue.
          </Text>
        </Stack>
      </Header>
      <Footer position="fill">
        <Stack dir="row" justify="end" scale="sm" size="fill">
          <Button data-testid="password-sign-in-signout" onClick={() => void logout()}>
            Sign out and sign back in
          </Button>
        </Stack>
      </Footer>
    </Card>
  );
}
