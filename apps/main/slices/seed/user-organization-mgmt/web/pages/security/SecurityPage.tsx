/**
 * SecurityPage — two-factor authentication management plus device hygiene.
 * Requires a session (redirects otherwise). The TOTP machine itself lives in
 * TwoFactorCard (shared with the /resolve wizard); this page mounts it
 * with management enabled and adds the signed-in-devices section.
 *
 * The "Settings" title is the settings frame's; inside, the section heading
 * block (Security over a quiet line), then one Card holding the two-factor
 * unit with the signed-in devices block as its child (TwoFactorCard
 * renders children only while idle, so the block hides mid-flow), then the
 * Profile link. The devices error is an Alert. Layout is Stack; no inline
 * styles.
 */

import * as React from "react";
import { Button, Card, Content, Alert, AlertDescription, Text, Link } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { TwoFactorCard } from "../../shared/components/TwoFactorCard";
import { authenticationService } from "../../services/application/authentication.service";
import { securityService } from "../../services/application/security.service";
import { mounted } from "../../services/application/mount";
import { isApiError } from "../../shared/helpers/api-error";
import { useQuery } from "@tanstack/react-query";

export interface SecurityPageProps {
  loginPath?: string;
  profilePath?: string;
}

export function SecurityPage({
  loginPath = "/login",
  profilePath = "/my/settings/profile",
}: SecurityPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  const [signedOutOthers, setSignedOutOthers] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const signOutOthers = async () => {
    setBusy(true);
    setError(null);
    try {
      await securityService.signOutOtherSessions();
      setSignedOutOthers(true);
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack dir="col" scale="xl" data-testid="security-page">
      <Stack dir="col" scale="2xs">
        <Text as="h2" type="heading3">Security</Text>
        <Text type="body-small" emphasis="quiet">
          Two-factor authentication for your account, and the devices signed in to it.
        </Text>
      </Stack>

      <Card>
        <Content>
          <TwoFactorCard showManagement>
            <Stack dir="col" scale="md">
              <Text as="h2" type="heading4">Signed-in devices</Text>
              {signedOutOthers ? (
                <Text type="body-small"
status="success"
                  data-testid="security-signed-out-others"
                >
                  Done — every other device has been signed out.
                </Text>
              ) : (
                <>
                  <Text type="body-small">
                    See something you don't recognize? Sign out everywhere else — this
                    device stays signed in.
                  </Text>
                  <Stack dir="row" scale="sm">
                    <Button
                      data-testid="security-sign-out-others"
                      emphasis="secondary"
                      onClick={() => void signOutOthers()}
                      disabled={busy}
                    >
                      Sign out of all other devices
                    </Button>
                  </Stack>
                </>
              )}
              {error && (
                <Alert status="error" data-testid="security-devices-error"><AlertDescription>{error}</AlertDescription></Alert>
              )}
            </Stack>
          </TwoFactorCard>
        </Content>
      </Card>

      <Text type="body-small">
        <Link
          href={profilePath}
          onClick={(e) => {
            e.preventDefault();
            void router?.navigate({ to: profilePath });
          }}
        >
          Profile →
        </Link>
      </Text>
    </Stack>
  );
}
